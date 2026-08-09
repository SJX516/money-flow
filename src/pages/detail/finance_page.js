import {
    Alert, Button, Card, Checkbox, Col, Divider, Input, Layout, Popconfirm, Row, Select,
    Space, Spin, Tabs, Typography, message
} from "antd";
import React from "react";
import MarketDataService from "../../domain/market/market_data_service";
import { normalizeStockCode } from "../../domain/market/market_provider";
import { MarketAmountChart, StockKlineChart, ValuationChart } from "./finance/market_charts";
import RangeTimeline from "./finance/range_timeline";
import { zoomDateRange } from "./finance/chart_utils";
import TargetManager from "./finance/target_manager";

const { Content } = Layout;
const { Text } = Typography;
const LAST_STOCK_KEY = "money-flow.finance.last-stock";
const readLastStock = () => {
    try { return window.localStorage.getItem(LAST_STOCK_KEY); } catch (error) { return null; }
};
const saveLastStock = code => {
    try {
        if (code) window.localStorage.setItem(LAST_STOCK_KEY, code);
        else window.localStorage.removeItem(LAST_STOCK_KEY);
    } catch (error) {
        // 浏览器禁用本地存储时仅不记忆选择，不影响行情功能。
    }
};
const today = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

class FinancePage extends React.Component {
    constructor(props) {
        super(props);
        this.wheelTimer = null;
        this.state = {
            dbReady: MarketDataService.isReady(), stocks: [], selectedCode: null,
            startDate: "2015-01-01", endDate: today(),
            viewStartDate: "2015-01-01", viewEndDate: today(), stockData: null, marketData: [], metrics: ["pe", "pb", "dividend"],
            stockTargets: [], marketTargets: [], loading: false, progress: "", activeTab: "stock"
        };
    }

    componentDidMount() {
        this.refreshState();
    }

    componentWillUnmount() {
        if (this.wheelTimer) clearTimeout(this.wheelTimer);
    }

    refreshState = (preferredCode = this.state.selectedCode) => {
        const dbReady = MarketDataService.isReady();
        const stocks = MarketDataService.getStockOptions();
        let startDate = this.state.startDate;
        let endDate = this.state.endDate;
        if (dbReady) [startDate, endDate] = MarketDataService.getDefaultRange();
        const candidate = preferredCode || readLastStock();
        const selectedCode = stocks.some(stock => stock.code === candidate) ? candidate : (stocks[0] && stocks[0].code);
        saveLastStock(selectedCode);
        this.setState({ dbReady, stocks, startDate, endDate, viewStartDate: startDate, viewEndDate: endDate, selectedCode }, () => this.loadViews());
    }

    loadViews = () => {
        if (!this.state.dbReady) return;
        const { selectedCode, viewStartDate, viewEndDate } = this.state;
        const stockData = selectedCode && MarketDataService.listStocks().some(item => item.code === selectedCode)
            ? MarketDataService.getStockData(selectedCode, viewStartDate, viewEndDate) : null;
        const marketData = MarketDataService.getMarketData(viewStartDate, viewEndDate);
        const stockTargets = selectedCode ? MarketDataService.listTargets(selectedCode) : [];
        const marketTargets = MarketDataService.listTargets("MARKET");
        this.setState({ stockData, marketData, stockTargets, marketTargets });
    }

    run = async (progress, action, success) => {
        this.setState({ loading: true, progress });
        try {
            const result = await action(text => this.setState({ progress: text }));
            message.success(success || "操作完成");
            this.refreshState(result && result.instrument ? result.instrument.code : this.state.selectedCode);
        } catch (error) {
            console.error(error);
            message.error(error.message || "操作失败");
        } finally {
            this.setState({ loading: false, progress: "" });
        }
    }

    selectStock = code => {
        saveLastStock(code);
        this.setState({ selectedCode: code }, this.loadViews);
    }

