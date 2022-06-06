import React from 'react'
import { Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { DataUtil, TimeUtil } from '../../utils/utils';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

class TodoPage extends React.Component {

    constructor(props) {
        super(props)
    }

    //TODO 导入导出自动化 or 在线化 
    //年度总结，月度、年度投资利润分析
    //利率计算器
    render() {
        return (
            <Content className='Content'>
                <Text style={{fontSize: '50px'}}> TODO </Text>
            </Content>
        )
    }
}

export default TodoPage