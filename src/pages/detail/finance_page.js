import {
    Alert, Button, Card, Col, Layout, Popconfirm, Row, Select,
    Space, Spin, Tabs, Typography, message
} from "antd";
import React from "react";
import MarketDataService from "../../domain/market/market_data_service";
import { FinancialDataChart, MarketAmountChart, ValuationChart } from "./finance/market_charts";
import { StockKlinePanel } from "./finance/chip_distribution_chart";
import RangeTimeline from "./finance/range_timeline";
import { zoomDateRange } from "./finance/chart_utils";
import { autoExportMarketUpdate, defaultViewRange, readLastStock, saveLastStock, today } from "./finance/finance_page_state";
import TargetManager from "./finance/target_manager";
import StockListManager from "./finance/stock_list_manager";

const { Content } = Layout;
const { Text } = Typography;

class FinancePage extends React.Component {
    constructor(props) {
        super(props);
        this.wheelTimer = null;
        const endDate = today();
        const viewRange = defaultViewRange("2015-01-01", endDate);
        this.state = {
            dbReady: MarketDataService.isReady(), stocks: [], selectedCode: null, selectedIndexCode: null,
            startDate: "2015-01-01", endDate,
            viewStartDate: viewRange[0], viewEndDate: viewRange[1], stockData: null, indexData: null,
            marketData: [], metrics: ["pe", "peg"], stockTargets: [], marketTargets: [], stockGroups: [],
            marketSelectedDate: null, loading: false, progress: "", activeTab: "stock",
            managerVisible: false, indexManagerVisible: false, stockSelectedDate: null
        };
    }

    componentDidMount() {
        this.refreshState();
    }

    componentWillUnmount() {
        if (this.wheelTimer) clearTimeout(this.wheelTimer);
    }

    refreshState = (preferredCode = this.state.selectedCode, preferredIndexCode = this.state.selectedIndexCode) => {
        const dbReady = MarketDataService.isReady();
        const stocks = MarketDataService.getStockOptions();
        const stockGroups = dbReady ? MarketDataService.getStockGroups() : [];
        let startDate = this.state.startDate;
        let endDate = this.state.endDate;
        if (dbReady) [startDate, endDate] = MarketDataService.getDefaultRange();
        const candidate = preferredCode || readLastStock();
        const selectedCode = stocks.some(stock => stock.code === candidate) ? candidate : (stocks[0] && stocks[0].code);
        const indices = stocks.filter(stock => stock.isIndex);
        const selectedIndexCode = indices.some(index => index.code === preferredIndexCode)
            ? preferredIndexCode : (indices[0] && indices[0].code);
        const viewRange = defaultViewRange(startDate, endDate);
        saveLastStock(selectedCode);
        this.setState({ dbReady, stocks, stockGroups, startDate, endDate,
            viewStartDate: viewRange[0], viewEndDate: viewRange[1], selectedCode, selectedIndexCode }, () => this.loadViews());
    }

    loadViews = () => {
        if (!this.state.dbReady) return;
        const { selectedCode, selectedIndexCode, viewStartDate, viewEndDate } = this.state;
        const builtCodes = new Set(MarketDataService.listStocks().map(item => item.code));
        const stockData = selectedCode && builtCodes.has(selectedCode)
            ? MarketDataService.getStockData(selectedCode, viewStartDate, viewEndDate) : null;
        const indexData = selectedIndexCode && builtCodes.has(selectedIndexCode)
            ? MarketDataService.getStockData(selectedIndexCode, viewStartDate, viewEndDate) : null;
        const marketData = MarketDataService.getMarketData(viewStartDate, viewEndDate);
        const stockTargets = selectedCode ? MarketDataService.listTargets(selectedCode) : [];
        const marketTargets = MarketDataService.listTargets("MARKET");
        const indexDates = new Set(indexData ? indexData.daily.map(row => row.trade_date) : []);
        const marketDates = new Set(marketData.map(row => row.trade_date));
        const currentDate = this.state.marketSelectedDate;
        const currentAvailable = currentDate && (!indexDates.size || indexDates.has(currentDate)) &&
            (!marketDates.size || marketDates.has(currentDate));
        const commonDate = indexData && indexData.daily.length
            ? [...indexData.daily].reverse().find(row => !marketDates.size || marketDates.has(row.trade_date))?.trade_date
            : marketData.length ? marketData[marketData.length - 1].trade_date : null;
        this.setState({ stockData, indexData, marketData, stockTargets, marketTargets,
            marketSelectedDate: currentAvailable ? currentDate : commonDate });
    }

