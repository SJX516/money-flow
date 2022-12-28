import React from 'react'
import { Upload, Button, DatePicker, version, Row, Tag, Table } from "antd"
import { Typography, Divider } from 'antd'
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { App } from '../..'
import { IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { Content } from 'antd/lib/layout/layout'
import { IncomeExpenditureVMService } from '../../domain/service/view_model_service'
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

	testAll() {
		this.testResults = []
		this._testIncomeExpend()
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