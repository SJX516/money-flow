import { Layout, Menu, message } from "antd";
import React from 'react';
import { App, DB_INIT } from '../../app.js';
import InitPage from '../detail/init_page';
import InvestPage from '../detail/invest_page';
import MonthPage from '../detail/month_page';
import TodoPage from '../detail/todo_page';
import UserPage from '../detail/user_page';
import YearPage from '../detail/year_page';
import TestPage from './test_page';

const { Header } = Layout;

class MainPage extends React.Component {

    constructor(props) {
        super(props)
        let items = {
            'init': "数据初始化",
            'by_month': "按月展示",
            'by_year': "按年展示",
            'invest_detail': "投资详情",
            'user_config': "用户配置",
        }
        if(!App.isProduction()) {
            items['test'] = '测试页面'
        }
        this.navItems = Object.keys(items).map((key) => {
            return { key, label: items[key] }
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

    render() {
        let navKey = this.state.navKey
        let subPage = null
        if (navKey === 'init' || DB_INIT !== true) {
            if(navKey !== 'init') {
                this.state.navKey = "init"
                message.error('请先加载DB文件')
            }
            subPage = <InitPage onDbReady={() => {
                if(App.isProduction()) {
                    this.state.navKey = "by_month"
                } else {
                    this.state.navKey = "user_config"
                }
                this.refreshPage()
            }} />
        } else {
            if (navKey === 'test') {
                subPage = <TestPage />
            } else if (navKey === 'by_month') {
                subPage = <MonthPage />
            } else if (navKey === 'by_year') {
                subPage = <YearPage />
            } else if (navKey === 'invest_detail') {
                subPage = <InvestPage />
            } else if (navKey === 'user_config') {
                subPage = <UserPage />
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
                {subPage}
            </Layout>
        )
    }
}

export default MainPage