    run = async (progress, action, success, options = {}) => {
        this.setState({ loading: true, progress });
        try {
            const result = await action(text => this.setState({ progress: text }));
            let exportError = null;
            try { autoExportMarketUpdate(result, options.autoExport, () => MarketDataService.exportDb()); }
            catch (error) { exportError = error; }
            if (result && result.skipped) message.info("已有历史数据，本次未写入或导出");
            else message.success(success || "操作完成");
            if (exportError) message.warning("行情数据已更新，但自动导出失败，请手动导出行情数据库");
            const resultCode = result && result.instrument && result.instrument.code;
            this.refreshState(options.indexAction ? this.state.selectedCode
                : resultCode && resultCode !== "MARKET" ? resultCode : this.state.selectedCode,
            options.indexAction && resultCode ? resultCode : this.state.selectedIndexCode);
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

    selectStockDate = date => this.setState({ stockSelectedDate: date });

    selectIndex = code => this.setState({ selectedIndexCode: code }, this.loadViews);

    selectMarketDate = date => this.setState(state => state.marketSelectedDate === date ? null : { marketSelectedDate: date });

    buildStock = replace => this.run(replace ? "正在重建股票历史…" : "正在构建股票历史…", async onProgress => {
        const code = this.state.selectedCode;
        const stock = this.state.stocks.find(item => item.code === code);
        const name = (stock && stock.name) || code;
        const result = replace
            ? await MarketDataService.rebuildStock(code, name, this.state.startDate, this.state.endDate, onProgress)
            : await MarketDataService.buildStock(code, name, this.state.startDate, this.state.endDate, { onProgress });
        if (result.warnings && result.warnings.length) message.warning(result.warnings.join("；") + "，日 K 已保存，可稍后重新构建估值");
        return result;
    }, replace ? "股票历史已重建并自动导出" : "股票历史构建完成并自动导出", { autoExport: true });

    fillStock = () => this.run("正在补齐当前股票…", onProgress =>
        MarketDataService.fillStock(this.state.selectedCode, today(), onProgress),
        "当前股票已补齐并自动导出", { autoExport: true });

    buildIndex = replace => this.run(replace ? "正在重建指数历史…" : "正在构建指数历史…", async onProgress => {
        const code = this.state.selectedIndexCode;
        const index = this.state.stocks.find(item => item.code === code);
        const name = (index && index.name) || code;
        return replace
            ? MarketDataService.rebuildStock(code, name, this.state.startDate, this.state.endDate, onProgress)
            : MarketDataService.buildStock(code, name, this.state.startDate, this.state.endDate, { onProgress });
    }, replace ? "指数历史已重建并自动导出" : "指数历史构建完成并自动导出",
    { autoExport: true, indexAction: true });

    fillIndex = () => this.run("正在补齐当前指数…", onProgress =>
        MarketDataService.fillStock(this.state.selectedIndexCode, today(), onProgress),
        "当前指数已补齐并自动导出", { autoExport: true, indexAction: true });

    rebuildMarket = () => this.run("正在重建成交额历史…", async onProgress => {
        MarketDataService.removeMarket();
        return MarketDataService.buildMarket(this.state.startDate, this.state.endDate, { onProgress });
    }, "成交额历史已重建并自动导出", { autoExport: true });

    removeStock = () => {
        MarketDataService.removeStock(this.state.selectedCode);
        saveLastStock(null);
        message.success("已从行情 DB 移除该股票");
        this.refreshState(null);
    }

    removeIndex = () => {
        MarketDataService.removeStock(this.state.selectedIndexCode);
        message.success("已从行情 DB 移除该指数历史");
        this.refreshState(this.state.selectedCode, this.state.selectedIndexCode);
    }

    removeMarket = () => {
        MarketDataService.removeMarket();
        message.success("已移除成交额历史");
        this.refreshState();
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

    changeWatchlist = (action, success) => {
        try {
            action();
            message.success(success);
            this.refreshState();
            return true;
        } catch (error) {
            message.error(error.message || "股票列表操作失败");
            return false;
        }
    }

    addWatchStock = async (code, groupId) => {
        try {
            const stock = await MarketDataService.addWatchStock(code, groupId);
            message.success(stock.name + " 已加入观察列表");
            this.refreshState(stock.code);
            return true;
        } catch (error) {
            message.error(error.message || "添加观察股票失败");
            return false;
        }
    }

    addIndex = async code => {
        try {
            const index = await MarketDataService.addIndex(code);
            message.success(index.name + " 已加入指数列表");
            this.refreshState(this.state.selectedCode, index.code);
            return true;
        } catch (error) {
            message.error(error.message || "添加指数失败");
            return false;
        }
    }

    addStockGroup = name => this.changeWatchlist(
        () => MarketDataService.addStockGroup(name), "股票分组已添加");

    deleteStockGroup = groupId => this.changeWatchlist(
        () => MarketDataService.deleteStockGroup(groupId), "股票分组已删除");

    moveStockGroup = (groupId, direction) => this.changeWatchlist(
        () => MarketDataService.moveStockGroup(groupId, direction), "股票分组顺序已更新");

    moveWatchStock = (code, groupId) => this.changeWatchlist(
        () => MarketDataService.moveWatchStock(code, groupId), "股票分组已更新");

    removeWatchStock = code => this.changeWatchlist(
        () => MarketDataService.removeWatchStock(code), "已从观察列表移除");

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

    renderTimeline(style = {}) {
        const { dbReady, startDate, endDate, viewStartDate, viewEndDate, loading } = this.state;
        return <div style={{ background: "#fff", border: "1px solid #f0f0f0", padding: "8px 12px", ...style }}>
            <RangeTimeline minDate={startDate} maxDate={endDate} startDate={viewStartDate} endDate={viewEndDate}
                disabled={!dbReady || loading} onChange={(start, end) => this.changeViewRange(start, end)}
                onCommit={(start, end) => this.changeViewRange(start, end, true)} />
        </div>;
    }

    renderStockTab() {
        const { dbReady, stocks, stockGroups, selectedCode, stockData, stockTargets, metrics, loading, progress, managerVisible, stockSelectedDate } = this.state;
        const built = selectedCode && MarketDataService.isReady() && MarketDataService.listStocks().some(item => item.code === selectedCode);
        return <>
            <Card size="small" title="股票数据管理" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col><Select showSearch style={{ width: 460 }} placeholder="选择持仓/观察/已构建股票" value={selectedCode}
                        onChange={this.selectStock} optionFilterProp="children">
                        {stocks.map(stock => <Select.Option key={stock.code} value={stock.code}>
                            {stock.groupName ? "【" + stock.groupName + "】" : ""}{stock.name}（{stock.code}）{stock.latestDate ? " · " + stock.latestDate : ""}
                        </Select.Option>)}
                    </Select></Col>
                    <Col><Button disabled={!dbReady || loading} onClick={() => this.setState({ managerVisible: true })}>管理股票列表</Button></Col>
                    <Col><Popconfirm title="将先移除该股票旧数据，再重新获取完整历史，确认继续？" onConfirm={() => this.buildStock(true)}>
                        <Button type="primary" disabled={!dbReady || loading || !selectedCode}>重新构建</Button>
                    </Popconfirm></Col>
                    <Col><Button disabled={!built || loading} onClick={this.fillStock}>补齐</Button></Col>
                    <Col flex="auto" />
                    <Col><Space wrap>
                        <Popconfirm title="将依次删除并重建全部股票历史，可能耗时较长，确认继续？"
                            onConfirm={() => this.run("准备一键重建…", onProgress => MarketDataService.rebuildAll(this.state.startDate, this.state.endDate, onProgress),
                                "全部历史已重建并自动导出", { autoExport: true })}>
                            <Button disabled={!dbReady || loading}>一键重建全部</Button>
                        </Popconfirm>
                        <Button disabled={!dbReady || loading} onClick={() => this.run("准备补齐全部数据…",
                            onProgress => MarketDataService.fillAll(today(), onProgress), "全部股票已补齐并自动导出", { autoExport: true })}>一键补齐全部</Button>
                        {loading && <><Spin size="small" /><Text>{progress}</Text></>}
                    </Space></Col>
                </Row>
            </Card>
            <StockListManager visible={managerVisible} disabled={!dbReady || loading} groups={stockGroups} stocks={stocks}
                onClose={() => this.setState({ managerVisible: false })} onAddStock={this.addWatchStock}
                onAddGroup={this.addStockGroup} onDeleteGroup={this.deleteStockGroup}
                onMoveGroup={this.moveStockGroup} onMoveStock={this.moveWatchStock} onRemoveStock={this.removeWatchStock} />

            {!stockData ? <Alert type="info" showIcon message="请选择并构建一只股票，图表只读取独立行情 DB 中的数据。" /> : <>
                <Card title={stockData.instrument.name + "（" + stockData.instrument.code + "）"}>
                    <StockKlinePanel key={stockData.instrument.code} rows={stockData.daily} historyRows={stockData.chipHistory}
                        trades={stockData.trades} targets={stockTargets} onRangeWheel={this.handleStockWheel}
                        selectedDate={stockSelectedDate} onDateChange={this.selectStockDate} />
                    {this.renderTimeline({ marginTop: 12 })}
                </Card>
                <Card style={{ marginTop: 16 }} title="财报期估值变化">
                    <ValuationChart rows={stockData.valuation} metrics={metrics} targets={stockTargets}
                        activeDate={stockSelectedDate} onDateChange={this.selectStockDate} />
                </Card>
                <Card style={{ marginTop: 16 }} title="财报期数据">
                    <FinancialDataChart rows={stockData.valuation} activeDate={stockSelectedDate} onDateChange={this.selectStockDate} />
                </Card>
            </>}
            {selectedCode && <TargetManager scopeCode={selectedCode} title="股票目标指标" targets={stockTargets}
                disabled={!dbReady || loading} onAdd={(...args) => this.addTarget(selectedCode, ...args)} onUpdate={(id, ...args) => this.updateTarget(id, selectedCode, ...args)} onDelete={this.deleteTarget} />}
        </>;
    }

    renderMarketTab() {
        const { dbReady, loading, progress, marketData, marketTargets, stocks, stockGroups,
            selectedIndexCode, indexData, indexManagerVisible } = this.state;
        const indices = stocks.filter(stock => stock.isIndex);
        const indexGroup = stockGroups.find(group => group.isIndex);
        const builtIndex = selectedIndexCode && MarketDataService.isReady() &&
            MarketDataService.listStocks().some(item => item.code === selectedIndexCode);
        const marketBuilt = dbReady && Number(MarketDataService.getDatabaseOverview().market.row_count) > 0;
        return <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Popconfirm title="将先移除全部成交额与融资余额历史，再重新获取完整数据，确认继续？" onConfirm={this.rebuildMarket}>
                        <Button type="primary" disabled={!dbReady || loading}>重新构建</Button>
                    </Popconfirm>
                    <Button disabled={!marketBuilt || loading} onClick={() => this.run("正在补齐成交额…",
                        onProgress => MarketDataService.fillMarket(today(), onProgress),
                        "成交额已补齐并自动导出", { autoExport: true })}>补齐</Button>
                    {loading && <><Spin size="small" /><Text>{progress}</Text></>}
                </Space>
            </Card>
            <Card size="small" title="指数数据管理" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col><Select showSearch style={{ width: 460 }} placeholder="选择指数分组中的标的" value={selectedIndexCode}
                        onChange={this.selectIndex} optionFilterProp="children">
                        {indices.map(index => <Select.Option key={index.code} value={index.code}>
                            {index.name}（{index.code}）{index.latestDate ? " · " + index.latestDate : ""}
                        </Select.Option>)}
                    </Select></Col>
                    <Col><Button disabled={!dbReady || loading || !indexGroup}
                        onClick={() => this.setState({ indexManagerVisible: true })}>管理指数列表</Button></Col>
                    <Col><Button type="primary" disabled={!dbReady || loading || !selectedIndexCode}
                        onClick={() => this.buildIndex(true)}>重新构建</Button></Col>
                    <Col><Button disabled={!builtIndex || loading} onClick={this.fillIndex}>补齐</Button></Col>
                    <Col flex="auto" />
                    <Col><Space wrap>
                        <Popconfirm title="将依次删除并重建指数分组中已构建的全部历史，确认继续？"
                            onConfirm={() => this.run("准备一键重建指数…", onProgress => MarketDataService.rebuildAll(
                                this.state.startDate, this.state.endDate, onProgress, indexGroup && indexGroup.id),
                            "指数历史已全部重建并自动导出", { autoExport: true, indexAction: true })}>
                            <Button disabled={!dbReady || loading || !indexGroup}>一键重建</Button>
                        </Popconfirm>
                        <Button disabled={!dbReady || loading || !indexGroup} onClick={() => this.run("准备补齐指数数据…",
                            onProgress => MarketDataService.fillAll(today(), onProgress, indexGroup && indexGroup.id),
                            "指数历史已全部补齐并自动导出", { autoExport: true, indexAction: true })}>一键补齐</Button>
                        {loading && <><Spin size="small" /><Text>{progress}</Text></>}
                    </Space></Col>
                </Row>
            </Card>
            <StockListManager visible={indexManagerVisible} disabled={!dbReady || loading} mode="index"
                fixedGroupId={indexGroup && indexGroup.id} groups={stockGroups} stocks={stocks}
                onClose={() => this.setState({ indexManagerVisible: false })} onAddStock={this.addIndex}
                onAddGroup={this.addStockGroup} onDeleteGroup={this.deleteStockGroup}
                onMoveGroup={this.moveStockGroup} onMoveStock={this.moveWatchStock} onRemoveStock={this.removeWatchStock} />

            {!indexData ? <Alert style={{ marginBottom: 16 }} type="info" showIcon
                message={indices.length ? "请选择并构建一个指数以查看 K 线与筹码分布。" : "请先在指数列表中添加指数。"} />
                : <Card style={{ marginBottom: 16 }} title={indexData.instrument.name + "（" + indexData.instrument.code + "）"}>
                    <StockKlinePanel key={indexData.instrument.code} rows={indexData.daily} historyRows={indexData.chipHistory}
                        trades={indexData.trades} targets={[]} onRangeWheel={this.handleStockWheel}
                        selectedDate={this.state.marketSelectedDate} onDateChange={this.selectMarketDate} />
                </Card>}
            {this.renderTimeline({ marginBottom: 16 })}
            {!marketData.length ? <Alert type="info" showIcon message="尚未构建大盘数据。" /> : <Card title="沪深两市历史信息">
                <Alert style={{ marginBottom: 12 }} type="info" showIcon message="成交额按两融账户日报中的两融交易额及其占 A 股成交额比例还原；融资余额为沪深两市合计。" />
                <MarketAmountChart rows={marketData} targets={marketTargets} onRangeWheel={this.handleStockWheel}
                    activeDate={this.state.marketSelectedDate} onDateChange={this.selectMarketDate} />
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
