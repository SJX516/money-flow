import React from 'react'
import { Table, Tag, Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { DataUtil, TimeUtil } from '../../utils/utils';
import InputWidget from './widget/input_widget';
import InvestmentService from '../../domain/service/investment_service';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

class MonthPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}

        this.investColumns = [{
                title: '类型',
                key: 'type',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Tag key={entity.type.code}>
                        {entity.type.name}
                    </Tag>
                },
            }, {
                title: '名称',
                key: 'name',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.name}</a>
                },
            }, {
                title: '当月投资',
                key: 'lastPrice',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.desc}</a>
                },
            }, {
                title: '投资总额',
                key: 'lastPrice',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.desc}</a>
                },
            }, {
                title: '最新价值',
                key: 'lastPrice',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.desc}</a>
                },
            }, {
                title: '总利润',
                key: 'lastPrice',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.desc}</a>
                },
            }, {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                    <Space size="middle">
                        <a onClick={() => {this.deleteProduct(record.entity)}}>删除</a>
                    </Space>
                ),
            },
        ];
    }

    queryData(month) {
        if (DataUtil.isEmpty(month)) {
            return []
        } else {
            return IncomeExpenditureService.queryMonth(month)
        }
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

    addBuyInvest(s) {
        let productCode = s.type
        let productName = s.typeName
        let money = InputWidget.getMoney(s, "money")
        let currentPrice = InputWidget.getMoney(s, "currentPrice")
        let happenTime = s.date
        InvestmentService.addBuyInvest(productCode, productName, money, currentPrice,happenTime)
        return true
    }

    addSellInvest(s) {
        let productCode = s.type
        let productName = s.typeName
        let money = InputWidget.getMoney(s, "money")
        let currentPrice = InputWidget.getMoney(s, "currentPrice")
        let currentProfit = InputWidget.getMoney(s, "currentProfit")
        let happenTime = s.date
        InvestmentService.addSellInvest(productCode, productName, money, currentPrice, currentProfit, happenTime)
        return true
    }

    addInvestProfit(s) {
        let productCode = s.type
        let productName = s.typeName
        let money = InputWidget.getMoney(s, "money")
        let happenTime = s.date
        InvestmentService.addInvestProfit(productCode, productName, money, happenTime)
        return true
    }

    refreshPage() {
        this.setState({
            updateTime: new Date().getTime()
        })
    }

    /**
     * @param {IncomeExpenditureDetail} detail 
     */
    createMoneyRow(detail) {
        const handleDelete = (event) => {
            IncomeExpenditureService.delete(detail)
            this.refreshPage()
        }

        const content = (
            <div>
                <p>发生日期：{TimeUtil.dayStr(detail.happenTime)} {TimeUtil.weekDayStr(detail.happenTime)}</p>
                <p>描述：{detail.desc}</p>
            </div>
        );

        return (<Popover content={content}>
            <Row align='middle' style={{ padding: '4px 0', }} >
                <Col span={8} offset={4}>
                    <Text strong>{detail.type.name}</Text>
                </Col>
                <Col span={6} offset={2}>
                    <Text strong>￥{detail.money / 100}</Text>
                </Col>
                <Col span={4} >
                    <Button type="link" onClick={handleDelete}> 删除 </Button>
                </Col>
            </Row>
        </Popover>)
    }

    createShowMoneyRow(title, money) {
        return (<Row align='middle' style={{ padding: '4px 0', }} >
            <Col span={8} offset={4}>
                <Text strong>{title}</Text>
            </Col>
            <Col span={6} offset={2}>
                <Text strong>￥{money / 100}</Text>
            </Col>
            <Col span={4} >
            </Col>
        </Row>
        )
    }

    render() {
        console.log("month page render")
        let expendCode2Name = {}
        IncomeExpenditureType.toList(IncomeExpenditureService.getExpenditureTypes()).forEach(type => {
            expendCode2Name[type.code] = type.name
        })
        let incomeCode2Name = {}
        IncomeExpenditureType.toList(IncomeExpenditureService.getIncomeTypes()).forEach(type => {
            incomeCode2Name[type.code] = type.name
        })
        let investProductCode2Name = {}
        InvestmentService.queryProducts().forEach(entity => {
            investProductCode2Name[entity.id] = entity.name
        })
        let totalIncome = 0, totalExpend = 0
        let details = this.queryData(this.props.month).sort((a, b) => Math.abs(a.type.code) > Math.abs(b.type.code) ? 1 : -1)
        let incomeWidgets = []
        let expenditureWidgets = []
        for (let detail of details) {
            if (detail.type.code > 0) {
                incomeWidgets.push(this.createMoneyRow(detail))
                totalIncome += detail.money
            } else {
                expenditureWidgets.push(this.createMoneyRow(detail))
                totalExpend += detail.money
            }
        }

        return (
            <Content className='Content'>
                <Row justify="space-between">
                    <Col className="col-block" span={7}>
                        <Divider orientation="center">主动收入</Divider>
                        <InputWidget cfgs={[{
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
                        {incomeWidgets}
                    </Col>
                    <Col className="col-block" span={7}>
                        <Divider orientation="center">支出</Divider>
                        <InputWidget cfgs={[{
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
                        {expenditureWidgets}
                    </Col>
                    <Col className="col-block" span={7}>
                        <Divider orientation="center">现金</Divider>
                        {this.createShowMoneyRow("总收入", totalIncome)}
                        {this.createShowMoneyRow("总支出", totalExpend)}
                        {this.createShowMoneyRow("新增现金", totalIncome + totalExpend)}
                    </Col>
                </Row>
                <Row justify="space-between" style={{ margin: '20px 0', backgroundColor: "#eee" }}>
                    <Divider orientation="center">资产</Divider>
                    <Col span={7}>
                        <InputWidget title="买入" cfgs={[{
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
                            hint: "最新总价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }
                        ]} onSubmit={(s) => {
                            return this.addBuyInvest(s)
                        }} />
                    </Col>
                    <Col span={7}>
                        <InputWidget title="卖出" cfgs={[{
                            name: "type",
                            code2Name: investProductCode2Name,
                            required: true
                        }, {
                            name: "money",
                            hint: "卖出所得金额",
                            required: true,
                            moneyPon: true
                        },  {
                            name: "currentPrice",
                            hint: "最新总价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "currentProfit",
                            hint: "最新利润-可负",
                            required: true,
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
                    <Col span={7}>
                        <InputWidget title="收益/亏损" cfgs={[{
                            name: "type",
                            code2Name: investProductCode2Name,
                            required: true
                        }, {
                            name: "money",
                            hint: "利润-可负",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: this.props.month
                        }
                        ]} onSubmit={(s) => {
                            return this.addInvestProfit(s)
                        }} />
                    </Col>
                </Row>
                <Table columns={this.investColumns}></Table>
            </Content>
        )
    }
}

export default MonthPage