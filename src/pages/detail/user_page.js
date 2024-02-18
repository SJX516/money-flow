import { Col, Divider, Layout, Row, Space, Table, Typography } from 'antd';
import React from 'react';
import { App } from '../../app';
import { UserConfigStatus, UserConfigType } from '../../domain/entity/user_entity';
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service';
import { IncomeExpenditureVMService } from '../../domain/service/view_model_service';
import { DataUtil } from '../../utils/utils';
import { CusDialog } from './widget/cus_dialog';

const { Content } = Layout;
const { Text } = Typography;

class UserPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
        this.incomeExpendColumns = [
            // {
            //     title: 'Code',
            //     key: 'code',
            //     dataIndex: 'entity',
            //     render: (entity) => {
            //         return <Text disabled={!entity.isEnable()}>{entity.code}</Text>
            //     },
            // },
            {
                title: '名称',
                key: 'name',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text disabled={!entity.isEnable()}>{entity.name}</Text>
                },
            }, {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                    <Space size="middle">
                        <a onClick={() => {
                            this.showModifyTypeDialog('updateType', record.entity)
                        }}>编辑</a>
                        <a disabled={!record.entity.isEnable()} onClick={() => {
                            if (record.entity.isEnable()) {
                                this.showModifyTypeDialog('addType', record.entity)
                            }
                        }}>新增</a>
                    </Space>
                ),
            }];

        this.subIncomeExpendColumns = [
            // {
            //     title: '子类型Code',
            //     key: 'code',
            //     dataIndex: 'entity',
            //     render: (entity) => {
            //         return <Text disabled={!entity.isEnable()}>{entity.code}</Text>
            //     },
            // },
            {
                title: '子类型名称',
                key: 'name',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Text disabled={!entity.isEnable()}>{entity.name}</Text>
                },
            }, {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                    <Space size="middle">
                        <a onClick={() => {
                            this.showModifyTypeDialog('updateType', record.entity)
                        }}>编辑</a>
                    </Space>
                ),
            }]
    }

    showModifyTypeDialog(key, type) {
        this.setState({
            dialogKey: key,
            dialogExtra: type
        })
    }

    hideDialog() {
        this.setState({
            dialogKey: null,
            dialogExtra: null
        })
    }

    modifyType(key, data) {
        console.log(key, data)
        let type = data.extra
        let enable = data.switch
        let newName = data.desc
        let newParentCode = parseInt(data.type)
        if (newParentCode == 0) {
            newParentCode = null
        }
        if (key === 'updateType') {
            IncomeExpenditureService.updateType(type, newName, newParentCode, enable ? UserConfigStatus.Normal : UserConfigStatus.Disabled)
        } else if (key === 'addType') {
            IncomeExpenditureService.addType(type.config.type, newName, newParentCode, enable ? UserConfigStatus.Normal : UserConfigStatus.Disabled)
        }
        this.hideDialog()
    }

    refreshPage() {
        this.setState({
            updateTime: new Date().getTime()
        })
    }

    render() {
        let incomeTypes = IncomeExpenditureVMService.getTypeTrees(UserConfigType.IncomeType, true)
        let expendTypes = IncomeExpenditureVMService.getTypeTrees(UserConfigType.ExpenditureType, true)
        let subIncomeExpendRowRender = (record, index) => {
            return <Table columns={this.subIncomeExpendColumns} dataSource={record.childs} pagination={false} />;
        }
        let subIncomeExpendRowExpandable = (record) => {
            return !DataUtil.isNull(record.childs) && record.childs.length > 0
        }
        let topIncomeCodeToName = {}
        let topExpendCodeToName = {}
        for (const type of incomeTypes) {
            topIncomeCodeToName[type.entity.code] = [type.entity.name]
        }
        topIncomeCodeToName["0"] = ["空"]
        for (const type of expendTypes) {
            topExpendCodeToName[type.entity.code] = [type.entity.name]
        }
        topExpendCodeToName["0"] = ["空"]
        let dialogTitle = ""
        let dialogVisible = false
        if (this.state.dialogKey === "updateType") {
            dialogVisible = true
            dialogTitle = "编辑类型"
        } else if (this.state.dialogKey === "addType") {
            dialogVisible = true
            dialogTitle = "新增类型"
        }
        return (
            <Content className='Content'>
                <Divider orientation="center">DB版本：{App.db?.getDbConfig()['db_version']}</Divider>
                <Row justify="space-between" style={{ padding: '10px 5px', backgroundColor: "#eee" }}>
                    <Col span={12}>
                        <Divider orientation="center">收入类型配置</Divider>
                        <Table style={{ margin: "0px 5px" }} columns={this.incomeExpendColumns} dataSource={incomeTypes} expandable={{
                            expandedRowRender: subIncomeExpendRowRender,
                            rowExpandable: subIncomeExpendRowExpandable
                        }} pagination={{ pageSize: 50 }} sortDirections={['descend']} />
                    </Col>
                    <Col span={12}>
                        <Divider orientation="center">支出类型配置</Divider>
                        <Table columns={this.incomeExpendColumns} dataSource={expendTypes} expandable={{
                            expandedRowRender: subIncomeExpendRowRender,
                            rowExpandable: subIncomeExpendRowExpandable
                        }} pagination={{ pageSize: 50 }} sortDirections={['descend']} />
                    </Col>
                </Row>
                <CusDialog title={dialogTitle} visible={dialogVisible}
                    key={this.state.dialogExtra?.code}
                    cfgs={[{
                        name: "type",
                        hint: "父类型",
                        required: true,
                        code2Name: this.state.dialogExtra?.isIncome() ? topIncomeCodeToName : topExpendCodeToName,
                        defaultValue: this.state.dialogKey === "addType" ? (this.state.dialogExtra?.config.code ?? 0) + '' :
                            (this.state.dialogExtra?.config.parent_code ?? 0) + ''
                    }, {
                        name: "desc",
                        type: "input",
                        hint: "名称",
                        required: true,
                        defaultValue: this.state.dialogExtra?.name
                    }, {
                        name: "switch",
                        hint: "是否启用",
                        required: true,
                        defaultValue: this.state.dialogExtra?.isEnable()
                    }]}
                    extra={this.state.dialogExtra}
                    onOk={(state) => this.modifyType(this.state.dialogKey, state)}
                    onCancel={() => this.hideDialog()} />
            </Content>
        )
    }
}

export default UserPage