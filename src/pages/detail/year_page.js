import React from 'react'
import { Table, Tag, Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography, message, List, Menu, Breadcrumb } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { DataUtil, MoneyUtil, TimeUtil } from '../../utils/utils';
import InputWidget from './widget/input_widget';
import InvestmentService from '../../domain/service/investment_service';
import { InvestmentRecordType, InvestmentType } from '../../domain/entity/investment';
import { SummaryService } from '../../domain/service/summary_service';
import { IncomeExpenditureVMService, InvestmentVMService } from '../../domain/service/view_model_service';
import { UIUtils } from '../ui_utils';
import { CusDialog } from './widget/cus_dialog';
import { Pie, PieChart, Tooltip, ResponsiveContainer } from 'recharts';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

class YearPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            "startMonth": "01"
        }

        this.incomeExpendColumns = [{
            title: '名称',
            key: 'title',
            dataIndex: 'entity',
            render: (entity) => {
                let color = 'geekblue'
                if (entity.title === '主动收入' || entity.title === '被动收入') {
                    color = 'red'
                } else if (entity.title === '主动支出' || entity.title === '被动支出') {
                    color = 'green'
                }
                return <Tag color={color} key={entity.title}>
                    {entity.title}
                </Tag>
            },
        }, {
            title: '金额',
            key: 'money',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.money)}</Text>
            }
        }]
        this.subIncomeExpendColumns = [{
            title: '名称',
            key: 'title',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.title}</Text>
            },
        }, {
            title: '金额',
            key: 'money',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.money)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compareAbs(a.entity.money, b.entity.money)
        }, {
            title: '描述',
            key: 'desc',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.desc}</Text>
            },
        },]

        this.assetDebtColumns = [{
            title: '类型',
            key: 'type',
            dataIndex: 'entity',
            render: (entity) => {
                return UIUtils.getProductTag(entity.info.productType)
            },
        }, {
            title: '名称',
            key: 'name',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.info.productName}</Text>
            },
        }, {
            title: '总额',
            key: 'currentPrice',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.currentPrice?.money)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.currentPrice?.money, b.entity.currentPrice?.money)
        }, {
            title: '到账利润',
            key: 'currentMonthProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profits?.filterTotalMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.profits?.filterTotalMoney, b.entity.profits?.filterTotalMoney)
        }]
        this.subAssetDebtColumns = [{
            title: '发生时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.happenTime)}</Text>
            },
        }, {
            title: '到账利润',
            key: 'currentMonthProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.money)}</Text>
            },
        },]


        this.investColumns = [{
            title: '类型',
            key: 'type',
            dataIndex: 'entity',
            render: (entity) => {
                return UIUtils.getProductTag(entity.info.productType)
            },
        }, {
            title: '名称',
            key: 'name',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.info.productName}</Text>
            },
        }, {
            title: '卖出总额',
            key: 'sellPrice',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(Math.abs(entity.buySells?.filterSellMoney))}</Text>
            },
            sorter: (a, b) => MoneyUtil.compareAbs(a.entity.buySells?.filterSellMoney, b.entity.buySells?.filterSellMoney)
        }, {
            title: '卖出利润率',
            key: 'sellProfitPercent',
            dataIndex: 'entity',
            render: (entity) => {
                let sellProfitPercent = InvestmentVMService.getSellProfitPercent(entity)
                return <Text type={MoneyUtil.getPercentColorType(sellProfitPercent)}>
                    {MoneyUtil.getPercentStr(sellProfitPercent)}</Text>
            },
            sorter: (a, b) => {
                let asellProfitPercent = InvestmentVMService.getSellProfitPercent(a.entity)
                let bsellProfitPercent = InvestmentVMService.getSellProfitPercent(b.entity)
                return DataUtil.compare(asellProfitPercent, bsellProfitPercent)
            }
        }, {
            title: '卖出利润',
            key: 'sellProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profits?.filterTotalMoney)}</Text>
            },
            sorter: (a, b) => {
                return MoneyUtil.compare(a.entity.profits?.filterTotalMoney, b.entity.profits?.filterTotalMoney)
            }
        }, {
            title: '当期投资',
            key: 'timeInvest',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.buySells?.filterMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.buySells?.filterMoney, b.entity.buySells?.filterMoney)
        }, {
            title: '投资总额',
            key: 'totalInvest',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.buySells?.totalMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.buySells?.totalMoney, b.entity.buySells?.totalMoney)
        }, {
            title: '账面利润率',
            key: 'paperProfitPercent',
            dataIndex: 'entity',
            render: (entity) => {
                let paperProfitPercent = InvestmentVMService.getPaperProfitPercent(entity)
                return <Text type={MoneyUtil.getPercentColorType(paperProfitPercent)}>
                    {MoneyUtil.getPercentStr(paperProfitPercent)}</Text>
            },
            sorter: (a, b) => {
                let apaperProfitPercent = InvestmentVMService.getPaperProfitPercent(a.entity)
                let bpaperProfitPercent = InvestmentVMService.getPaperProfitPercent(b.entity)
                return DataUtil.compare(apaperProfitPercent, bpaperProfitPercent)
            }
        }, {
            title: '账面利润',
            key: 'paperProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(InvestmentVMService.getPaperProfit(entity))}</Text>
            },
            sorter: (a, b) => {
                return MoneyUtil.compare(InvestmentVMService.getPaperProfit(a.entity), InvestmentVMService.getPaperProfit(b.entity))
            }
        }, {
            title: '最新价值',
            key: 'lastPrice',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.currentPrice?.money)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.currentPrice?.money, b.entity.currentPrice?.money)
        }, {
            title: '成本价',
            key: 'costPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getDetailStr(MoneyUtil.safeDivision(entity.buySells?.totalMoney, entity.buySells.totalCount))}</Text>
            },
        }, {
            title: '现价',
            key: 'currentPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getDetailStr(MoneyUtil.safeDivision(entity.currentPrice?.money, entity.buySells.totalCount))}</Text>
            },
        },]
        this.subInvestColumns = [{
            title: '发生时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.happenTime)}</Text>
            },
        }, {
            title: '买入/卖出本金',
            key: 'principal',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.money)}</Text>
            },
        }, {
            title: '到账总额',
            key: 'sellGetMoney',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(Math.abs(entity.money) + entity.profitMoney)}</Text>
            },
        }, {
            title: '利润',
            key: 'profit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profitMoney)}</Text>
            },
        }, {
            title: '利润率',
            key: 'profitPercent',
            dataIndex: 'entity',
            render: (entity) => {
                let profitPercent = MoneyUtil.safeDivision(entity.profitMoney, Math.abs(entity.money))
                return <Text type={MoneyUtil.getPercentColorType(profitPercent)}>
                    {MoneyUtil.getPercentStr(profitPercent)}</Text>
            },
        }, {
            title: '成本价',
            key: 'costPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getDetailStr(MoneyUtil.safeDivision(Math.abs(entity.money), Math.abs(entity.count)))}</Text>
            },
        }, {
            title: '卖出价',
            key: 'currentPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getDetailStr(
                    MoneyUtil.safeDivision(Math.abs(-1 * entity.money + entity.profitMoney), Math.abs(entity.count)))}</Text>
            },
        },]
    }

    getByYearSideDatas(monthStr = "01") {
        var months = SummaryService.queryMonths()
        this.months = months
        var items = []
        months.forEach(element => {
            let year = element.substring(0, 4)
            let startMonth = year + "-" + monthStr
            if (!items.includes(startMonth)) {
                items.push(startMonth)
            }
        })
        return items.sort((a, b) => b > a ? 1 : -1)
    }

    showDialog(type) {
        this.setState({
            showDialog: type,
        })
    }

    modifyMonth(d) {
        if (isNaN(d)) {
            message.error("请输入有效月份，如 2022-5")
        } else {
            this.state.startMonth = TimeUtil.monthStr(d).substring(5, 7)
            this.state.sideKey = null
            this.hideDialog()
        }
    }

    hideDialog() {
        this.setState({
            showDialog: "",
        })
    }

    render() {
        let sideDatas = this.getByYearSideDatas(this.state.startMonth)
        let siderItems = sideDatas.map((yearStartMonth, i) => {
            return {
                key: yearStartMonth,
                label: yearStartMonth
            }
        })
        if (DataUtil.isNull(this.state.sideKey)) {
            this.state.sideKey = sideDatas[0]
        }
        let yearStartMonthDate = new Date(this.state.sideKey)

        let yearData = IncomeExpenditureVMService.queryYearData(yearStartMonthDate)
        let allInvestData = InvestmentVMService.queryYearData(yearStartMonthDate)
        console.log("===== yearData     =====", yearData)
        console.log("===== allInvestData =====", allInvestData)

        let passiveIncomeSummary = this._getPassiveIncomeSummary(allInvestData)
        let passiveExpendSummary = this._getPassiveExpendSummary(allInvestData)

        let incomeExpendData = []
        incomeExpendData.push({
            key: "主动收入", entity: this.newEntity(null, "主动收入",
                yearData['income']['total'], null, yearData['income']['sumByMonth'].map(it => {
                    return this.newEntity(null, it['month'], it['total'], null)
                }))
        })
        incomeExpendData.push({
            key: "被动收入", entity: this.newEntity(null, "被动收入",
                passiveIncomeSummary['total'], null, passiveIncomeSummary['details'])
        })
        incomeExpendData.push({
            key: "主动支出", entity: this.newEntity(null, "主动支出",
                yearData['expend']['total'], null, yearData['expend']['sumByMonth'].map(it => {
                    return this.newEntity(null, it['month'], it['total'], null)
                }))
        })
        incomeExpendData.push({
            key: "被动支出", entity: this.newEntity(null, "被动支出",
                passiveExpendSummary['total'], null, passiveExpendSummary['details'])
        })
        incomeExpendData.push({
            key: "新增现金", entity: this.newEntity(null, "新增现金",
                yearData['income']['total'] + passiveIncomeSummary['total'] +
                yearData['expend']['total'] + passiveExpendSummary['total'], null)
        })

        let subIncomeExpendRowRender = (record, index) => {
            const data = [];
            record.entity.child.forEach(ele => {
                data.push({
                    key: DataUtil.isNull(ele.id) ? ele.title : ele.id,
                    entity: ele
                });
            })
            return <Table columns={this.subIncomeExpendColumns} dataSource={data} pagination={false} sortDirections={['descend']} />;
        }
        let subIncomeExpendRowExpandable = (record) => {
            return !DataUtil.isNull(record.entity.child) &&
                record.entity.child.length > 0
        }
        let fundData = this._mapToList(allInvestData['fund']['products'], true)
        let stockData = this._mapToList(allInvestData['stock']['products'], true)
        let assetDebtDatas = []
        assetDebtDatas.push(...this._mapToList(allInvestData['asset']['products']),
            ...this._mapToList(allInvestData['debt']['products']))

        let subInvestRowRender = (record, index) => {
            const data = [];
            record.entity.buySells.filterDatas.forEach(ele => {
                for (let profit of record.entity.profits?.filterDatas ?? []) {
                    if (profit.buySellId === ele.id) {
                        ele.profitMoney = profit.money
                        break
                    }
                }
                data.push({
                    key: ele.id,
                    entity: ele
                });
            })
            return <Table columns={this.subInvestColumns} dataSource={data} pagination={false} />;
        }
        let subInvestRowExpandable = (record) => {
            return !DataUtil.isNull(record.entity.buySells?.filterDatas) &&
                record.entity.buySells?.filterDatas.length > 0
        }
        let subAssetDebtRowRender = (record, index) => {
            const data = [];
            record.entity.profits.filterDatas.forEach(ele => {
                data.push({
                    key: ele.id,
                    entity: ele
                });
            })
            return <Table columns={this.subAssetDebtColumns} dataSource={data} pagination={false} />;
        }
        let subAssetDebtRowExpandable = (record) => {
            return !DataUtil.isNull(record.entity.profits?.filterDatas) &&
                record.entity.profits?.filterDatas.length > 0
        }

        const data01 = [
            { name: 'Group A', value: 400 },
            { name: 'Group B', value: 300 },
            { name: 'Group C', value: 300 },
            { name: 'Group D', value: 200 },
        ];
        const data02 = [
            { name: 'A1', value: 100 },
            { name: 'A2', value: 300 },
            { name: 'B1', value: 100 },
            { name: 'B2', value: 80 },
            { name: 'B3', value: 40 },
            { name: 'B4', value: 30 },
            { name: 'B5', value: 50 },
            { name: 'C1', value: 100 },
            { name: 'C2', value: 200 },
            { name: 'D1', value: 150 },
            { name: 'D2', value: 50 },
        ];

        let contentView = <Content>
            <Table columns={this.incomeExpendColumns} dataSource={incomeExpendData}
                expandable={{
                    expandedRowRender: subIncomeExpendRowRender,
                    rowExpandable: subIncomeExpendRowExpandable
                }} pagination={{ pageSize: 20 }} sortDirections={['descend']} />
            <Row>
                <Col span={12}>
                    <Divider orientation="center">收入</Divider>
                </Col>
                <Col span={12}>
                    <Divider orientation="center">支出</Divider>
                </Col>
            </Row>
            {/* todo */}
            <Row style={{ height: 300}}>
                <Col span={12}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart width="100%" height="100%">
                            <Pie data={data01} dataKey="value" cx="50%" cy="50%" outerRadius={60} fill="#8884d8"/>
                            <Pie data={data02} nameKey="name" dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#82ca9d" label/>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Col>
                <Col span={12}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart width="100%" height="100%">
                            <Pie data={data01} dataKey="value" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" />
                            <Pie data={data02} nameKey="name" dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={90} fill="#82ca9d" label/>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Col>
            </Row>

            <Divider orientation="center">指标</Divider>
            {UIUtils.createShowTextRow("被动收入/支出（财富自有率）", DataUtil.getPercent(passiveIncomeSummary['total'] /
                Math.abs(yearData['expend']['total'] + passiveExpendSummary['total'])))}
            {UIUtils.createShowTextRow("被动收入/主动收入", DataUtil.getPercent(passiveIncomeSummary['total'] / yearData['income']['total']))}
            <Divider orientation="center">资产/负债</Divider>
            <Table columns={this.assetDebtColumns} dataSource={assetDebtDatas}
                expandable={{
                    expandedRowRender: subAssetDebtRowRender,
                    rowExpandable: subAssetDebtRowExpandable
                }} pagination={{ pageSize: 20 }} scroll={{ x: 800 }} sortDirections={['descend']} />
            <Divider orientation="center">投资</Divider>
            <Table columns={this.investColumns} dataSource={stockData} expandable={{
                expandedRowRender: subInvestRowRender,
                rowExpandable: subInvestRowExpandable
            }} pagination={{ pageSize: 20 }} scroll={{ x: 1500 }} sortDirections={['descend']} />
            <Table columns={this.investColumns} dataSource={fundData} expandable={{
                expandedRowRender: subInvestRowRender,
                rowExpandable: subInvestRowExpandable
            }} pagination={{ pageSize: 20 }} scroll={{ x: 1500 }} sortDirections={['descend']} />
        </Content>

        return <Layout>
            <Sider width={200}>
                <Menu
                    className='Menu'
                    mode="inline"
                    selectedKeys={[this.state.sideKey]}
                    items={siderItems}
                    onSelect={(item) => {
                        this.setState(() => this.state.sideKey = item.key)
                    }}
                />
            </Sider>
            <Layout className='Layout-inner'>
                <Row align='middle'>
                    <Col flex="auto">
                        <Breadcrumb>
                            <Breadcrumb.Item>{this.state.sideKey}</Breadcrumb.Item>
                        </Breadcrumb>
                    </Col>
                    <Col span={12} align='right'>
                        <Button onClick={() => this.showDialog("modifyStartMonth")}>调整开始月份</Button>
                    </Col>
                </Row>
                {contentView}
            </Layout>
            <CusDialog title="调整开始月份" visible={this.state.showDialog === "modifyStartMonth"}
                cfgs={[{
                    name: "date",
                    hint: "月份",
                    picker: "month",
                    defaultValue: new Date('2022-01')
                }]}
                onOk={(state) => this.modifyMonth(state.date)}
                onCancel={() => this.hideDialog()} />
        </Layout>
    }

    newEntity(happenTime, title, money, desc, child = []) {
        return {
            happenTime: happenTime,
            title: title,
            money: money,
            desc: desc,
            child: child
        }
    }

    _mapToList(productMap, filter = false) {
        let arr = []
        for (let productId of Object.keys(productMap)) {
            let detail = productMap[productId]
            if (filter && MoneyUtil.noValue(detail.currentPrice?.money) && MoneyUtil.noValue(detail.profits?.filterTotalMoney) &&
                MoneyUtil.noValue(detail.buySells?.filterMoney) && MoneyUtil.noValue(detail.buySells?.totalMoney)) {
                //四个值全没有，不展示
            } else {
                arr.push({ key: productId, entity: detail })
            }
        }
        return arr
    }

    _getPassiveIncomeSummary(yearInvestData) {
        let assetData = yearInvestData['asset']
        let fundData = yearInvestData['fund']
        let stockData = yearInvestData['stock']
        return {
            'total': assetData['totalProfitMoneys'][1] + fundData['totalProfitMoneys'][1]
                + stockData['totalProfitMoneys'][1],
            'details': [
                this.newEntity(null, '资产收入', assetData['totalProfitMoneys'][1]),
                this.newEntity(null, '投资收入', fundData['totalProfitMoneys'][1]),
                this.newEntity(null, '股票收入', stockData['totalProfitMoneys'][1]),
            ]
        }
    }

    _getPassiveExpendSummary(yearInvestData) {
        let debtData = yearInvestData['debt']
        return {
            'total': debtData['totalProfitMoneys'][1],
            'details': [
                this.newEntity(null, '负债支出', debtData['totalProfitMoneys'][1]),
            ]
        }
    }
}

export default YearPage