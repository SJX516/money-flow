import { Button, Card, Descriptions, Divider, Input, Layout, Space, Spin, Tag, Typography, message } from "antd";
import React from "react";
import { App, DB_INIT } from "../../app.js";
import MarketDataService from "../../domain/market/market_data_service";
import { SummaryService } from "../../domain/service/summary_service";

const { Content } = Layout;
const { Text } = Typography;
const today = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

class InitPage extends React.Component {
    constructor(props) {
        super(props);
        const marketReady = MarketDataService.isReady();
        const range = marketReady ? MarketDataService.getDefaultRange() : ["2015-01-01", today()];
        this.state = {
            marketReady, marketLoading: false, marketProgress: "", combinedLoading: false,
            marketStartDate: range[0], marketEndDate: range[1],
            marketOverview: marketReady ? MarketDataService.getDatabaseOverview() : null
        };
    }

    importDatabases = async files => {
        const selected = Array.from(files || []);
        if (!selected.length) return;
        this.setState({ combinedLoading: true });
        let personalLoaded = false;
        let marketLoaded = false;
        const errors = [];
        for (const file of selected) {
            try {
                await MarketDataService.loadDb(file);
                marketLoaded = true;
                continue;
            } catch (marketError) {
                try {
                    await App.initDb(file);
                    personalLoaded = true;
                } catch (personalError) {
                    errors.push(file.name + "：无法识别数据库类型");
                }
            }
        }
        const marketReady = MarketDataService.isReady();
        const range = marketReady ? MarketDataService.getDefaultRange() : [this.state.marketStartDate, this.state.marketEndDate];
        this.setState({ combinedLoading: false, marketReady, marketStartDate: range[0], marketEndDate: range[1],
            marketOverview: marketReady ? MarketDataService.getDatabaseOverview() : null }, () => {
            if (personalLoaded && marketLoaded) message.success("个人数据库和行情数据库已同时导入");
            else if (personalLoaded || marketLoaded) message.success((personalLoaded ? "个人" : "行情") + "数据库已导入");
            if (errors.length) message.warning(errors.join("；"));
            if (personalLoaded) this.props.onDbReady();
        });
    }

    async refreshDB(files) {
        if (!files || !files[0]) return;
        try {
            await App.initDb(files[0]);
            message.success("个人数据库已导入");
            this.props.onDbReady();
        } catch (error) {
            message.error(error.message || "个人数据库导入失败");
        }
    }

    async create() {
        try {
            await App.createDb();
            message.success("个人数据库已创建");
            this.props.onDbReady();
        } catch (error) {
            message.error(error.message || "个人数据库创建失败");
        }
    }

    export() {
        if (!DB_INIT) return message.error("请先加载个人数据库");
        App.db?.export();
    }

    runMarket = async (progress, action, success) => {
        this.setState({ marketLoading: true, marketProgress: progress });
        try {
            await action();
            const marketReady = MarketDataService.isReady();
            const range = marketReady ? MarketDataService.getDefaultRange() : [this.state.marketStartDate, this.state.marketEndDate];
            this.setState({ marketReady, marketStartDate: range[0], marketEndDate: range[1],
                marketOverview: marketReady ? MarketDataService.getDatabaseOverview() : null });
            message.success(success);
        } catch (error) {
            console.error(error);
            message.error(error.message || "行情数据库操作失败");
        } finally {
            this.setState({ marketLoading: false, marketProgress: "" });
        }
    }

    createMarketDb = () => this.runMarket("正在创建行情数据库…", () => MarketDataService.createDb(), "行情数据库已创建");

    loadMarketDb = files => {
        if (!files || !files[0]) return;
        this.runMarket("正在导入行情数据库…", () => MarketDataService.loadDb(files[0]), "行情数据库已导入");
    }

    saveMarketRange = () => this.runMarket("正在保存全局范围…", () => {
        MarketDataService.setDefaultRange(this.state.marketStartDate, this.state.marketEndDate);
    }, "行情数据库全局范围已保存");

