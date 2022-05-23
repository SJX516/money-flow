import React from 'react'
import { Button, Layout, Breadcrumb, Menu } from "antd"
import './main_page.css'
import { IncomeExpenditureService } from '../../domain/service/income_expenditure_service'
import { App } from '../..'
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../../domain/entity/income_expenditure'
import MonthPage from '../detail/month_page';

const { Header, Content, Sider } = Layout;

class MainPage extends React.Component {

    constructor(props) {
        super(props)
        this.navItems = ['by_month', 'todo'].map((key) => {
            switch (key) {
                case 'by_month':
                    return { key, label: "按月展示" }
                default:
                    return { key, label: "TODO" }
            }
        });
        this.state = {
            navKey: "by_month",
            sideDatas: {},
            currentMonth: ""
        }
    }

    async refreshDB(files) {
        console.log(files)
        await App.initDb(files[0])
        this.refreshMainView()
    }

    export() {
        App.db?.export()
    }

    click1() {
        console.log(IncomeExpenditureDetail.repo.selectAll())
    }

    click2() {
        IncomeExpenditureService.upsert(1100, IncomeExpenditureType.Incomme.salary, new Date('2022-04-01'))
        IncomeExpenditureService.upsert(1200, IncomeExpenditureType.Incomme.luckmoney.self, new Date('2022-04-02'))
        IncomeExpenditureService.upsert(1300, IncomeExpenditureType.Incomme.luckmoney.home, new Date('2022-04-02'))
        IncomeExpenditureService.upsert(1400, IncomeExpenditureType.Incomme.luckmoney.work, new Date('2022-04-02'))
        IncomeExpenditureService.upsert(-3200, IncomeExpenditureType.Expenditure.home.self, new Date('2022-04-02'))
        IncomeExpenditureService.upsert(-2200, IncomeExpenditureType.Expenditure.home.rent, new Date('2022-04-02'))
        IncomeExpenditureService.upsert(-4200, IncomeExpenditureType.Expenditure.home.utility, new Date('2022-04-28'))
    }

    click3() {
        IncomeExpenditureDetail.repo.deleteAll()
    }

    refreshMainView() {
        let months = {
            "2021": ["2021-12"],
            "2022": ['2022-01', '2022-02', '2022-03', '2022-04', '2022-05'],
        }

        this.setState({
            navKey: "by_month",
            sideDatas: months,
            currentMonth: '2022-05'
        })
    }

    render() {
        let allYear = []
        let siderItems = Object.keys(this.state.sideDatas).sort((a, b) => b > a ? 1 : -1).map((year, i) => {
            allYear.push(year)
            return {
                key: year,
                label: year,
                children: this.state.sideDatas[year].sort((a, b) => b > a ? 1 : -1).map((month, j) => {
                    return {
                        key: month,
                        label: month,
                    };
                }),
            };
        })
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
                    <Menu theme="dark" mode="horizontal" selectedKeys={[this.state.navKey]} items={this.navItems} />
                </Header>
                <Layout>
                    <Sider width={200} className="site-layout-background">
                        <Menu
                            className='Menu'
                            mode="inline"
                            openKeys={allYear}
                            selectedKeys={[this.state.currentMonth]}
                            items={siderItems}
                        />
                    </Sider>
                    <Layout className='Layout-inner'>
                        <Breadcrumb className='Breadcrumb'>
                            <Breadcrumb.Item>{this.state.navKey}</Breadcrumb.Item>
                            <Breadcrumb.Item>{this.state.currentMonth}</Breadcrumb.Item>
                        </Breadcrumb>
                        <Content className='Content'>
                            <MonthPage month={this.state.currentMonth}/>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        )
    }
}

export default MainPage