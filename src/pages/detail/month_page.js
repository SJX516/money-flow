import React from 'react'
import { Table, Tag, Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography, message } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { DataUtil, MoneyUtil, TimeUtil } from '../../utils/utils';
import InputWidget from './widget/input_widget';
import InvestmentService from '../../domain/service/investment_service';
import { InvestmentRecordType, InvestmentType } from '../../domain/entity/investment';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

class MonthPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}

        this.incomeExpendColumns = [{
            title: '名称',
            key: 'title',
            dataIndex: 'entity',
            render: (entity) => {
                let color = 'geekblue'
                if (entity.title === '主动收入' || entity.title === '被动收入') {
                    color = 'volcano'
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
            title: '发生时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.happenTime)}</Text>
            },
        }, {
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
            sorter: (a, b) => MoneyUtil.compare(a.entity.money, b.entity.money)
        }, {
            title: '描述',
            key: 'desc',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.desc}</Text>
            },
        }, {
            title: '操作',
            key: 'action',
            render: (_, record) => {
                if(!DataUtil.isNull(record.entity.id)) {
                    return <Space size="middle">
                        <a onClick={() => {
                            this.deleteIncomeExpendDetail(record.entity.id)
                        }}>删除</a>
                    </Space>
                }
            }   
        },]

        this.investColumns = [{
            title: '类型',
            key: 'type',
            dataIndex: 'entity',
            render: (entity) => {
                return <Tag color={"volcano"} key={entity.info.productType.code}>
                    {entity.info.productType.name}
                </Tag>
            },
        }, {
            title: '名称',
            key: 'name',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.info.productName}</Text>
            },
        }, {
            title: '当月投资',
            key: 'currentMonthInvest',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.buySells?.currentMonthMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.buySells?.currentMonthMoney, b.entity.buySells?.currentMonthMoney)
        }, {
            title: '投资总额',
            key: 'totalInvest',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.buySells?.totalMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.buySells?.totalMoney, b.entity.buySells?.totalMoney)
        }, {
            title: '最新价值',
            key: 'lastPrice',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.currentPrice?.money)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.currentPrice?.money, b.entity.currentPrice?.money)
        }, {
            title: '当月入账利润',
            key: 'currentMonthProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profits?.currentMonthMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.profits?.currentMonthMoney, b.entity.profits?.currentMonthMoney)
        }, {
            title: '账面利润',
            key: 'totalProfit',
            dataIndex: 'entity',
            render: (entity) => {
                let ungetProfit = entity.currentPrice?.money - entity.buySells?.totalMoney
                return <Text>{MoneyUtil.getStr(ungetProfit)}</Text>
            },
            sorter: (a, b) => {
                let aungetProfit = a.entity.currentPrice?.money - a.entity.buySells?.totalMoney
                let bungetProfit = b.entity.currentPrice?.money - b.entity.buySells?.totalMoney
                return MoneyUtil.compare(aungetProfit, bungetProfit)
            }
        }, {
            title: '成本价',
            key: 'costPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(MoneyUtil.safeDivision(entity.buySells?.totalMoney, entity.buySells.totalCount))}</Text>
            },
        }, {
            title: '现价',
            key: 'currentPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(MoneyUtil.safeDivision(entity.currentPrice?.money, entity.buySells.totalCount))}</Text>
            },
        }, {
            title: '最新时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.currentPrice?.happenTime)}</Text>
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
                return <Text>{MoneyUtil.getStr(-1 * entity.money + entity.profitMoney)}</Text>
            },
        }, {
            title: '利润',
            key: 'profit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profitMoney)}</Text>
            },
        }, {
            title: '成本价',
            key: 'costPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(MoneyUtil.safeDivision(Math.abs(entity.money), Math.abs(entity.count)))}</Text>
            },
        }, {
            title: '卖出价',
            key: 'currentPricePerCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(
                    MoneyUtil.safeDivision(Math.abs(-1 * entity.money + entity.profitMoney), Math.abs(entity.count)))}</Text>
            },
        }, {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={() => {
                        this.deleteInvestDetail(record.entity)
                    }}>删除</a>
                </Space>
            ),
        },]

        this.assetDebtColumns = [{
            title: '类型',
            key: 'type',
            dataIndex: 'entity',
            render: (entity) => {
                let color = 'geekblue'
                if (entity.info.productType.isDebt()) {
                    color = 'green'
                }
                return <Tag color={color} key={entity.info.productType.code}>
                    {entity.info.productType.name}
                </Tag>
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
            title: '当月入账利润',
            key: 'currentMonthProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profits?.currentMonthMoney)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compare(a.entity.profits?.currentMonthMoney, b.entity.profits?.currentMonthMoney)
        }, {
            title: '最新时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.currentPrice?.happenTime)}</Text>
            },
        }]

        this.subAssetDebtColumns = [{
            title: '发生时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.happenTime)}</Text>
            },
        }, {
            title: '入账利润',
            key: 'currentMonthProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.money)}</Text>
            },
        }, {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a onClick={() => {
                        this.deleteInvestDetail(record.entity)
                    }}>删除</a>
                </Space>
            ),
        },]
    }

    queryData(monthDate) {
        return IncomeExpenditureService.queryMonth(monthDate)
    }

    insertData(inputValues) {
        try {
            let money = InputWidget.getMoney(inputValues, "money")
            let date = inputValues.date
            IncomeExpenditureService.upsert(money,
                IncomeExpenditureType.getByCode(inputValues.type), date, inputValues.desc ?? "")
            this.refreshPage()
            return true
        } catch (e) {
            console.warn(e)
            alert(e)
            return false
        }
    }

    queryAllInvestDataBefore(monthDate) {
        let map = InvestmentService.getAllInvestDetailBefore(TimeUtil.monthEnd(monthDate))
        this._processInvestData(map.asset, monthDate)
        this._processInvestData(map.debt, monthDate)
        this._processInvestData(map.invest, monthDate)
        return map
    }

    getLastMonthTotalMoney(currentMonthDate) {
        let investMap = this.queryAllInvestDataBefore(TimeUtil.lastMonthEnd(currentMonthDate))
        let totalAssetMoneys = this.dealInvestDetailList(investMap.asset, [])
        let totalDebtMoneys = this.dealInvestDetailList(investMap.debt, [])
        let totalInvestMoneys = this.dealInvestDetailList(investMap.invest, [])
        return totalAssetMoneys[0] + totalDebtMoneys[0] + totalInvestMoneys[2]
    }

    _processInvestData(details, currentMonthDate) {
        for (let productId of Object.keys(details)) {
            let detail = details[productId]
            if (!DataUtil.isNull(detail.profits)) {
                let currentMonthMoney = 0
                let currentMonthDatas = []
                detail.profits.datas.forEach(ele => {
                    if (TimeUtil.inMonth(ele.happenTime, currentMonthDate)) {
                        currentMonthMoney += ele.money
                        currentMonthDatas.push(ele)
                    }
                })
                detail.profits.currentMonthMoney = currentMonthMoney
                detail.profits.currentMonthDatas = currentMonthDatas
            }
            if (!DataUtil.isNull(detail.buySells)) {
                let currentMonthMoney = 0
                let currentMonthDatas = []
                detail.buySells.datas.forEach(ele => {
                    if (TimeUtil.inMonth(ele.happenTime, currentMonthDate)) {
                        currentMonthMoney += ele.money
                        currentMonthDatas.push(ele)
                    }
                })
                detail.buySells.currentMonthMoney = currentMonthMoney
                detail.buySells.currentMonthDatas = currentMonthDatas
            }
        }
    }

    addBuyInvest(s) {
        let productCode = s.type
        let productName = s.typeName
        let productTypeCode = s.typeParentCode
        let money = InputWidget.getMoney(s, "money")
        let currentPrice = InputWidget.getMoney(s, "currentPrice")
        let count = s.count
        let happenTime = s.date
        InvestmentService.addBuyInvest(productCode, productName, productTypeCode, count, money, currentPrice, happenTime)
        this.refreshPage()
        return true
    }

    addSellInvest(s) {
        let productCode = s.type
        let productName = s.typeName
        let productTypeCode = s.typeParentCode
        let count = s.count
        let money = InputWidget.getMoney(s, "money")
        let currentPrice = InputWidget.getMoney(s, "currentPrice")
        let currentProfit = InputWidget.getMoney(s, "currentProfit")
        let sellProfit = InputWidget.getMoney(s, "sellProfit")
        let happenTime = s.date
        if (!DataUtil.notNumber(sellProfit)) {
            InvestmentService.addSellInvestOfProfit(productCode, productName, productTypeCode, count, money, sellProfit, currentPrice, happenTime)
        } else if (!DataUtil.notNumber(currentProfit)) {
            InvestmentService.addSellInvest(productCode, productName, productTypeCode, count, money, currentPrice, currentProfit, happenTime)
        } else {
            message.error("卖出利润 或 账面利润 必须填写一个！")
            return false
        }
        this.refreshPage()
        return true
    }

    addAssetDebtProfit(s) {
        let productCode = s.type
        let productName = s.typeName
        let productTypeCode = s.typeParentCode
        let money = InputWidget.getMoney(s, "money")
        let currentPrice = InputWidget.getMoney(s, "currentPrice")
        let happenTime = s.date
        InvestmentService.addAssetDebtProfit(productCode, productName, productTypeCode, money, currentPrice, happenTime)
        this.refreshPage()
        return true
    }

    deleteInvestDetail(detail) {
        InvestmentService.deleteInvestDetail(detail)
        this.refreshPage()
    }

    deleteIncomeExpendDetail(id) {
        IncomeExpenditureService.delete(id)
        this.refreshPage()
    }

    refreshPage() {
        this.setState({
            updateTime: new Date().getTime()
        })
    }

    createShowMoneyRowIfBiggerThan(title, money, valueRange = []) {
        let textType = ""
        let pMoney = Math.abs(money)
        if (valueRange[0] !== undefined) {
            if (pMoney > valueRange[1] * 100) {
                textType = "danger"
            } else if (pMoney > valueRange[0] * 100) {
                textType = "warning"
            } else {
                textType = "success"
            }
        }
        return this.createShowTextRow(title, MoneyUtil.getStr(money), textType)
    }

    createShowMoneyRowIfSmallerThan(title, money, valueRange = []) {
        let textType = ""
        let pMoney = Math.abs(money)
        if (valueRange[0] !== undefined) {
            if (pMoney < valueRange[1] * 100) {
                textType = "danger"
            } else if (pMoney < valueRange[0] * 100) {
                textType = "warning"
            } else {
                textType = "success"
            }
        }
        return this.createShowTextRow(title, MoneyUtil.getStr(money), textType)
    }

    createShowMoneyRow(title, money) {
        return this.createShowTextRow(title, MoneyUtil.getStr(money), "")
    }

    createShowTextRow(title, text, textType = "") {
        return (<Row align='middle' style={{ margin: '0 10px', padding: '4px 0', }} >
            <Col span={12}>
                <Text type={textType} strong>{title}</Text>
            </Col>
            <Col span={12} align='right'>
                <Text type={textType} strong>{text}</Text>
            </Col>
        </Row>
        )
    }

    /**
     * @param {IncomeExpenditureDetail} detail 
     */
    newEntityFromDetail(detail) {
        return {
            id: detail.id,
            happenTime: detail.happenTime,
            title: detail.type.name,
            money: detail.money,
            desc: detail.desc,
        }
    }

    newEntity(happenTime, title, money, desc, child=[]) {
        return {
            happenTime: happenTime,
            title: title,
            money: money,
            desc: desc,
            child: child
        }
    }

    dealInvestDetailList(details, entitys) {
        let totalCurrentPrice = 0, totalBuySellMoney = 0, totalProfit = 0
        for (let productId of Object.keys(details)) {
            let detail = details[productId]
            if (!DataUtil.isNull(detail.currentPrice)) {
                totalCurrentPrice += detail.currentPrice.money
            }
            if (!DataUtil.isNull(detail.profits)) {
                if(detail.profits.currentMonthMoney !== 0) {
                    entitys.push(this.newEntity(detail.info.happenTime, detail.info.productName, detail.profits.currentMonthMoney, null))
                    totalProfit += detail.profits.currentMonthMoney
                }
            }
            if (!DataUtil.isNull(detail.buySells)) {
                totalBuySellMoney += detail.buySells.totalMoney
            }
        }
        return [totalCurrentPrice, totalProfit, totalBuySellMoney]
    }

    render() {
        let currentMonthDate = new Date(this.props.month)
        if (DataUtil.notNumber(currentMonthDate)) {
            return <Content />
        }
        console.log("month page render " + this.props.month)
        //处理一些类型数据
        let expendCode2Name = {}, incomeCode2Name = {}
        IncomeExpenditureType.toList(IncomeExpenditureService.getExpenditureTypes()).forEach(type => {
            expendCode2Name[type.code] = [type.name]
        })
        IncomeExpenditureType.toList(IncomeExpenditureService.getIncomeTypes()).forEach(type => {
            incomeCode2Name[type.code] = [type.name]
        })
        let investProductCode2Name = {}, assetProductCode2Name = {}, debtProductCode2Name = {}
        InvestmentService.queryProducts().forEach(entity => {
            if (entity.type.isAsset()) {
                assetProductCode2Name[entity.id] = [entity.name, entity.type.code, entity.type.name]
            } else if (entity.type.isDebt()) {
                debtProductCode2Name[entity.id] = [entity.name, entity.type.code, entity.type.name]
            } else {
                investProductCode2Name[entity.id] = [entity.name, entity.type.code, entity.type.name]
            }
        })
        //处理收支数据
        let incomeExpendData = []
        let totalIncome = 0, totalExpend = 0
        let incomeEntitys = [], expendEntitys = []
        this.queryData(currentMonthDate).sort((a, b) => Math.abs(a.type.code) > Math.abs(b.type.code) ? 1 : -1).forEach(detail => {
            if (detail.type.code > 0) {
                incomeEntitys.push(this.newEntityFromDetail(detail))
                totalIncome += detail.money
            } else {
                expendEntitys.push(this.newEntityFromDetail(detail))
                totalExpend += detail.money
            }
        })

        //处理资产、负债、投资的一些总数据
        let investMap = this.queryAllInvestDataBefore(currentMonthDate)
        let passiveIncomeEntitys = [], passiveExpendEntitys = []
        let totalAssetMoneys = this.dealInvestDetailList(investMap.asset, passiveIncomeEntitys)
        let totalDebtMoneys = this.dealInvestDetailList(investMap.debt, passiveExpendEntitys)
        let totalInvestMoneys = this.dealInvestDetailList(investMap.invest, passiveIncomeEntitys)

        let lastMonthTotalMoney = this.getLastMonthTotalMoney(currentMonthDate)
        let currentMonthTotalMoney = totalAssetMoneys[0] + totalDebtMoneys[0] + totalInvestMoneys[2]
        let currentMonthAddMoney = totalIncome + totalExpend + totalAssetMoneys[1]
            + totalInvestMoneys[1] + totalDebtMoneys[1]

        incomeExpendData.push({key: "主动收入", entity: this.newEntity(null, "主动收入", totalIncome, null, incomeEntitys)})    
        incomeExpendData.push({key: "被动收入", entity: this.newEntity(null, "被动收入", totalAssetMoneys[1] + totalInvestMoneys[1], 
            null, passiveIncomeEntitys)})
        incomeExpendData.push({key: "主动支出", entity: this.newEntity(null, "主动支出", totalExpend, null, expendEntitys)})
        incomeExpendData.push({key: "被动支出", entity: this.newEntity(null, "被动支出", totalDebtMoneys[1], 
            null, passiveExpendEntitys)})
        incomeExpendData.push({key: "新增现金", entity: this.newEntity(null, "新增现金", currentMonthAddMoney, 
            null)})
        incomeExpendData.push({key: "上期总资产", entity: this.newEntity(null, "上期总资产", lastMonthTotalMoney, 
            null)})

        let totalMoneyEntitys = []
        totalMoneyEntitys.push(this.newEntity(null, "资产总额", totalAssetMoneys[0], null))
        totalMoneyEntitys.push(this.newEntity(null, "负债总额", totalDebtMoneys[0], null))
        totalMoneyEntitys.push(this.newEntity(null, "投资总额", totalInvestMoneys[2], `账面价值：${MoneyUtil.getStr(totalInvestMoneys[0])}`))
        incomeExpendData.push({key: "当前总资产", entity: this.newEntity(null, "当前总资产", currentMonthTotalMoney, 
            null, totalMoneyEntitys)})

        let subIncomeExpendRowRender = (record, index) => {
            const data = [];
            record.entity.child.forEach(ele => {
                data.push({
                    key: DataUtil.isNull(ele.id) ? ele.title : ele.id,
                    entity: ele
                });
            })
            return <Table columns={this.subIncomeExpendColumns} dataSource={data} pagination={false} sortDirections={['descend']}/>;
        }
        let subIncomeExpendRowExpandable = (record) => {
            return !DataUtil.isNull(record.entity.child) &&
                record.entity.child.length > 0
        }

        //处理资产、负债、投资的表格数据
        let inveseData = []
        for (let productId of Object.keys(investMap.invest)) {
            let detail = investMap.invest[productId]
            inveseData.push({ key: productId, entity: detail })
        }

        let assetDebtDatas = []
        for (let productId of Object.keys(investMap.asset)) {
            let detail = investMap.asset[productId]
            assetDebtDatas.push({ key: productId, entity: detail })
        }
        for (let productId of Object.keys(investMap.debt)) {
            let detail = investMap.debt[productId]
            assetDebtDatas.push({ key: productId, entity: detail })
        }
        let subInvestRowRender = (record, index) => {
            const data = [];
            record.entity.buySells.currentMonthDatas.forEach(ele => {
                for (let profit of record.entity.profits?.currentMonthDatas ?? []) {
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
            return !DataUtil.isNull(record.entity.buySells?.currentMonthDatas) &&
                record.entity.buySells?.currentMonthDatas.length > 0
        }
        let subAssetDebtRowRender = (record, index) => {
            const data = [];
            record.entity.profits.currentMonthDatas.forEach(ele => {
                data.push({
                    key: ele.id,
                    entity: ele
                });
            })
            return <Table columns={this.subAssetDebtColumns} dataSource={data} pagination={false} />;
        }
        let subAssetDebtRowExpandable = (record) => {
            return !DataUtil.isNull(record.entity.profits?.currentMonthDatas) &&
                record.entity.profits?.currentMonthDatas.length > 0
        }

        return (
            <Content className='Content'>
                <Row justify="space-between" style={{ padding: '10px 5px', backgroundColor: "#eee" }}>
                    <Divider orientation="center">新增收入/支出</Divider>
                    <Col span={8}>
                        <InputWidget title="收入" cfgs={[{
                            name: "type",
                            code2Name: incomeCode2Name,
                            required: true
                        }, {
                            name: "money",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }, {
                            name: "desc",
                        }
                        ]} onSubmit={(s) => {
                            return this.insertData(s)
                        }} />
                        <InputWidget title="支出" cfgs={[{
                            name: "type",
                            code2Name: expendCode2Name,
                            required: true
                        }, {
                            name: "money",
                            required: true,
                            moneyPon: false
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }, {
                            name: "desc",
                        }
                        ]} onSubmit={(s) => {
                            return this.insertData(s)
                        }} />
                    </Col>
                    <Col span={16}>
                        <Table columns={this.incomeExpendColumns} dataSource={incomeExpendData}
                            expandable={{
                                expandedRowRender: subIncomeExpendRowRender,
                                rowExpandable: subIncomeExpendRowExpandable
                            }} pagination={{ pageSize: 20 }} sortDirections={['descend']} />
                        <Divider orientation="center">指标</Divider>
                        {this.createShowTextRow("被动收入/主动收入", DataUtil.getPercent(totalAssetMoneys[1] / totalIncome))}
                        {this.createShowTextRow("被动收入/主动支出", DataUtil.getPercent(totalAssetMoneys[1] / Math.abs(totalExpend)))}
                        {/* 大于 0 表示：新增现金少了 或 当前总资产多了 */}
                        {this.createShowMoneyRowIfBiggerThan("总资产环比误差", currentMonthTotalMoney - lastMonthTotalMoney - currentMonthAddMoney, [500, 1000])}
                    </Col>
                </Row>
                <Row justify="space-between" style={{ padding: '10px 5px', backgroundColor: "#eee" }}>
                    <Divider orientation="center">资产/负债</Divider>
                    <Col span={8}>
                        <InputWidget title="资产" cfgs={[{
                            name: "type",
                            code2Name: assetProductCode2Name,
                            required: true
                        }, {
                            name: "currentPrice",
                            hint: "账面价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "money",
                            hint: "收益",
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }
                        ]} onSubmit={(s) => {
                            return this.addAssetDebtProfit(s)
                        }} />

                        <InputWidget title="负债" cfgs={[{
                            name: "type",
                            code2Name: debtProductCode2Name,
                            required: true
                        }, {
                            name: "currentPrice",
                            hint: "账面价值",
                            required: true,
                            moneyPon: false
                        }, {
                            name: "money",
                            hint: "亏损",
                            moneyPon: false
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }
                        ]} onSubmit={(s) => {
                            return this.addAssetDebtProfit(s)
                        }} />
                    </Col>
                    <Col span={16}>
                        <Table columns={this.assetDebtColumns} dataSource={assetDebtDatas}
                            expandable={{
                                expandedRowRender: subAssetDebtRowRender,
                                rowExpandable: subAssetDebtRowExpandable
                            }} pagination={{ pageSize: 20 }} scroll={{ x: 1000 }} sortDirections={['descend']} />
                    </Col>
                </Row>
                <Row style={{ padding: '10px 5px', backgroundColor: "#eee" }}>
                    <Divider orientation="center">投资</Divider>
                    <Col span={8}>
                        <InputWidget title="买入投资" cfgs={[{
                            name: "type",
                            code2Name: investProductCode2Name,
                            required: true
                        }, {
                            name: "money",
                            hint: "花费金额",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "currentPrice",
                            hint: "账面价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "count",
                            hint: "份数",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }
                        ]} onSubmit={(s) => {
                            return this.addBuyInvest(s)
                        }} />
                        <InputWidget title="卖出投资" cfgs={[{
                            name: "type",
                            code2Name: investProductCode2Name,
                            required: true
                        }, {
                            name: "count",
                            hint: "份数",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "money",
                            hint: "卖出所得金额",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "sellProfit",
                            hint: "卖出利润-可负（二选一）",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "currentPrice",
                            hint: "账面价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "currentProfit",
                            hint: "账面利润-可负（二选一）",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }
                        ]} onSubmit={(s) => {
                            return this.addSellInvest(s)
                        }} />
                    </Col>
                    <Col span={16}>
                        <Table columns={this.investColumns} dataSource={inveseData} expandable={{
                            expandedRowRender: subInvestRowRender,
                            rowExpandable: subInvestRowExpandable
                        }} pagination={{ pageSize: 20 }} scroll={{ x: 1000 }} sortDirections={['descend']} />
                    </Col>
                </Row>
            </Content>
        )
    }
}

export default MonthPage