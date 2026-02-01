import { Layout, Select } from "antd";
import React from 'react';
import { Stock } from '@ant-design/charts';
import InvestmentService from "../../domain/service/investment_service";
import { InvestmentType } from "../../domain/entity/investment";

class FinancePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            stocks: [],
            selectedStock: null,
            klineData: []
        };
    }

    componentDidMount() {
        const products = InvestmentService.queryProducts();
        const stocks = products.filter(p => p.type && p.type.name === InvestmentType.Product.stock.name && p.desc);
        this.setState({ stocks });
    }

    handleStockChange = (value) => {
        const selectedStock = this.state.stocks.find(s => s.id === value);
        this.setState({ selectedStock });
        this.fetchKlineData(selectedStock.desc);
    }

    fetchKlineData = (stockCode) => {
        // IMPORTANT: This is a placeholder API. You need to replace it with a real stock data API.
        // I am using a placeholder and generating random data because I don't have access to a real-time stock API without an API key.
        // You should replace this with a call to a real financial data provider.
        const apiUrl = `https://api.money.com/kline?code=${stockCode}`;

        console.log(`Fetching data for ${stockCode} from ${apiUrl}`);

        const data = this.generateRandomKlineData();
        this.setState({ klineData: data });

        /*
        // This is an example of how you would fetch data from a real API:
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                // The data from the API needs to be in the format:
                // [{ date: '2023-01-01', open: 100, close: 120, high: 130, low: 90 }, ...]
                this.setState({ klineData: data });
            })
            .catch(error => {
                console.error("Error fetching K-line data:", error);
            });
        */
    }

    generateRandomKlineData() {
        const data = [];
        let lastClose = Math.random() * 100 + 50;
        for (let i = 0; i < 60; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const open = lastClose;
            const close = open + (Math.random() - 0.5) * 10;
            const high = Math.max(open, close) + Math.random() * 5;
            const low = Math.min(open, close) - Math.random() * 5;
            data.push({
                date: date.toISOString().slice(0, 10),
                open: parseFloat(open.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
            });
            lastClose = close;
        }
        return data.reverse();
    }

    render() {
        const { stocks, klineData } = this.state;

        const config = {
            data: klineData,
            xField: 'date',
            yField: ['open', 'close', 'high', 'low'],
            risingFill: '#ef5350',
            fallingFill: '#26a69a',
        };

        return (
            <Layout>
                <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
                    <h2>股票信息查询</h2>
                    <p>请注意: K线图数据是随机生成的，并非真实数据。您需要替换代码中的API以获取真实数据。</p>
                    <Select
                        style={{ width: 200, marginBottom: 20 }}
                        placeholder="请选择股票"
                        onChange={this.handleStockChange}
                    >
                        {stocks.map(stock => (
                            <Select.Option key={stock.id} value={stock.id}>
                                {stock.name} ({stock.desc})
                            </Select.Option>
                        ))}
                    </Select>
                    {klineData.length > 0 && <Stock {...config} />}
                </div>
            </Layout>
        )
    }
}

export default FinancePage;