import { Breadcrumb, Button, Col, Divider, Layout, Menu, Row, Space, Table, Tag, Typography, message } from "antd";
import React from 'react';
import { IncomeExpenditureType } from '../../domain/entity/income_expenditure';
import { UserConfigType } from '../../domain/entity/user_entity';
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service';
import InvestmentService from '../../domain/service/investment_service';
import { SummaryService } from '../../domain/service/summary_service';
import { IncomeExpenditureVMService, InvestmentVMService } from '../../domain/service/view_model_service';
import { DataUtil, MoneyUtil, TimeUtil } from '../../utils/utils';
import { UIUtils } from '../ui_utils';
import { CusDialog } from './widget/cus_dialog';
import InputWidget from './widget/input_widget';

const { Content, Sider } = Layout;
const { Text } = Typography;

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
            sorter: (a, b) => MoneyUtil.compareAbs(a.entity.money, b.entity.money)
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
                            console.log(record.entity)
                            this.showDialog("modifyIncomeOrExpend", record.entity)
                        }}>编辑</a>
                        <a onClick={() => {
                            this.deleteIncomeExpendDetail(record.entity.id)
                        }}>删除</a>
                    </Space>
                }
            }   
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
        },  {
            title: '最新时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                let type = ""
                if (!TimeUtil.inMonth(entity.currentPrice?.happenTime, this.monthDate)) {
                    type = "secondary"
                }
                return <Text type={type}>{TimeUtil.dayStr(entity.currentPrice?.happenTime)}</Text>
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
            title: '最新时间',
            key: 'happenTime',
            dataIndex: 'entity',
            render: (entity) => {
                let type = ""
                if (!TimeUtil.inMonth(entity.currentPrice?.happenTime, this.monthDate)) {
                    type = "secondary"
                }
                return <Text type={type}>{TimeUtil.dayStr(entity.currentPrice?.happenTime)}</Text>
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
            title: '当期账面利润',
            key: 'qoqPaperProfit',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(this.getQoqPaperProfit(entity))}</Text>
            },
            sorter: (a, b) => {
                return MoneyUtil.compare(this.getQoqPaperProfit(a.entity), this.getQoqPaperProfit(b.entity))
            }
        }, {
            title: '当期账面利润率',
            key: 'qoqPaperProfitPercent',
            dataIndex: 'entity',
            render: (entity) => {
                let paperProfitPercent = this.getQoqPaperProfitPercent(entity)
                return <Text type={MoneyUtil.getPercentColorType(paperProfitPercent)}>
                    {MoneyUtil.getPercentStr(paperProfitPercent)}</Text>
            },
            sorter: (a, b) => {
                let apaperProfitPercent = this.getQoqPaperProfitPercent(a.entity)
                let bpaperProfitPercent = this.getQoqPaperProfitPercent(b.entity)
                return DataUtil.compare(apaperProfitPercent, bpaperProfitPercent)
            }
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

    getQoqPaperProfit(entity) {
        let lastMonthPaperProfit = InvestmentVMService.getPaperProfit(this._getLastMonthProductDetail(entity.info.productId))
        // 当期账面利润
        let paperProfit = InvestmentVMService.getPaperProfit(entity)
        // 当期卖出所得利润
        let sellProfit = DataUtil.safeGetNumber(entity.profits?.filterTotalMoney)
        return sellProfit + paperProfit - lastMonthPaperProfit
    }

    //用这个月新增的账面利润 / 总投资额 得到这个月的收益率
    getQoqPaperProfitPercent(entity) {
        return MoneyUtil.safeDivision(this.getQoqPaperProfit(entity), entity?.buySells?.totalMoney)
    }

    _getLastMonthProductDetail(productId) {
        for(let item of [this.lastMonthAllInvestData['fund'], this.lastMonthAllInvestData['stock'], 
            this.lastMonthAllInvestData['asset'], this.lastMonthAllInvestData['debt']]) {
            if(productId in item['products']) {
                return item['products'][productId]
            }
        }
        return null
    }

    insertData(inputValues) {
        try {
            let money = InputWidget.getMoney(inputValues, "money")
            let date = inputValues.date
            let typeCode = this._praseTypeCode(inputValues.treeType)
            IncomeExpenditureService.upsert(money,
                IncomeExpenditureType.getByCode(typeCode), date, inputValues.desc ?? "")
            this.refreshPage()
            return true
        } catch (e) {
            console.warn(e)
            alert(e)
            return false
        }
    }

    modifyIncomeOrExpend(inputValues) {
        let detail = inputValues.extra
        let typeCode = this._praseTypeCode(inputValues.treeType)
        let desc = inputValues.desc ?? ""
        IncomeExpenditureService.upsert(detail.money,
            IncomeExpenditureType.getByCode(typeCode), detail.happenTime, desc, detail.id)
        this.hideDialog()
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

    getByMonthSideDatas() {
        var months = SummaryService.queryMonths()
        this.months = months
        var map = {}
        months.forEach(element => {
            let year = element.substring(0, 4)
            if (DataUtil.isNull(map[year])) {
                map[year] = []
            }
            map[year].push(element)
        })
        return map
    }

    showDialog(key, extra) {
        this.setState({
            dialogKey: key,
            dialogExtra: extra
        })
    }

    addNewMoth(d) {
        if (isNaN(d)) {
            message.error("请输入有效月份，如 2022-5")
        } else {
            if (this.months.includes(TimeUtil.monthStr(d))) {
                message.error("已有当前月份")
                this.hideDialog()
            } else {
                SummaryService.addMonth(d)
                this.state.sideKey = TimeUtil.monthStr(d)
                this.hideDialog()
            }
        }
    }

    hideDialog() {
        this.setState({
            dialogKey: "",
        })
    }

    render() {
        let siderItems = []
        let openKeys = []
        let sideDatas = this.getByMonthSideDatas()
        let lastMonth = null
        siderItems = Object.keys(sideDatas).sort((a, b) => b > a ? 1 : -1).map((year, i) => {
            openKeys.push(year)
            return {
                key: year,
                label: year,
                children: sideDatas[year].sort((a, b) => b > a ? 1 : -1).map((month, j) => {
                    if (lastMonth == null) { lastMonth = month }
                    return {
                        key: month,
                        label: month,
                    };
                }),
            };
        })
        if (DataUtil.isNull(this.state.sideKey)) {
            this.state.sideKey = lastMonth
        }
        this.monthDate = new Date(this.state.sideKey)
        let currentMonthDate = this.monthDate
        if (DataUtil.notNumber(currentMonthDate)) {
            return <Content />
        }
        console.log("month page render ", currentMonthDate)
        //处理一些类型数据
        let incomeTypes = IncomeExpenditureVMService.getTypeTrees(UserConfigType.IncomeType, false)
        let expendTypes = IncomeExpenditureVMService.getTypeTrees(UserConfigType.ExpenditureType, false)
        let incomeTreeDatas = this._getTypeTreeSelectDatas(incomeTypes)
        let expendTreeDatas = this._getTypeTreeSelectDatas(expendTypes)

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
        let monthData = IncomeExpenditureVMService.queryMonthData(currentMonthDate)
        let totalIncome = monthData['income']['total'], totalExpend = monthData['expend']['total']

        //处理资产、负债、投资的一些总数据
        let allInvestData = InvestmentVMService.queryMonthData(currentMonthDate)
        let passiveIncomeSummary = this._getPassiveIncomeSummary(allInvestData)
        let passiveExpendSummary = this._getPassiveExpendSummary(allInvestData)

        console.log("===== monthData     =====", monthData)
        console.log("===== allInvestData =====", allInvestData)

        this.lastMonthAllInvestData = InvestmentVMService.queryMonthData(TimeUtil.lastMonthEnd(currentMonthDate))

        let currentMonthTotalMoney = this._getTotalMoney(allInvestData)
        let lastMonthTotalMoney = this._getTotalMoney(this.lastMonthAllInvestData)
        let currentMonthAddMoney = totalIncome + totalExpend + passiveIncomeSummary['total'] + passiveExpendSummary['total']

        incomeExpendData.push({key: "主动收入", entity: this.newEntity(null, "主动收入", totalIncome, null, monthData['income']['details'])})    
        incomeExpendData.push({key: "被动收入", entity: this.newEntity(null, "被动收入",  passiveIncomeSummary['total'], 
            null, passiveIncomeSummary['details'])})
        incomeExpendData.push({key: "主动支出", entity: this.newEntity(null, "主动支出", totalExpend, null, monthData['expend']['details'])})
        incomeExpendData.push({key: "被动支出", entity: this.newEntity(null, "被动支出", passiveExpendSummary['total'], 
            null, passiveExpendSummary['details'])})
        incomeExpendData.push({key: "新增现金", entity: this.newEntity(null, "新增现金", currentMonthAddMoney, 
            null)})
        incomeExpendData.push({key: "上期总资产", entity: this.newEntity(null, "上期总资产", lastMonthTotalMoney, 
            null)})

        let totalMoneyEntitys = []
        totalMoneyEntitys.push(this.newEntity(null, "资产总额", allInvestData['asset']['totalMoneys'][0], null))
        totalMoneyEntitys.push(this.newEntity(null, "负债总额", allInvestData['debt']['totalMoneys'][0], null))
        totalMoneyEntitys.push(this.newEntity(null, "投资总额", allInvestData['fund']['totalMoneys'][1], `账面价值：${MoneyUtil.getStr(allInvestData['fund']['totalMoneys'][0])}`))
        totalMoneyEntitys.push(this.newEntity(null, "股票总额", allInvestData['stock']['totalMoneys'][1], `账面价值：${MoneyUtil.getStr(allInvestData['stock']['totalMoneys'][0])}`))
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

        let contentView = <Content className='Content'>
                <Row>
                    <Divider orientation="center">使用步骤</Divider>
                    <Space direction='vertical' style={{ padding: '0px 0px 15px 0px'}}>
                        <Text>1. 还清各资产账户的借款（信用卡），记录资产现额</Text>
                        <Text>2. 记录 支付宝/微信 当月的 收入/支出</Text>
                        <Text>3. 记录 基金/股票 的 当月 买入/卖出 操作和当前现额等信息</Text>
                        <Text>4. 检查 总资产环比误差 信息（大于0表示：收入少了/支出多了/当前总资产多了），尽量保持500以下</Text>
                    </Space>
                </Row>
                <Row justify="space-between" style={{ padding: '0px 0px' }}>
                    <Divider orientation="center">新增收入/支出</Divider>
                    <Col span={8}>
                        <InputWidget title="收入" cfgs={[{
                            name: "treeType",
                            treeData: incomeTreeDatas,
                            required: true
                        }, {
                            name: "money",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: currentMonthDate
                        }, {
                            name: "desc",
                            type: "input"
                        }
                        ]} onSubmit={(s) => {
                            return this.insertData(s)
                        }} />
                        <InputWidget title="支出" cfgs={[{
                            name: "treeType",
                            treeData: expendTreeDatas,
                            required: true
                        }, {
                            name: "money",
                            required: true,
                            moneyPon: false
                        }, {
                            name: "date",
                            required: true,
                            inMonth: currentMonthDate
                        }, {
                            name: "desc",
                            type: "input"
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
                        {UIUtils.createShowTextRow("被动收入/支出（财富自由率）", DataUtil.getPercent(passiveIncomeSummary['total'] / Math.abs(totalExpend + passiveExpendSummary['total'])))}
                        {UIUtils.createShowTextRow("被动收入/主动收入", DataUtil.getPercent(passiveIncomeSummary['total'] / totalIncome))}
                        {this.createShowMoneyRowIfBiggerThan("总资产环比误差", currentMonthTotalMoney - lastMonthTotalMoney - currentMonthAddMoney, [500, 1000])}
                    </Col>
                </Row>
                <Row justify="space-between" style={{ padding: '0px 0px'}}>
                    <Divider orientation="center">资产/负债</Divider>
                    <Col span={8}>
                        <InputWidget title="资产" cfgs={[{
                            name: "type",
                            code2Name: assetProductCode2Name,
                            required: true
                        }, {
                            name: "currentPrice",
                            type: "money",
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
                            inMonth: currentMonthDate
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
                            type: "money",
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
                            inMonth: currentMonthDate
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
                            }} pagination={{ pageSize: 20 }} scroll={{ x: 800 }} sortDirections={['descend']} />
                    </Col>
                </Row>
                <Row style={{ padding: '0px 0px 10px 0px'}}>
                    <Divider orientation="center">投资</Divider>
                    <Col span={10}>
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
                            type: "money",
                            hint: "账面价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "count",
                            type: "money",
                            hint: "份数",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: currentMonthDate
                        }
                        ]} onSubmit={(s) => {
                            return this.addBuyInvest(s)
                        }} />
                    </Col>
                    <Col span={14}>
                    <InputWidget title="卖出投资" cfgs={[{
                            name: "type",
                            code2Name: investProductCode2Name,
                            required: true
                        }, {
                            name: "count",
                            type: "money",
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
                            type: "money",
                            hint: "卖出利润-可负（二选一）",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "currentPrice",
                            type: "money",
                            hint: "账面价值",
                            required: true,
                            moneyPon: true
                        }, {
                            name: "currentProfit",
                            type: "money",
                            hint: "账面利润-可负（二选一）",
                            required: false,
                            moneyPon: true
                        }, {
                            name: "date",
                            required: true,
                            inMonth: currentMonthDate
                        }
                        ]} onSubmit={(s) => {
                            return this.addSellInvest(s)
                        }} />
                    </Col>
                </Row>
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
                            openKeys={openKeys}
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
                                <Button onClick={() => this.showDialog("addNewMonth", null)}>新加月份</Button>
                            </Col>
                        </Row>
                        {contentView}
                    </Layout>
                    <CusDialog title="新加月份" visible={this.state.dialogKey === "addNewMonth"}
                        cfgs={[{
                            name: "date",
                            hint: "月份",
                            picker: "month",
                            defaultValue: new Date()
                        }]}
                        onOk={(state) => this.addNewMoth(state.date)}
                        onCancel={() => this.hideDialog()} />
                    <CusDialog title="修改收入/支出" visible={this.state.dialogKey === "modifyIncomeOrExpend"}
                        key={this.state.dialogExtra?.id}
                        cfgs={[{
                            name: "treeType",
                            required: true,
                            treeData: this.state.dialogExtra?.type.isIncome() ? incomeTreeDatas : expendTreeDatas,
                            defaultValue: this._getTypeTreeCode(this.state.dialogExtra?.type)
                        }, {
                            name: "desc",
                            type: "input",
                            required: false,
                            defaultValue: this.state.dialogExtra?.desc
                        }]}
                        extra={this.state.dialogExtra}
                        onOk={(state) => this.modifyIncomeOrExpend(state)}
                        onCancel={() => this.hideDialog()} />
                </Layout>
    }

    /**
     * @param {IncomeExpenditureType} type 
     */
    _getTypeTreeCode(type) {
        if(DataUtil.isNull(type)) {
            return null
        }
        return type.code + "___" + type.name
    }

    _praseTypeCode(treeCode) {
        return parseInt(treeCode.split('___')[0])
    }

    _getTypeTreeSelectDatas(typesTree) {
        let result = []
        for (const type of typesTree) {
            let group = {
                "title": type.entity.name,
                // 为了能够搜索，所以在 value 里面拼上 name
                "value": this._getTypeTreeCode(type.entity),
                "children": []
            }
            for (const child of type.childs) {
                group.children.push({
                    "title": child.entity.name,
                    "value": this._getTypeTreeCode(child.entity)
                })
            }
            result.push(group)
        }
        return result
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
        return UIUtils.createShowTextRow(title, MoneyUtil.getStr(money), textType)
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
        return UIUtils.createShowTextRow(title, MoneyUtil.getStr(money), textType)
    }

    createShowMoneyRow(title, money) {
        return UIUtils.createShowTextRow(title, MoneyUtil.getStr(money), "")
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

    _getTotalMoney(allInvestData) {
        let totalAssetMoneys = allInvestData['asset']['totalMoneys']
        let totalFundMoneys = allInvestData['fund']['totalMoneys']
        let totalStockMoneys = allInvestData['stock']['totalMoneys']
        let totalDebtMoneys = allInvestData['debt']['totalMoneys']
        return totalAssetMoneys[0] + totalDebtMoneys[0] + totalFundMoneys[1] + totalStockMoneys[1]
    }

    _mapToList(productMap, filter=false) {
        let arr = []
        for (let productId of Object.keys(productMap)) {
            let detail = productMap[productId]
            if(filter && MoneyUtil.noValue(detail.currentPrice?.money) && MoneyUtil.noValue(detail.profits?.filterTotalMoney) && 
                MoneyUtil.noValue(detail.buySells?.filterMoney) && MoneyUtil.noValue(detail.buySells?.totalMoney)) {
                //四个值全没有，不展示
            } else {
                arr.push({ key: productId, entity: detail })
            }
        }
        return arr
    }

    _getProductsProfitEntitys(products) {
        if(DataUtil.isEmpty(products)) {
            return []
        }
        let profitEntitys = []
        Object.keys(products).map(productId => {
            let product = products[productId]
            let filterDatas = product.profits?.filterDatas
            if(!DataUtil.isNull(filterDatas)) {
                for(let data of filterDatas) {
                    profitEntitys.push(this.newEntity(data.happenTime, data.productName, data.money, null))
                }
            }
        })
        return profitEntitys
    }

    _getPassiveIncomeSummary(yearInvestData) {
        let assetData = yearInvestData['asset']
        let fundData = yearInvestData['fund']
        let stockData = yearInvestData['stock']
        let details = []
        details.push(...this._getProductsProfitEntitys(assetData['products']),
                 ...this._getProductsProfitEntitys(fundData['products']),
                 ...this._getProductsProfitEntitys(stockData['products']))
        return {
            'total': assetData['totalProfitMoneys'][1] + fundData['totalProfitMoneys'][1] 
                + stockData['totalProfitMoneys'][1],
            'details': details
        }
    }

    _getPassiveExpendSummary(yearInvestData) {
        let debtData = yearInvestData['debt']
        let details = []
        details.push(...this._getProductsProfitEntitys(debtData['products']))
        return {
            'total': debtData['totalProfitMoneys'][1],
            'details': details
        }
    }
}

export default MonthPage