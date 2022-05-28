import React from 'react'
import { Button, Layout, Breadcrumb, Menu } from "antd"
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { App } from '../..'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import MonthPage from '../detail/month_page';
import TodoPage from '../detail/todo_page'
import InvestPage from '../detail/invest_page'
import { InvestmentProductRepo } from '../../domain/repo/investment_repo'
import { InvestmentDetail, InvestmentProduct } from '../../domain/entity/investment'
import { DataUtil } from '../../utils/utils'

const { Header, Content, Sider } = Layout;

class MainPage extends React.Component {

    constructor(props) {
        super(props)
        this.navItems = ['by_month', 'invest_detail', 'todo'].map((key) => {
            switch (key) {
                case 'by_month':
                    return { key, label: "按月展示" }
                case 'invest_detail':
                    return { key, label: "投资详情" }
                default:
                    return { key, label: "TODO" }
            }
        });
        this.state = {
            navKey: "invest_detail",
        }
    }

    async refreshDB(files) {
        console.log(files)
        await App.initDb(files[0])
    }

    export() {
        App.db?.export()
    }

    click1() {
        console.log(InvestmentDetail.repo.selectAll())
    }

    click2() {
    }

    click3() {
        InvestmentProduct.repo.deleteAll()
    }

    getByMonthSideDatas() {
        return {
            "2021": ["2021-12"],
            "2022": ["2022-04", "2022-05"],
        }
    }

    render() {
        let navKey = this.state.navKey
        let siderItems = []
        let subPage = null
        let openKeys = []
        if(navKey === 'by_month') {
            let sideDatas = this.getByMonthSideDatas()
            let lastMonth = null
            siderItems = Object.keys(sideDatas).sort((a, b) => b > a ? 1 : -1).map((year, i) => {
                openKeys.push(year)
                return {
                    key: year,
                    label: year,
                    children: sideDatas[year].sort((a, b) => b > a ? 1 : -1).map((month, j) => {
                        if(lastMonth == null) { lastMonth = month}
                        return {
                            key: month,
                            label: month,
                        };
                    }),
                };
            })
            if(DataUtil.isNull(this.state.sideKey)) {
                this.state.sideKey = lastMonth
            }
            subPage = <MonthPage month={this.state.sideKey}/>
        } else if(navKey === 'invest_detail') {
            subPage = <InvestPage/>
        } else {
            subPage = <TodoPage />
        }
        return (
            <Layout>
                <div>
                    <input type='file' id='dbfile' accept=".db" onChange={(e) => this.refreshDB(e.target.files)} />
                    <Button onClick={() => this.export()}>保存DB</Button>
                    <Button onClick={() => this.click1()}>查询所有</Button>
                    <Button onClick={() => this.click2()}>插入7条</Button>
                    <Button onClick={() => this.click3()}>清空</Button>
                </div>
                <Header className="header">
                    <Menu theme="dark" mode="horizontal" items={this.navItems} defaultSelectedKeys={[navKey]}
                        onSelect={(item) => {
                            this.setState(() => this.state.navKey = item.key)
                        }}/>
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
                        <Breadcrumb>
                            <Breadcrumb.Item>{this.state.navKey}</Breadcrumb.Item>
                            <Breadcrumb.Item>{this.state.sideKey}</Breadcrumb.Item>
                        </Breadcrumb>
                        {subPage}
                    </Layout>
                </Layout>
            </Layout>
        )
    }
}

export default MainPage