    renderPersonalCard() {
        const latestMonth = DB_INIT ? SummaryService.latestMonth() : null;
        return <Card title={<span>个人数据库 {DB_INIT ? <Tag color="green">已就绪</Tag> : <Tag>未加载</Tag>}</span>}
            style={{ marginBottom: 16 }}>
            <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="当前数据库">{DB_INIT ? App.personalDbName || "当前个人数据库" : "尚未选择文件"}</Descriptions.Item>
                <Descriptions.Item label="最新理财月份">{latestMonth || (DB_INIT ? "暂无按月理财数据" : "-")}</Descriptions.Item>
            </Descriptions>
            <Space wrap style={{ marginTop: 16 }}>
                <Button onClick={() => this.create()}>新建个人 DB</Button>
                <label className="ant-btn"><input type="file" accept=".db" hidden
                    onChange={event => this.refreshDB(event.target.files)} />导入个人 DB</label>
                <Button disabled={!DB_INIT} onClick={() => this.export()}>导出个人 DB</Button>
            </Space>
        </Card>;
    }

    renderMarketCard() {
        const { marketReady, marketLoading, marketProgress, marketStartDate, marketEndDate, marketOverview } = this.state;
        const stocks = marketOverview ? marketOverview.stocks : [];
        const market = marketOverview ? marketOverview.market : null;
        return <Card title={<span>行情数据库 {marketReady ? <Tag color="green">已就绪</Tag> : <Tag>未加载</Tag>}</span>}>
            <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="当前数据库">{marketReady ? (marketOverview && marketOverview.name) : "尚未选择文件"}</Descriptions.Item>
                <Descriptions.Item label="沪深大盘数据">{market && market.latest_date
                    ? "截至 " + market.latest_date + "（" + market.row_count + " 个交易日）" : (marketReady ? "暂无数据" : "-")}</Descriptions.Item>
                <Descriptions.Item label="股票行情数据" span={2}>{stocks.length ? <Space wrap>
                    {stocks.map(stock => <Tag color="blue" key={stock.code}>{stock.name}（{stock.code}） · 截至 {stock.latest_date || "暂无日K"} · {stock.row_count} 日</Tag>)}
                </Space> : (marketReady ? "暂无已构建股票" : "-")}</Descriptions.Item>
                <Descriptions.Item label="数据构建/全局范围" span={2}><Space wrap>
                    <Input type="date" value={marketStartDate} disabled={!marketReady || marketLoading}
                        onChange={event => this.setState({ marketStartDate: event.target.value })} />
                    <Text>至</Text>
                    <Input type="date" value={marketEndDate} max={today()} disabled={!marketReady || marketLoading}
                        onChange={event => this.setState({ marketEndDate: event.target.value })} />
                    <Button disabled={!marketReady || marketLoading} onClick={this.saveMarketRange}>保存为默认范围</Button>
                </Space></Descriptions.Item>
            </Descriptions>
            <Space wrap style={{ marginTop: 16 }}>
                <Button disabled={marketLoading} onClick={this.createMarketDb}>新建行情 DB</Button>
                <label className="ant-btn"><input type="file" accept=".db" hidden
                    onChange={event => this.loadMarketDb(event.target.files)} />导入行情 DB</label>
                <Button disabled={!marketReady || marketLoading} onClick={() => MarketDataService.exportDb()}>导出行情 DB</Button>
                {marketLoading && <><Spin size="small" /><Text>{marketProgress}</Text></>}
            </Space>
        </Card>;
    }

    render() {
        return <Content className="Content">
            <Divider orientation="center">版本：{App.getVersion()}</Divider>
            <Card size="small" title="同时导入数据库" style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Text>一次选择个人数据库和行情数据库，系统会按表结构自动识别。</Text>
                    <label className={"ant-btn ant-btn-primary" + (this.state.combinedLoading ? " ant-btn-disabled" : "")}>
                        <input type="file" accept=".db" multiple hidden disabled={this.state.combinedLoading}
                            onChange={event => this.importDatabases(event.target.files)} />选择两个 DB 文件</label>
                    {this.state.combinedLoading && <><Spin size="small" /><Text>正在识别并导入…</Text></>}
                </Space>
            </Card>
            {this.renderPersonalCard()}
            {this.renderMarketCard()}
        </Content>;
    }
}

export default InitPage;
