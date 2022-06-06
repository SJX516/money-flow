import React, { useState } from 'react'
import { Modal, message, Button, Layout, Breadcrumb, Menu, Row, Col, Input } from "antd"
import MonthPage from '../detail/month_page';
import TodoPage from '../detail/todo_page'
import InvestPage from '../detail/invest_page'
import { DataUtil, TimeUtil } from '../../utils/utils'
import InitPage from '../detail/init_page'
import { SummaryService } from '../../domain/service/summary_service';
import InputWidget from '../detail/widget/input_widget';
import { CusDialog } from '../detail/widget/cus_dialog';

const { Header, Content, Sider } = Layout;

class MainPage extends React.Component {

    constructor(props) {
        super(props)
        this.navItems = ['init', 'by_month', 'invest_detail', 'todo'].map((key) => {
            switch (key) {
                case 'init':
                    return { key, label: "数据初始化" }
                case 'by_month':
                    return { key, label: "按月展示" }
                case 'invest_detail':
                    return { key, label: "投资详情" }
                default:
                    return { key, label: "TODO" }
            }
        });
        this.state = {
            navKey: "init",
        }

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
        console.log(map)
        return map
    }

    showAddNewMonthDialog() {
        this.setState({
            showDialog: "addNewMonth",
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
            showDialog: "",
        })
    }

    render() {
        let navKey = this.state.navKey
        let siderItems = []
        let topRightBtns = []
        let subPage = null
        let openKeys = []
        if (navKey === 'init' || this.state.dbReady !== true) {
            if(navKey !== 'init') {
                this.state.navKey = "init"
                message.error('请先加载DB')
            }
            subPage = <InitPage onDbReady={() => {
                this.state.dbReady = true
                this.state.navKey = "by_month"
                this.refreshPage()
            }} />
        } else {
            if (navKey === 'by_month') {
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
                topRightBtns.push(<Button onClick={() => this.showAddNewMonthDialog()}>新加月份</Button>)
                subPage = <MonthPage month={this.state.sideKey} />
            } else if (navKey === 'invest_detail') {
                subPage = <InvestPage />
            } else {
                subPage = <TodoPage />
            }
        }
        return (
            <Layout>
                <Header className="header">
                    <Menu theme="dark" mode="horizontal" items={this.navItems} selectedKeys={[navKey]}
                        onSelect={(item) => {
                            this.setState(() => this.state.navKey = item.key)
                        }} />
                </Header>
                <Layout>
                    <Sider width={200} className="site-layout-background">
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
                                    <Breadcrumb.Item>{this.state.navKey}</Breadcrumb.Item>
                                    <Breadcrumb.Item>{this.state.sideKey}</Breadcrumb.Item>
                                </Breadcrumb>
                            </Col>
                            <Col span={12} align='right'>
                                {topRightBtns}
                            </Col>
                        </Row>
                        {subPage}
                    </Layout>
                    <CusDialog title="新加月份" visible={this.state.showDialog === "addNewMonth"}
                        cfgs={[{
                            name: "date",
                            hint: "月份",
                            picker: "month",
                            defaultValue: new Date()
                        }]}
                        onOk={(state) => this.addNewMoth(state.date)}
                        onCancel={() => this.hideDialog()} />
                </Layout>
            </Layout>
        )
    }
}

export default MainPage