    buildStock = replace => this.run(replace ? "正在重建股票历史…" : "正在构建股票历史…", async onProgress => {
        const code = normalizeStockCode(this.state.selectedCode);
        const stock = this.state.stocks.find(item => item.code === code);
        const name = (stock && stock.name) || code;
        const result = replace
            ? await MarketDataService.rebuildStock(code, name, this.state.startDate, this.state.endDate, onProgress)
            : await MarketDataService.buildStock(code, name, this.state.startDate, this.state.endDate, { onProgress });
        if (result.skipped) message.info("该股票已有历史数据，如需更新请使用“一键重建全部”或“一键补齐全部”");
        if (result.warnings && result.warnings.length) message.warning(result.warnings.join("；") + "，日 K 已保存，可稍后重新构建估值");
        return result;
    }, replace ? "股票历史已重建" : "股票历史构建完成");

    removeStock = () => {
        MarketDataService.removeStock(this.state.selectedCode);
        saveLastStock(null);
        message.success("已从行情 DB 移除该股票");
        this.refreshState(null);
    }

    changeViewRange = (viewStartDate, viewEndDate, load = false) => {
        this.setState({ viewStartDate, viewEndDate }, load ? this.loadViews : undefined);
    }

    addTarget = (scopeCode, metric, value, description, color) => {
        try {
            MarketDataService.addTarget(scopeCode, metric, value, description, color);
            message.success("目标指标已保存到行情数据库");
            this.loadViews();
            return true;
        } catch (error) {
            message.error(error.message || "目标指标保存失败");
            return false;
        }
    }

    updateTarget = (id, scopeCode, metric, value, description, color) => {
        try {
            MarketDataService.updateTarget(id, scopeCode, metric, value, description, color);
            message.success("目标指标已更新");
            this.loadViews();
            return true;
        } catch (error) {
            message.error(error.message || "目标指标更新失败");
            return false;
        }
    }

    deleteTarget = id => {
        try {
            MarketDataService.deleteTarget(id);
            message.success("目标指标已删除");
            this.loadViews();
        } catch (error) {
            message.error(error.message || "目标指标删除失败");
        }
    }

