import React from 'react'
import { Table, Tag, Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography, message, List, Menu } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { DataUtil, MoneyUtil, TimeUtil } from '../../utils/utils';
import InputWidget from './widget/input_widget';
import InvestmentService from '../../domain/service/investment_service';
import { InvestmentRecordType, InvestmentType } from '../../domain/entity/investment';
import { SummaryService } from '../../domain/service/summary_service';
import { IncomeExpenditureVMService } from '../../domain/service/view_model_service';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

class YearPage extends React.Component {

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
            title: '月份',
            key: 'month',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{TimeUtil.monthStr(entity.happenTime)}</Text>
            },
        }, {
            title: '金额',
            key: 'money',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{MoneyUtil.getStr(entity.money)}</Text>
            },
            sorter: (a, b) => MoneyUtil.compareAbs(a.entity.money, b.entity.money)
        },]
    }

    getByYearSideDatas(yearStartMonth = "01") {
        var months = SummaryService.queryMonths()
        this.months = months
        var items = []
        months.forEach(element => {
            let year = element.substring(0, 4)
            let startMonth = year + "-" + yearStartMonth
            if (!items.includes(startMonth)) {
                items.push(startMonth)
            }
        })
        return items.sort((a, b) => b > a ? 1 : -1)
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

    render() {
        let sideDatas = this.getByYearSideDatas()
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

        let incomeExpendData = []
        let yearData = IncomeExpenditureVMService.queryYearData(yearStartMonthDate)

        incomeExpendData.push({ key: "主动收入", entity: this.newEntity(null, "主动收入", 
            yearData['income']['total'], null, yearData['income']['sumByMonth']) })
        // incomeExpendData.push({key: "被动收入", entity: this.newEntity(null, "被动收入", totalPassiveMoney, 
        // null, passiveIncomeEntitys)})
        incomeExpendData.push({ key: "主动支出", entity: this.newEntity(null, "主动支出", 
            yearData['expend']['total'], null, yearData['expend']['sumByMonth']) })
        // incomeExpendData.push({key: "被动支出", entity: this.newEntity(null, "被动支出", totalDebtMoneys[1], 
        // null, passiveExpendEntitys)})
        // incomeExpendData.push({key: "新增现金", entity: this.newEntity(null, "新增现金", currentMonthAddMoney, 
        // null)})

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

        return <Layout>
            <Sider width={200} className="site-layout-background">
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
            <Content>
                <Table columns={this.incomeExpendColumns} dataSource={incomeExpendData}
                    expandable={{
                        expandedRowRender: subIncomeExpendRowRender,
                        rowExpandable: subIncomeExpendRowExpandable
                    }} pagination={{ pageSize: 20 }} sortDirections={['descend']} />
                <Divider orientation="center">指标</Divider>
                {/* {this.createShowTextRow("被动收入/主动支出（财富自有率）", DataUtil.getPercent(totalPassiveMoney / Math.abs(totalExpend)))} */}
                {/* {this.createShowTextRow("被动收入/主动收入", DataUtil.getPercent(totalPassiveMoney / totalIncome))} */}
                {/* {this.createShowMoneyRowIfBiggerThan("总资产环比误差", currentMonthTotalMoney - lastMonthTotalMoney - currentMonthAddMoney, [500, 1000])} */}
            </Content>
        </Layout>
    }
}

export default YearPage