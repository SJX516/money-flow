import React from 'react'
import { Button, Layout, Breadcrumb, Menu } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import { DataUtil } from '../../utils/utils';

const { Header, Content, Sider } = Layout;

class MonthPage extends React.Component {

    queryData(month) {
        if(DataUtil.isEmpty(month)) {
            return []
        } else {
            return IncomeExpenditureService.queryMonth(month)
        }
    }

    render() {
        //TODO
        console.log(this.queryData(this.props.month))
        return (
            <Content>
                {this.props.month}
            </Content>
        )
    }
}

export default MonthPage