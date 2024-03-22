import { Button, Card, Col, DatePicker, Input, InputNumber, Row, Select, Switch, TreeSelect, Typography } from "antd";
import moment from 'moment';
import React from 'react';
import { DataUtil, TimeUtil } from '../../../utils/utils';

const { Text } = Typography;

class InputWidget extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            extra: this.props.extra
        }
    }

    static getMoney(s, key) {
        let ponKey = key + "Pon"
        let pon = s[ponKey] ? 1 : -1
        if (DataUtil.notNumber(s[key])) {
            return NaN
        } else {
            return s[key] * pon * 100
        }
    }

    getOptions(code2Name) {
        let options = []
        if (DataUtil.isNull(code2Name)) {
            return options
        }
        let codes = Object.keys(code2Name)
        if(codes.length === 0) {
            return options
        }
        if(code2Name[codes[0]].length === 1) {
            //无 parent 相关信息，普通 options
            for (let code of codes) {
                options.push({
                    "value": code,
                    "label": code2Name[code][0]
                })
            }
        } else {
            //有 parent 相关信息，两层 options
            let groupNames = []
            for (let code of codes) {
                let groupName = code2Name[code][2]
                if(!groupNames.includes(groupName)) {
                    options.push({
                        "label": groupName,
                        "options": []
                    })
                    groupNames.push(groupName)
                }
            }
            for (let code of codes) {
                let groupName = code2Name[code][2]
                let groupIndex = groupNames.indexOf(groupName)
                options[groupIndex]["options"].push({
                    "value": code,
                    "label": code2Name[code][0]
                })
            }
        }
        return options
    }

    itemToWidget(item) {
        let stateCode = item.name
        let type = item.type ?? item.name
        let nameAppend = (item.required ?? false) ? "(必填)" : ""
        let hint = ""
        let placeholder = ""
        let defaultValue = item.defaultValue
        if (DataUtil.isNull(this.state[stateCode]) && !DataUtil.isNull(defaultValue)) {
            this.state[stateCode] = defaultValue
        }
        let widgetWidth = '220px'
        switch (type) {
            case "treeType":
                hint = item.hint ?? "类型"
                placeholder = item.placeholder ?? "请选择(支持搜索)"
                return <Row align='middle'>
                    <Col span={8}>
                        <Text >{hint}{nameAppend}:</Text>
                    </Col>
                    <Col flex="auto" align="center">
                        <TreeSelect
                            style={{
                                width: widgetWidth,
                            }}
                            dropdownStyle={{
                                maxHeight: 600,
                                overflow: 'auto',
                            }}
                            showSearch={true}
                            treeData={item.treeData}
                            placeholder={placeholder}
                            treeDefaultExpandAll={false}
                            value={this.state[stateCode]}
                            onChange={(value) => {
                                this.setState({
                                    [stateCode]: value,
                                })
                            }}
                        />
                    </Col>
                </Row>
            case "type":
                hint = item.hint ?? "类型"
                let typeName = stateCode + "Name"
                let parentCode = stateCode + "ParentCode"
                let parentName = stateCode + "ParentName"
                let opts = this.getOptions(item.code2Name)
                return <Row align='middle'>
                    <Col span={8}>
                        <Text >{hint}{nameAppend}:</Text>
                    </Col>
                    <Col flex="auto" align="center">
                        <Select style={{ width: widgetWidth }}
                            value={this.state[stateCode]}
                            onChange={(value) => {
                                this.setState({
                                    [stateCode]: value,
                                    [typeName]: item.code2Name[value][0],
                                    [parentCode]: item.code2Name[value][1],
                                    [parentName]: item.code2Name[value][2]
                                })
                            }}
                            options={opts} />
                    </Col>
                </Row>
            case "money":
                let pon = item.moneyPon
                hint = item.hint ?? "金额"
                let ponKey = stateCode + "Pon"
                this.state[ponKey] = pon
                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8}>
                        <Text >{hint}{nameAppend}:</Text>
                    </Col>
                    <Col flex="auto" align="center">
                        <InputNumber style={{ width: widgetWidth }} addonBefore={pon ? "+" : "-"}
                            value={this.state[stateCode]}
                            onChange={(value) => {
                                this.setState({
                                    [stateCode]: value
                                })
                            }} />
                    </Col>
                </Row>
            case "date":
                if (!DataUtil.isNull(item.inMonth)) {
                    if (DataUtil.isNull(this.state[stateCode]) || !TimeUtil.inMonth(this.state[stateCode], new Date(item.inMonth))) {
                        this.state[stateCode] = new Date(item.inMonth)
                    }
                }
                hint = item.hint ?? "发生日期"
                let picker = item.picker ?? ""
                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8}>
                        <Text >{hint}{nameAppend}:</Text>
                    </Col>
                    <Col flex="auto" align="center">
                        <DatePicker style={{ width: widgetWidth }}
                            picker={picker}
                            value={moment(this.state[stateCode])}
                            onChange={(m, dateString) => {
                                this.setState({
                                    [stateCode]: m.toDate(),
                                })
                            }} />
                    </Col>
                </Row>
            case "input":
                hint = item.hint ?? "描述"
                placeholder = item.placeholder ?? "请输入文本"
                return <Row align='middle' style={{ margin: "10px 0" }}>
                    <Col span={8}>
                        <Text >{hint}{nameAppend}:</Text>
                    </Col>
                    <Col flex="auto" align="center">
                        <Input placeholder={placeholder} style={{ width: widgetWidth }}
                            value={this.state[stateCode]}
                            onChange={(event) => {
                                this.setState({ [stateCode]: event.target.value })
                            }} />
                    </Col>
                </Row>
            case "switch":
                hint = item.hint ?? "开关"
                return <Row align='middle' style={{ margin: "10px 0" }}>
                <Col span={8}>
                    <Text >{hint}{nameAppend}:</Text>
                </Col>
                <Col flex="auto" align="center">
                    <Switch 
                        defaultChecked={this.state[stateCode]}
                        onChange={(checked) => {
                            this.setState({ [stateCode]: checked })
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
            if (item.required === true && DataUtil.isNull(value)) {
                throw new Error(item.name + " 必须输入")
            }
            if (item.isNum === true && isNaN(value)) {
                throw new Error(item.name + " 必须为数字")
            }
            if (!DataUtil.isNull(item.inMonth)) {
                if (!TimeUtil.inMonth(value, new Date(item.inMonth))) {
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
                let resetState = {}
                for(let key of Object.keys(this.state)) {
                    if(key === 'extra') {
                        resetState[key] = this.state[key]
                    } else {
                        resetState[key] = null
                    }
                }
                this.setState(resetState)
            }
        };
        let rows = []
        for (let item of this.props.cfgs) {
            rows.push(this.itemToWidget(item))
        }

        return (<Card title={this.props.title ?? "新增"} style={{ margin: "0px 5px" }} bodyStyle={{ padding: "25px" }}>
            {rows}
            <Row justify='center' style={{ margin: "15px 0 0 0" }}>
                <Col>
                    <Button type="primary" onClick={handleSubmit}> 提交 </Button>
                </Col>
            </Row>
        </Card>)
    }
}

export default InputWidget