    handleStockWheel = ({ deltaY, ratio }) => {
        if (this.state.loading) return;
        const range = zoomDateRange(this.state.startDate, this.state.endDate,
            this.state.viewStartDate, this.state.viewEndDate, deltaY, ratio);
        this.setState({ viewStartDate: range[0], viewEndDate: range[1] });
        if (this.wheelTimer) clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => {
            this.wheelTimer = null;
            this.loadViews();
        }, 180);
    }

    renderTimeline() {
        const { startDate, endDate, viewStartDate, viewEndDate, loading, progress } = this.state;
        return <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 4, paddingTop: 6 }}>
            <RangeTimeline minDate={startDate} maxDate={endDate} startDate={viewStartDate} endDate={viewEndDate}
                disabled={loading} onChange={(start, end) => this.changeViewRange(start, end)}
                onCommit={(start, end) => this.changeViewRange(start, end, true)} />
            {loading && <div><Spin size="small" /> <Text>{progress}</Text></div>}
        </div>;
    }

    renderStockTab() {
        const { dbReady, stocks, selectedCode, stockData, stockTargets, metrics, loading } = this.state;
        const built = selectedCode && MarketDataService.isReady() && MarketDataService.listStocks().some(item => item.code === selectedCode);
        return <>
            <Card size="small" title="股票数据管理" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col><Select showSearch style={{ width: 460 }} placeholder="选择个人股票/已构建股票" value={selectedCode}
                        onChange={this.selectStock} optionFilterProp="children">
                        {stocks.map(stock => <Select.Option key={stock.code} value={stock.code}>{stock.name}（{stock.code}）{stock.latestDate ? " · " + stock.latestDate : ""}</Select.Option>)}
                    </Select></Col>
                    <Col><Button type="primary" disabled={!dbReady || loading || !selectedCode} onClick={() => this.buildStock(false)}>构建历史</Button></Col>
                    <Col><Popconfirm title="确认从行情 DB 移除该股票？个人财务记录不会删除。" onConfirm={this.removeStock}>
                        <Button danger disabled={!built || loading}>移除</Button>
                    </Popconfirm></Col>
                </Row>
                <Divider style={{ margin: "14px 0" }} />
                <Space wrap>
                    <Popconfirm title="将依次删除并重建全部股票历史，可能耗时较长，确认继续？"
                        onConfirm={() => this.run("准备一键重建…", onProgress => MarketDataService.rebuildAll(this.state.startDate, this.state.endDate, onProgress), "全部历史已重建")}>
                        <Button disabled={!dbReady || loading}>一键重建全部</Button>
                    </Popconfirm>
                    <Button disabled={!dbReady || loading} onClick={() => this.run("准备补齐全部数据…",
                        onProgress => MarketDataService.fillAll(today(), onProgress), "全部股票已补齐到今天")}>一键补齐全部</Button>
                </Space>
            </Card>
            {!stockData ? <Alert type="info" showIcon message="请选择并构建一只股票，图表只读取独立行情 DB 中的数据。" /> : <>
                <Card title={stockData.instrument.name + "（" + stockData.instrument.code + "）"}>
                    <StockKlineChart rows={stockData.daily} trades={stockData.trades} targets={stockTargets} onRangeWheel={this.handleStockWheel} />
                    {this.renderTimeline()}
                </Card>
                <Card style={{ marginTop: 16 }} title="财报期估值变化" extra={<Checkbox.Group value={metrics}
                    options={[{ label: "PE", value: "pe" }, { label: "PB", value: "pb" }, { label: "股息率", value: "dividend" }]}
                    onChange={value => this.setState({ metrics: value })} />}>
                    <ValuationChart rows={stockData.valuation} metrics={metrics} targets={stockTargets} />
                </Card>
            </>}
            {selectedCode && <TargetManager scopeCode={selectedCode} title="股票目标指标" targets={stockTargets}
                disabled={!dbReady || loading} onAdd={(...args) => this.addTarget(selectedCode, ...args)} onUpdate={(id, ...args) => this.updateTarget(id, selectedCode, ...args)} onDelete={this.deleteTarget} />}
        </>;
    }

    renderMarketTab() {
        const { dbReady, loading, marketData, marketTargets, startDate, endDate } = this.state;
        return <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                    <Button type="primary" disabled={!dbReady || loading} onClick={() => this.run("正在构建大盘历史…",
                        onProgress => MarketDataService.buildMarket(startDate, endDate, { onProgress }), "大盘历史构建完成")}>构建大盘历史</Button>
                    <Popconfirm title="将删除大盘历史后重新拉取，确认继续？" onConfirm={() => this.run("正在重建大盘历史…",
                        onProgress => MarketDataService.buildMarket(startDate, endDate, { replace: true, onProgress }), "大盘历史已重建")}>
                        <Button disabled={!dbReady || loading}>重新构建大盘</Button>
                    </Popconfirm>
                </Space>
            </Card>
            {!marketData.length ? <Alert type="info" showIcon message="尚未构建大盘数据。" /> : <Card title="沪深两市历史信息">
                <Alert style={{ marginBottom: 12 }} type="info" showIcon message="成交额按两融账户日报中的两融交易额及其占 A 股成交额比例还原；融资余额为沪深两市合计。" />
                <MarketAmountChart rows={marketData} targets={marketTargets} onRangeWheel={this.handleStockWheel} />
                {this.renderTimeline()}
            </Card>}
            <TargetManager scopeCode="MARKET" title="大盘目标指标" targets={marketTargets}
                disabled={!dbReady || loading} onAdd={(...args) => this.addTarget("MARKET", ...args)} onUpdate={(id, ...args) => this.updateTarget(id, "MARKET", ...args)} onDelete={this.deleteTarget} />
        </>;
    }

    render() {
        return <Content className="Content" style={{ padding: 16 }}>
            <Tabs activeKey={this.state.activeTab} onChange={activeTab => this.setState({ activeTab })}
                items={[{ key: "stock", label: "股票", children: this.renderStockTab() },
                    { key: "market", label: "大盘", children: this.renderMarketTab() }]} />
        </Content>;
    }
}

export default FinancePage;
