import React from 'react'
import { Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography } from "antd"
import { DataUtil, TimeUtil } from '../../../utils/utils';
import moment from 'moment';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

const ItemNames = ["type", "name", "desc", "money", "currentPrice", "currentProfit", "date"]

class InputWidget extends React.Component {

    constructor(props) {
        super(props)
        this.state = this.getInitialState()
    }

    static getMoney(s, key) {
        let ponKey = key + "Pon"
        let pon = s[ponKey] ? 1 : -1
        let money = s[key] * pon * 100
        return money
    }

    getInitialState() {
        let result = {}
        ItemNames.forEach(element => {
            result[element] = null
        })
        return result
    }

    getOpts(code2Name) {
        let opts = []
        for (let code of Object.keys(code2Name)) {
            opts.push(<Option value={code}>{code2Name[code]}</Option>)
        }
        return opts
    }

    itemToWidget(item) {
        let stateCode = item.name
        let nameAppend = (item.required ?? false) ? "(必填)" : ""
        switch (item.name) {
            case "type":
                let stateCodeName = stateCode + "Name"
                let opts = this.getOpts(item.code2Name)
                return <Row align='middle'>
                    <Col span={8} offset={2}>
                        <Text >类型{nameAppend}:</Text>
                    </Col>
                    <Col span={12} offset={2}>
                        <Select style={{ width: "150px" }}
                            value={this.state[stateCode]}
                            onChange={(value) => {
                                this.setState({
                                    [stateCode]: value,
                                    [stateCodeName]: item.code2Name[value]
                                })
                            }}>
                            {opts}
                        </Select>
                    </Col>
                </Row>
            case "name":
                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8} offset={2}>
                        <Text >名称{nameAppend}:</Text>
                    </Col>
                    <Col span={8} offset={2}>
                        <Input placeholder='名称' style={{ width: "150px" }}
                            value={this.state[stateCode]}
                            onChange={(event) => {
                                this.setState({
                                    [stateCode]: event.target.value
                                })
                            }} />
                    </Col>
                </Row>
            case "money":
            case "currentPrice":
            case "currentProfit":
                let pon = item.moneyPon
                let hint = item.hint ?? "金额"
                let ponKey = stateCode + "Pon"
                this.state[ponKey] = item.moneyPon
                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8} offset={2}>
                        <Text >{hint}{nameAppend}:</Text>
                    </Col>
                    <Col span={12} offset={2}>
                        <InputNumber style={{ width: "150px" }} addonBefore={pon ? "+" : "-"}
                            value={this.state[stateCode]}
                            onChange={(value) => {
                                this.setState({
                                    [stateCode]: value
                                })
                            }} />
                    </Col>
                </Row>
            case "date":
                if(!DataUtil.isNull(item.inMonth)) {
                    if(DataUtil.isNull(this.state[stateCode]) || !TimeUtil.inMonth(this.state[stateCode], new Date(item.inMonth))) {
                        this.state[stateCode] = new Date(item.inMonth)
                    }
                }

                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8} offset={2}>
                        <Text >发生日期{nameAppend}:</Text>
                    </Col>
                    <Col span={12} offset={2}>
                        <DatePicker style={{ width: "150px" }}
                            value={moment(this.state[stateCode])}
                            onChange={(m, dateString) => {
                                this.setState({ 
                                    [stateCode]: m.toDate(),
                                 })
                            }} />
                    </Col>
                </Row>
            case "desc":
                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8} offset={2}>
                        <Text >描述{nameAppend}:</Text>
                    </Col>
                    <Col span={8} offset={2}>
                        <Input placeholder='描述' style={{ width: "150px" }}
                            value={this.state[stateCode]}
                            onChange={(event) => {
                                this.setState({ [stateCode]: event.target.value })
                            }} />
                    </Col>
                </Row>
            default:
                return <Row>
                    <Text>未支持输入配置 {item.name}</Text>
                </Row>
        }
    }

    checkData(state, item) {
        try {
            let value = state[item.name]
            if(item.required === true && DataUtil.isNull(value)) {
                throw new Error(item.name + " 必须输入")
            }
            if(item.isNum === true && isNaN(value)) {
                throw new Error(item.name + " 必须为数字")
            }
            if(!DataUtil.isNull(item.inMonth)) {
                if(!TimeUtil.inMonth(value, new Date(item.inMonth))) {
                    throw new Error("发生日期仅可选在当前月份：" + item.inMonth)
                }
            }
            
            return true
        } catch (e) {
            console.warn(e)
            alert(e)
            return false
        }
    }

    render() {
        const handleSubmit = () => {
            for (let item of this.props.cfgs) {
                if (!this.checkData(this.state, item)) {
                    return
                }
            }
            if (this.props.onSubmit(this.state)) {
                this.setState(this.getInitialState())
            }
        };
        let rows = []
        for (let item of this.props.cfgs) {
            rows.push(this.itemToWidget(item))
        }

        return (<Card title={this.props.title ?? "新增"} style={{ margin: "10px 20px" }}>
            {rows}
            <Row justify='center' style={{ margin: "15px 0" }}>
                <Col>
                    <Button type="primary" onClick={handleSubmit}> 提交 </Button>
                </Col>
            </Row>
        </Card>)
    }
}

export default InputWidget