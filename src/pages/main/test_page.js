import React from 'react'
import { Upload, Button, DatePicker, version, Row, Tag, Table } from "antd"
import { Typography, Divider } from 'antd'
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { App } from '../..'
import { IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { Content } from 'antd/lib/layout/layout'
import { IncomeExpenditureVMService, InvestmentVMService } from '../../domain/service/view_model_service'
import { MoneyUtil } from '../../utils/utils'

const { Title, Paragraph, Text, Link } = Typography

class TestPage extends React.Component {

	constructor(props) {
		super(props)
		this.state = {}
		this.testResults = []
		this.group = 'default'
		this.resultColumns = [{
            title: 'id',
            key: 'id',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.id}</Text>
            }
        }, {
            title: 'success',
            key: 'success',
            dataIndex: 'entity',
            render: (entity) => {
				let color = 'green'
                if (!entity.success) {
                    color = 'red'
                }
                return <Tag color={color}>
                    {entity.success ? "Success":"Fail"}
                </Tag>
            }
        }, {
            title: 'group',
            key: 'group',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.group}</Text>
            }
        }, {
            title: 'msg',
            key: 'msg',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.msg}</Text>
            },
        }, {
            title: 'actual',
            key: 'actual',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.actual}</Text>
            },
        }, {
            title: 'expect',
            key: 'expect',
            dataIndex: 'entity',
            render: (entity) => {
                return <Text>{entity.expect}</Text>
            },
        },]
	}

	refreshPage() {
		this.setState({
			updateTime: new Date().getTime()
		})
	}

	_expect(actual, expect, msg='') {
		let result = {}
		if(expect === actual) {
			result = {
				'group': this.group,
				'success': true,
				'msg': msg,
				'expect': expect,
				'actual': actual
			}
		} else {
			result = {
				'group': this.group,
				'success': false,
				'msg': msg,
				'expect': expect,
				'actual': actual
			}
		}
		result['id'] = this.testResults.length + 1
		this.testResults.push(result)
	}

	_testIncomeExpend() {
		this.group = '_testIncomeExpend'
		let data11 = IncomeExpenditureVMService.queryMonthData(new Date('2022-11'))
		this._expect(data11['income']['total'], 3007018)
		this._expect(data11['income']['details'].length, 2)
		this._expect(data11['expend']['total'], -826853)
		this._expect(data11['expend']['details'].length, 17)

		let data10 = IncomeExpenditureVMService.queryMonthData(new Date('2022-10'))
		this._expect(data10['income']['total'], 3260514)
		this._expect(data10['income']['details'].length, 3)
		this._expect(data10['expend']['total'], -1809859)
		this._expect(data10['expend']['details'].length, 20)

		let yearData01 = IncomeExpenditureVMService.queryYearData(new Date('2021-04'))
		this._expect(yearData01['income']['total'], 14980332)
		this._expect(yearData01['income']['details'].length, 9)
		this._expect(yearData01['income']['sumByMonth'].length, 4)
		this._expect(yearData01['expend']['total'], -164667437)
		this._expect(yearData01['expend']['details'].length, 51)
		this._expect(yearData01['expend']['sumByMonth'].length, 4)
	}

	_testInvestData() {
		/**
		 * 	2022-10
		 *  totalAssetMoneys (3) [17330631, 7500, 0]
			totalDebtMoneys (3) [-894467, -850000, 0]
			totalInvestMoneys (3) [50981840, 0, 57218750]
			totalStockMoneys (3) [21153610, 28250, 24719638]
			lastMonthTotalMoney 97684540
			currentMonthTotalMoney 98374552
			currentMonthAddMoney 636405
			totalPassiveMoney 35750
			
			2022-11
			totalAssetMoneys (3) [16241803, 2650, 0]
			totalDebtMoneys (3) [-6000, -1500000, 0]
 			totalInvestMoneys (3) [54335438, 0, 58088750]
			totalStockMoneys (3) [21522750, -20, 24677398]
			lastMonthTotalMoney 98374552
			currentMonthTotalMoney 99001951
			currentMonthAddMoney 682795
			totalPassiveMoney 2630
		 */
		this.group = '_testInvestData'

		let monthData1 = InvestmentVMService.queryMonthData(new Date('2022-10'))
		this._expect(monthData1['asset']['totalMoneys'][0], 17330631)
		this._expect(monthData1['asset']['totalProfitMoneys'][1], 7500)
		this._expect(monthData1['asset']['totalMoneys'][1], 0)

		this._expect(monthData1['debt']['totalMoneys'][0], -894467)
		this._expect(monthData1['debt']['totalProfitMoneys'][1], -850000)
		this._expect(monthData1['debt']['totalMoneys'][1], 0)

		this._expect(monthData1['fund']['totalMoneys'][0], 50981840)
		this._expect(monthData1['fund']['totalProfitMoneys'][1], 0)
		this._expect(monthData1['fund']['totalMoneys'][1], 57218750)

		this._expect(monthData1['stock']['totalMoneys'][0], 21153610)
		this._expect(monthData1['stock']['totalProfitMoneys'][1], 28250)
		this._expect(monthData1['stock']['totalMoneys'][1], 24719638)

		let monthData2 = InvestmentVMService.queryMonthData(new Date('2022-11'))
		this._expect(monthData2['asset']['totalMoneys'][0], 16241803)
		this._expect(monthData2['asset']['totalProfitMoneys'][1], 2650)
		this._expect(monthData2['asset']['totalMoneys'][1], 0)

		this._expect(monthData2['debt']['totalMoneys'][0], -6000)
		this._expect(monthData2['debt']['totalProfitMoneys'][1], -1500000)
		this._expect(monthData2['debt']['totalMoneys'][1], 0)

		this._expect(monthData2['fund']['totalMoneys'][0], 54335438)
		this._expect(monthData2['fund']['totalProfitMoneys'][1], 0)
		this._expect(monthData2['fund']['totalMoneys'][1], 58088750)

		this._expect(monthData2['stock']['totalMoneys'][0], 21522750)
		this._expect(monthData2['stock']['totalProfitMoneys'][1], -20)
		this._expect(monthData2['stock']['totalMoneys'][1], 24677398)
	}

	testAll() {
		this.testResults = []
		this._testIncomeExpend()
		this._testInvestData()
		this.refreshPage()
	}

	render() {
		return (
			<Content className='Content'>
				<Divider orientation="center">版本：{App.getVersion()}</Divider>
				<Row style={{ padding: '10px 50px 50px', backgroundColor: "#eee", margin: "10px 0" }}>
					<Divider orientation="center">测试按钮</Divider>
					<Button onClick={() => this.testAll()}>所有测试用例</Button>
				</Row>
				<Table columns={this.resultColumns} dataSource={this.testResults
					.filter((msg) => !msg['success']).map((msg, i) => {
						return { key: i, entity: msg }
					})} />
			</Content>
		)
	}
}

export default TestPage