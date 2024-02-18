import { Col, Divider, Layout, Row, Space, Table, Tag, Typography } from "antd";
import React from 'react';
import InvestmentService from '../../domain/service/investment_service';
import { InvestmentVMService } from '../../domain/service/view_model_service';
import { DataUtil, MoneyUtil, TimeUtil } from '../../utils/utils';
import { CusDialog } from './widget/cus_dialog';
import InputWidget from './widget/input_widget';

const { Content } = Layout;
const { Text} = Typography;

class InvestPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}

        this.investColumns = [{
            title: '类型',
            key: 'type',
            dataIndex: 'entity',
            render: (entity) => {
                let color = 'gold'
                if (entity.info.productType.isStock()) {
                    color = 'red'
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
            title: '最新时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.dayStr(entity.currentPrice?.happenTime)}</Text>
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
            title: '卖出总额',
            key: 'sellPrice',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(Math.abs(entity.buySells?.totalSellMoney))}</Text>
            },
            sorter: (a, b) => MoneyUtil.compareAbs(a.entity.buySells?.totalSellMoney, b.entity.buySells?.totalSellMoney)
        }, {
            title: '卖出利润率',
            key: 'sellProfitPercent',
            dataIndex: 'entity',
            render: (entity) => {
                let sellProfitPercent = this.getSellProfitPercent(entity)
                return <Text type={MoneyUtil.getPercentColorType(sellProfitPercent)}>
                    {MoneyUtil.getPercentStr(sellProfitPercent)}</Text>
            },
            sorter: (a, b) => {
                let asellProfitPercent = this.getSellProfitPercent(a.entity)
                let bsellProfitPercent = this.getSellProfitPercent(b.entity)
                return DataUtil.compare(asellProfitPercent, bsellProfitPercent)
            }
        }, {
            title: '卖出利润',
            key: 'sellProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.profits?.totalMoney)}</Text>
            },
            sorter: (a, b) => {
                return MoneyUtil.compare(a.entity.profits?.totalMoney, b.entity.profits?.totalMoney)
            }
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
        }, {
            title: '份数',
            key: 'totalCount',
            dataIndex: 'entity',
            render: (entity) => {
                var count = entity.buySells?.totalCount
                return <Text>{Math.abs(count) == 0 ? "-" : Math.abs(count)}</Text>
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
            title: '利润率',
            key: 'profitPercent',
            dataIndex: 'entity',
            render: (entity) => {
                let profitPercent = MoneyUtil.safeDivision(entity.profitMoney, Math.abs(entity.money))
                return <Text type={MoneyUtil.getPercentColorType(profitPercent)}>
                    {MoneyUtil.getPercentStr(profitPercent)}</Text>
            },
        }, {
            title: '份数',
            key: 'totalCount',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{Math.abs(entity.count) == 0 ? "-" : Math.abs(entity.count)}</Text>
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
                    let color = 'gold'
                    if (entity.type?.isAsset()) {
                        color = 'geekblue'
                    } else if (entity.type?.isDebt()) {
                        color = 'green'
                    } else if (entity.type?.isStock()) {
                        color = 'red'
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

        this.productFixVoteColumns = [
            {
                title: '类型',
                key: 'type',
                dataIndex: 'entity',
                render: (entity) => {
                    let color = 'gold'
                    return <Tag color={color} key={entity.productTypeCode}>
                        {entity.productTypeName}
                    </Tag>
                },
            }, {
                title: '名称',
                key: 'name',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text>{entity.productName}</Text>
                },
            }, {
                title: '定投额',
                key: 'fixVote',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text>{MoneyUtil.getStr(entity.productFixVote)}</Text>
                },
            }, {
                title: '账面利润率',
                key: 'paperProfitPercent',
                dataIndex: 'entity',
                render: (entity) => {
                    let paperProfitPercent = entity.paperProfitPercent
                    return <Text type={MoneyUtil.getPercentColorType(paperProfitPercent)}>
                        {MoneyUtil.getPercentStr(paperProfitPercent)}</Text>
                },
                sorter: (a, b) => {
                    let apaperProfitPercent = a.entity.paperProfitPercent
                    let bpaperProfitPercent = b.entity.paperProfitPercent
                    return DataUtil.compare(apaperProfitPercent, bpaperProfitPercent)
                }
            }, {
                title: '卖出利润率',
                key: 'sellProfitPercent',
                dataIndex: 'entity',
                render: (entity) => {
                    let sellProfitPercent = entity.sellProfitPercent
                    return <Text type={MoneyUtil.getPercentColorType(sellProfitPercent)}>
                        {MoneyUtil.getPercentStr(sellProfitPercent)}</Text>
                },
                sorter: (a, b) => {
                    let asellProfitPercent = a.entity.sellProfitPercent
                    let bsellProfitPercent = b.entity.sellProfitPercent
                    return DataUtil.compare(asellProfitPercent, bsellProfitPercent)
                }
            }, {
                title: '描述',
                key: 'desc',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text>{entity.product?.desc}</Text>
                },
            },
            {
                title: '操作',
                key: 'action',
                render: (_, record) => {
                    if(!DataUtil.isNull(record.entity.product)) {
                        return <Space size="middle">
                            <a onClick={() => { this.showEditProductDialog(record.entity.product) }}>编辑</a>
                            <a onClick={() => { this.deleteProduct(record.entity.product) }}>删除</a>
                        </Space>
                    }
                },
            }];
    }

    getSellProfitPercent(entity) {
        return MoneyUtil.safeDivision(entity.profits?.totalMoney, Math.abs(entity.buySells?.totalSellMoney))
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
        return map
    }

    render() {
        let code2Name = {}
        InvestmentService.getProductTypes().forEach(type => {
            code2Name[type.code] = [type.name]
        })
        let productAssetDatas = []
        let productStockDatas = []
        let productInvestDatas = []
        let productIdToProduct = {}
        InvestmentService.queryProducts().sort((a, b) => Math.abs(a.type.code) < Math.abs(b.type.code) ? 1 : -1).forEach(entity => {
            if(entity.type.isAsset() || entity.type.isDebt()) {
                productAssetDatas.push({ key: entity.id, entity: entity })
            } else if (entity.type.isStock()) {
                productStockDatas.push({ key: entity.id, entity: entity })
            } else {
                productInvestDatas.push({ key: entity.id, entity: entity })
            }
            productIdToProduct[entity.id] = entity
        })

        let investMap = this.queryAllInvestData()

        let fundDatas = []
        let stockDatas = []
        let investFixVoteDatas = []
        var totalFixVote = {
            productTypeCode: 99999999,
            productTypeName: "汇总",
            productName: "汇总",
            productFixVote: 0,
            paperProfit: 0,
            sellProfit: 0,
            paperProfitPercent: 0,
            sellProfitPercent: 0,
        }
        for (let productId of Object.keys(investMap.fund)) {
            let detail = investMap.fund[productId]
            fundDatas.push({ key: productId, entity: detail })

            var product = productIdToProduct[productId]
            var paperProfitPercent = InvestmentVMService.getPaperProfitPercent(detail)
            var sellProfitPercent = this.getSellProfitPercent(detail)
            var fixVoteEntity = {
                product: product,
                productTypeCode: product.type.code,
                productTypeName: product.type.name,
                productName: product.name,
                productFixVote: product.fixVote,
                paperProfit: product.fixVote * paperProfitPercent,
                sellProfit: product.fixVote * sellProfitPercent,
                paperProfitPercent: paperProfitPercent,
                sellProfitPercent: sellProfitPercent,
            }
            totalFixVote.productFixVote += fixVoteEntity.productFixVote
            totalFixVote.paperProfit += fixVoteEntity.paperProfit
            totalFixVote.sellProfit += fixVoteEntity.sellProfit
            investFixVoteDatas.push({key: productId, entity: fixVoteEntity})
        }
        totalFixVote.paperProfitPercent = totalFixVote.paperProfit / totalFixVote.productFixVote
        totalFixVote.sellProfitPercent = totalFixVote.sellProfit / totalFixVote.productFixVote
        investFixVoteDatas.push({key: 9999999, entity: totalFixVote})

        for (let productId of Object.keys(investMap.stock)) {
            let detail = investMap.stock[productId]
            stockDatas.push({ key: productId, entity: detail })
        }
        let subInvestRowRender = (record, index) => {
            const data = [];
            record.entity.buySells.datas.forEach(ele => {
                if(ele.money !== 0) {
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
                }
            })
            return <Table columns={this.subInvestColumns} dataSource={data} pagination={false} />;
        }
        let subInvestRowExpandable = (record) => {
            return !DataUtil.isNull(record.entity.buySells?.datas)
        }
        return (
            <Content className='Content'>
                <Divider orientation="center">投资详情</Divider>
                <Table columns={this.investColumns} dataSource={stockDatas} expandable={{
                    expandedRowRender: subInvestRowRender,
                    rowExpandable: subInvestRowExpandable
                }} pagination={{pageSize: 20}} scroll={{ x: 1500 }} sortDirections={['descend']}/>
                <Table columns={this.investColumns} dataSource={fundDatas} expandable={{
                    expandedRowRender: subInvestRowRender,
                    rowExpandable: subInvestRowExpandable
                }} pagination={{pageSize: 20}} scroll={{ x: 1500 }} sortDirections={['descend']}/>
                <Divider orientation="center">投资产品</Divider>
                <Row style={{ padding: '10px 5px', backgroundColor: "#eee" }}>
                    <Col span={8}>
                        <InputWidget title={"新增投资产品"} cfgs={[{
                            name: "type",
                            code2Name: code2Name,
                            required: true
                        }, {
                            name: "name",
                            type: "input",
                            hint: "名称",
                            required: true
                        }, {
                            name: "desc",
                            type: "input",
                        }
                        ]} onSubmit={(s) => {
                            this.addProduct(s)
                            return true
                        }} />
                    </Col>
                    <Col span={16}>
                        <Table columns={this.productColumns} dataSource={productStockDatas} pagination={{pageSize: 10}}/>
                        <Table columns={this.productFixVoteColumns} dataSource={investFixVoteDatas} 
                            pagination={{pageSize: 15}} scroll={{ x: 1000 }} sortDirections={['descend']}/>
                        <Table columns={this.productColumns} dataSource={productAssetDatas} pagination={{pageSize: 10}}/>
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
                            type: "input",
                            defaultValue: this.state.currentProduct?.desc,
                        }]}
                        onOk={(state) => this.editProduct(this.state.currentProduct, state)}
                        onCancel={() => this.hideDialog()} />
            </Content>
        )
    }
}

export default InvestPage