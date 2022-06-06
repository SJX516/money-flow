import React from 'react'
import { Table, Tag, Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography } from "antd"
import { DataUtil, MoneyUtil, TimeUtil } from '../../utils/utils';
import InputWidget from './widget/input_widget';
import InvestmentService from '../../domain/service/investment_service';
import { CusDialog } from './widget/cus_dialog';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

//TODO 产品的总收益等等计算
class InvestPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}

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
            title: '份数',
            key: 'totalCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.buySells?.totalCount}</Text>
            },
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
        },];

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
            title: '份数',
            key: 'totalCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{Math.abs(entity.count)}</Text>
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

        this.productColumns = [
            {
                title: '类型',
                key: 'type',
                dataIndex: 'entity',
                render: (entity) => {
                    let color = 'volcano'
                    if (entity.type?.isAsset()) {
                        color = 'geekblue'
                    } else if (entity.type?.isDebt()) {
                        color = 'green'
                    }
                    return <Tag color={color} key={entity.type?.code}>
                        {entity.type?.name}
                    </Tag>
                },
            }, {
                title: '名称',
                key: 'name',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text>{entity.name}</Text>
                },
            }, {
                title: '定投额',
                key: 'fixVote',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text>{MoneyUtil.getStr(entity.fixVote)}</Text>
                },
            }, {
                title: '描述',
                key: 'desc',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text>{entity.desc}</Text>
                },
            },
            {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                    <Space size="middle">
                        <a onClick={() => { this.showEditProductDialog(record.entity) }}>编辑</a>
                        <a onClick={() => { this.deleteProduct(record.entity) }}>删除</a>
                    </Space>
                ),
            },
        ];
    }

    showEditProductDialog(detail) {
        this.setState({
            showDialog: "editProduct",
            currentProduct: detail
        })
    }

    editProduct(detail, state) {
        InvestmentService.editProduct(detail, state.desc, InputWidget.getMoney(state, "money"))
        this.hideDialog()
    }

    hideDialog() {
        this.setState({
            showDialog: "",
            currentProduct: null
        })
    }

    deleteInvestDetail(detail) {
        InvestmentService.deleteInvestDetail(detail)
        this.refreshPage()
    }

    refreshPage() {
        this.setState({
            updateTime: new Date().getTime()
        })
    }

    addProduct(s) {
        InvestmentService.upsertProduct(s.type, s.name, s.desc)
        this.refreshPage()
    }

    queryProducts() {
        return InvestmentService.queryProducts()
    }

    deleteProduct(entity) {
        InvestmentService.deleteProduct(entity)
        this.refreshPage()
    }

    queryAllInvestData() {
        let map = InvestmentService.getAllInvestDetailBefore(null)
        this._processInvestData(map.invest)
        return map
    }

    _processInvestData(details) {
        for (let productId of Object.keys(details)) {
            let detail = details[productId]
        }
    }

    render() {
        console.log('invest page render')
        let code2Name = {}
        InvestmentService.getProductTypes().forEach(type => {
            code2Name[type.code] = [type.name]
        })
        let productData = []
        InvestmentService.queryProducts().sort((a, b) => Math.abs(a.type.code) < Math.abs(b.type.code) ? 1 : -1).forEach(entity => {
            productData.push({ key: entity.id, entity: entity })
        })

        let investMap = this.queryAllInvestData()

        let investDatas = []
        for (let productId of Object.keys(investMap.invest)) {
            let detail = investMap.invest[productId]
            investDatas.push({ key: productId, entity: detail })
        }
        let subInvestRowRender = (record, index) => {
            const data = [];
            console.log(record.entity)
            record.entity.buySells.datas.forEach(ele => {
                for (let profit of record.entity.profits?.datas ?? []) {
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
            return !DataUtil.isNull(record.entity.buySells?.datas)
        }
        return (
            <Content className='Content'>
                <Table columns={this.investColumns} dataSource={investDatas} expandable={{
                    expandedRowRender: subInvestRowRender,
                    rowExpandable: subInvestRowExpandable
                }} pagination={{pageSize: 20}} scroll={{ x: 1400 }} sortDirections={['descend']}/>
                <Row style={{ padding: '10px 5px', backgroundColor: "#eee" }}>
                    <Col span={8}>
                        <InputWidget title={"新增投资产品"} cfgs={[{
                            name: "type",
                            code2Name: code2Name,
                            required: true
                        }, {
                            name: "name",
                            required: true
                        }, {
                            name: "desc",
                        }
                        ]} onSubmit={(s) => {
                            this.addProduct(s)
                            return true
                        }} />
                    </Col>
                    <Col span={16}>
                        <Table columns={this.productColumns} dataSource={productData} pagination={{pageSize: 20}}/>
                    </Col>
                </Row>
                <CusDialog title="修改产品" visible={this.state.showDialog === "editProduct"}
                        key={this.state.currentProduct?.id}
                        cfgs={[{
                            name: "money",
                            hint: "定投额",
                            defaultValue: this.state.currentProduct?.fixVote / 100,
                            moneyPon: true
                        }, {
                            name: "desc",
                            defaultValue: this.state.currentProduct?.desc,
                        }]}
                        onOk={(state) => this.editProduct(this.state.currentProduct, state)}
                        onCancel={() => this.hideDialog()} />
            </Content>
        )
    }
}

export default InvestPage