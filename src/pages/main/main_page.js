import { Layout, Menu } from "antd";
import React from 'react';
import { App, DB_INIT } from '../../app.js';
import InitPage from '../detail/init_page';
import InvestPage from '../detail/invest_page';
import MonthPage from '../detail/month_page';
import TodoPage from '../detail/todo_page';
import UserPage from '../detail/user_page';
import YearPage from '../detail/year_page';
import FinancePage from '../detail/finance_page';
import SingleItemPage from '../detail/single_item_page';

const { Header } = Layout;

class MainPage extends React.Component {

    constructor(props) {
        super(props)
        const items = [
            { key: "by_month", label: "🗓️ 按月展示" },
            { key: "by_year", label: "📆 按年展示" },
            { key: "single_item", label: "🔎 单项展示" },
            { key: "invest_detail", label: "💼 投资详情" },
            { key: "finance", label: "📈 理财页面" },
            { key: "init", label: "🗄️ 数据初始化", style: { marginLeft: "auto" } },
            { key: "user_config", label: "⚙️ 用户配置" }
        ]
        this.navItems = items;
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
        // 理财页面使用独立行情 DB，无需先初始化个人财务 DB。
        if (DB_INIT !== true && navKey !== 'finance') {
            navKey = 'init'
        }
        let subPage = null
        if (navKey === 'init') {
            subPage = <InitPage onDbReady={() => {
                let newKey = App.isProduction() ? "by_month" : "finance"
                this.setState({ navKey: newKey })
            }} />
        } else {
            if (navKey === 'by_month') {
                subPage = <MonthPage />
            } else if (navKey === 'by_year') {
                subPage = <YearPage />
            } else if (navKey === 'single_item') {
                subPage = <SingleItemPage />
            } else if (navKey === 'invest_detail') {
                subPage = <InvestPage />
            } else if (navKey === 'finance') {
                subPage = <FinancePage />
            } else if (navKey === 'user_config') {
                subPage = <UserPage />
            } else {
                subPage = <TodoPage />
            }
        }
        return (
            <Layout>
                <Header className="header">
                    <Menu theme="dark" mode="horizontal" style={{ display: "flex", width: "100%" }} items={this.navItems} selectedKeys={[navKey]}
                        onSelect={(item) => {
                            this.setState({ navKey: item.key })
                        }} />
                </Header>
                {subPage}
            </Layout>
        )
    }
}

export default MainPage