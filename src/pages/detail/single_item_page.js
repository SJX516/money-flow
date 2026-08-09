import { Pie } from "@ant-design/plots";
import { Button, Card, Col, Divider, Empty, Layout, Radio, Row, Select, Space, Statistic, Table, Typography } from "antd";
import React from "react";
import { IncomeExpenditureHistoryService } from "../../domain/service/income_expenditure_history_service";
import EChartView from "./finance/echart_view";
import IncomeExpenditureEditDialog from "./widget/income_expenditure_edit_dialog";

const { Content } = Layout;
const { Title, Text } = Typography;

function yuan(value) {
    return Math.round(Math.abs(Number(value || 0)) / 100)
}

function moneyLabelFromCents(value) {
    return `¥${yuan(value).toLocaleString("zh-CN")}`
}

function moneyLabelFromYuan(value) {
    return `¥${Math.round(Number(value || 0)).toLocaleString("zh-CN")}`
}

function dayLabel(value) {
    if(!(value instanceof Date) || Number.isNaN(value.getTime())) return "-"
    const offset = value.getTimezoneOffset() * 60000
    return new Date(value.getTime() - offset).toISOString().slice(0, 10)
}

class SingleItemPage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isIncome: true,
            topTypes: [],
            rootCode: null,
            selectedCode: null,
            onlyCurrentType: false,
            selectedMonth: null,
            editDetail: null,
            model: null
        }
        this.linePlotClick = ({ chart, event }) => {
            const months = this.state.model?.monthlyData?.map(item => item.month) || []
            if(months.length === 0) return

            const x = Number(event.offsetX ?? event.zrX)
            const y = Number(event.offsetY ?? event.zrY)
            if(!Number.isFinite(x) || !Number.isFinite(y)) return

            const monthPixels = months.map((month, index) => ({
                index,
                x: Number(chart.convertToPixel({ xAxisIndex: 0 }, month))
            })).filter(item => Number.isFinite(item.x))
            if(monthPixels.length === 0) return

            if(y < 40 || y > chart.getHeight() - 32) return
            const firstGap = monthPixels.length > 1 ? Math.abs(monthPixels[1].x - monthPixels[0].x) / 2 : 24
            const lastIndex = monthPixels.length - 1
            const lastGap = monthPixels.length > 1
                ? Math.abs(monthPixels[lastIndex].x - monthPixels[lastIndex - 1].x) / 2
                : 24
            if(x < monthPixels[0].x - firstGap || x > monthPixels[lastIndex].x + lastGap) return

            const nearest = monthPixels.reduce((result, item) =>
                Math.abs(item.x - x) < Math.abs(result.x - x) ? item : result
            )
            this.setState({ selectedMonth: months[nearest.index] })
        }
        this.detailColumns = [
            { title: "日期", dataIndex: "happenTime", width: 130, render: dayLabel },
            { title: "类型", dataIndex: "typeName", width: 160 },
            { title: "金额", dataIndex: "money", width: 160, align: "right",
                sorter: (a, b) => Number(a.money || 0) - Number(b.money || 0), render: moneyLabelFromCents },
            { title: "描述", dataIndex: "desc", render: value => value || "-" },
            { title: "操作", key: "action", width: 90, render: (_, detail) =>
                <Button type="link" size="small" onClick={() => this.setState({ editDetail: detail })}>编辑</Button> }
        ]
    }

    componentDidMount() {
        this.loadType(true)
    }

    loadType(isIncome) {
        const topTypes = IncomeExpenditureHistoryService.getTopTypes(isIncome)
        const rootCode = topTypes[0]?.code ?? null
        this.setState({
            isIncome,
            topTypes,
            rootCode,
            selectedCode: null,
            onlyCurrentType: false,
            selectedMonth: null,
            model: rootCode == null ? null : IncomeExpenditureHistoryService.query(isIncome, rootCode)
        })
    }

    selectRoot(rootCode) {
        this.setState({
            rootCode,
            selectedCode: null,
            onlyCurrentType: false,
            selectedMonth: null,
            model: IncomeExpenditureHistoryService.query(this.state.isIncome, rootCode)
        })
    }

    selectChild(selectedCode) {
        const onlyCurrentType = selectedCode === "current" || selectedCode === this.state.rootCode
        const value = selectedCode === "all" ? null : onlyCurrentType ? this.state.rootCode : selectedCode
        this.setState({
            selectedCode: value,
            onlyCurrentType,
            selectedMonth: null,
            model: IncomeExpenditureHistoryService.query(
                this.state.isIncome, this.state.rootCode, value, !onlyCurrentType
            )
        })
    }

    getPieConfig() {
        const source = this.state.model?.donutData || []
        const total = source.reduce((sum, item) => sum + item.money, 0)
        const data = source.map(item => ({
            ...item,
            value: Math.abs(Number(item.money || 0)) / 100,
            valuePercent: total > 0 ? item.money / total : 0
        }))
        return {
            appendPadding: 10,
            data,
            angleField: "value",
            colorField: "name",
            radius: 1,
            innerRadius: 0.618,
            label: {
                type: "inner",
                offset: "-50%",
                style: { fill: "black", textAlign: "center" },
                formatter: item => `${item.name}: ${Math.round(item.valuePercent * 100)}%`,
                autoRotate: false
            },
            tooltip: {
                formatter: datum => ({ name: datum.name, value: moneyLabelFromYuan(datum.value) })
            },
            statistic: {
                title: {
                    customHtml: (container, view, datum) =>
                        <div style={{ fontWeight: "bold" }}>{datum ? datum.name : "总计"}</div>
                },
                content: {
                    customHtml: (container, view, datum, allData) => {
                        const value = datum ? datum.value : allData.reduce((sum, item) => sum + item.value, 0)
                        return <div style={{ fontWeight: "bold", fontSize: 22 }}>{moneyLabelFromYuan(value)}</div>
                    }
                }
            },
            interactions: [{ type: "element-active" }, { type: "pie-statistic-active" }],
            onReady: plot => plot.on("element:click", event => {
                const code = event.data?.data?.code
                if(code != null) this.selectChild(code)
            })
        }
    }

    getLineOption() {
        const data = this.state.model?.monthlyData || []
        const name = this.state.model?.selectedType?.name || "金额"
        const average = data.length ? data.reduce((sum, item) => sum + Math.abs(Number(item.money) || 0), 0) / data.length / 100 : 0
        const averageName = this.state.isIncome ? "月均收入" : "月均支出"
        return {
            color: [this.state.isIncome ? "#cf1322" : "#389e0d"],
            tooltip: {
                trigger: "axis",
                valueFormatter: moneyLabelFromYuan
            },
            grid: { left: 24, right: 24, top: 40, bottom: 32, containLabel: true },
            xAxis: {
                type: "category",
                boundaryGap: false,
                data: data.map(item => item.month)
            },
            yAxis: {
                type: "value",
                axisLabel: { formatter: moneyLabelFromYuan }
            },
            series: [{
                name,
                type: "line",
                smooth: true,
                showSymbol: true,
                symbolSize: data.length < 36 ? 7 : 4,
                areaStyle: { opacity: 0.1 },
                data: data.map(item => yuan(item.money)),
                markLine: {
                    silent: true,
                    symbol: "none",
                    lineStyle: { color: "#fa8c16", width: 1.5, type: "dashed" },
                    label: { show: true, position: "insideEndTop", color: "#d46b08",
                        formatter: () => `${averageName} ${moneyLabelFromYuan(average)}` },
                    tooltip: { formatter: () => `${averageName}：${moneyLabelFromYuan(average)}` },
                    data: [{ yAxis: average }]
                }
            }]
        }
    }

    refreshAfterEdit() {
        const { isIncome, rootCode, selectedCode, onlyCurrentType } = this.state
        this.setState({
            editDetail: null,
            model: IncomeExpenditureHistoryService.query(isIncome, rootCode, selectedCode, !onlyCurrentType)
        })
    }

    renderMonthlyDetails() {
        const { model, selectedMonth } = this.state
        if(!selectedMonth) return <Text type="secondary">点击折线图中任意月份位置，查看该月明细。</Text>
        const details = (model?.monthlyDetails?.[selectedMonth] || []).map((item, index) => ({
            ...item, key: item.id ?? `${selectedMonth}-${index}`
        }))
        return <Card style={{ marginTop: 16 }} title={`${selectedMonth} 明细`}>
            {details.length
                ? <Table columns={this.detailColumns} dataSource={details} pagination={false}
                    summary={() => <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}><Text strong>合计</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                            <Text strong>{moneyLabelFromCents(details.reduce((sum, item) => sum + item.money, 0))}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} />
                        <Table.Summary.Cell index={4} />
                    </Table.Summary.Row>} />
                : <Empty description="该月没有相关明细" />}
        </Card>
    }

    render() {
        const { isIncome, topTypes, rootCode, selectedCode, onlyCurrentType, model } = this.state
        const hasData = (model?.monthlyData?.length || 0) > 0
        return <Content style={{ padding: 24 }}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div>
                    <Title level={3} style={{ marginBottom: 4 }}>单项收支历史</Title>
                    <Text type="secondary">按收入或支出类型查看累计金额、子类型构成与月度变化。</Text>
                </div>
                <Card>
                    <Space size={16} wrap>
                        <Radio.Group value={isIncome} onChange={event => this.loadType(event.target.value)}>
                            <Radio.Button value={true}>收入</Radio.Button>
                            <Radio.Button value={false}>支出</Radio.Button>
                        </Radio.Group>
                        <Select style={{ minWidth: 220 }} placeholder="选择父类型" value={rootCode}
                            options={topTypes.map(type => ({ value: type.code, label: type.name }))}
                            onChange={value => this.selectRoot(value)} />
                        <Select style={{ minWidth: 220 }} value={onlyCurrentType ? "current" : selectedCode ?? "all"} disabled={rootCode == null}
                            options={[{ value: "all", label: "当前类型及全部子类型" },
                                { value: "current", label: "仅当前类型" },
                                ...(model?.descendantTypes || []).map(type => ({ value: type.code, label: type.name }))]}
                            onChange={value => this.selectChild(value)} />
                    </Space>
                </Card>
                {rootCode == null ? <Card><Empty description="暂无可选择的类型" /></Card> : <>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={7}>
                            <Card style={{ height: "100%" }}>
                                <Statistic title="历史总金额" value={yuan(model?.totalMoney)} precision={0}
                                    prefix="¥" groupSeparator="," />
                                <Text type="secondary">包含当前父类型及其全部子类型</Text>
                                {selectedCode != null && <>
                                    <Divider style={{ margin: "16px 0" }} />
                                    <Statistic title={onlyCurrentType
                                        ? `仅当前类型总金额（${model?.selectedType?.name || ""}）`
                                        : `当前子类型历史总金额（${model?.selectedType?.name || ""}）`}
                                        value={yuan(model?.selectedTotalMoney)} precision={0} prefix="¥" groupSeparator="," />
                                </>}
                            </Card>
                        </Col>
                        <Col xs={24} md={17}>
                            <Card title="各子类型历史总金额">
                                {(model?.donutData?.length || 0) > 0
                                    ? <Pie {...this.getPieConfig()} />
                                    : <Empty description="该父类型暂无子类型数据" />}
                            </Card>
                        </Col>
                    </Row>
                    <Card title={selectedCode == null ? "全部类型月度金额" : `${model?.selectedType?.name || ""}月度金额`}>
                        {hasData
                            ? <EChartView option={this.getLineOption()} height={420} ariaLabel="每月金额折线图"
                                onPlotClick={this.linePlotClick} />
                            : <Empty description="当前类型暂无历史数据" />}
                        {hasData && this.renderMonthlyDetails()}
                    </Card>
                </>}
            </Space>
            <IncomeExpenditureEditDialog detail={this.state.editDetail}
                onSaved={() => this.refreshAfterEdit()} onCancel={() => this.setState({ editDetail: null })} />
        </Content>
    }
}

export default SingleItemPage
