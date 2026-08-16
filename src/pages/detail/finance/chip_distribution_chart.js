import { Col, Row, Typography } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { calculateChipDistribution, calculateChipTrend } from "../../../domain/market/market_chip";
import EChartView from "./echart_view";
import { StockKlineChart } from "./market_charts";

const { Text } = Typography;
const PROFIT = "#ef4444";
const LOCKED = "#64748b";
const MEDIAN = "#1677ff";

function formatPrice(value) {
    return value == null ? "-" : Number(value).toFixed(2);
}

function ChipSummary({ result }) {
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px 12px", marginBottom: 8 }}>
        <div><Text type="secondary">日期</Text><br /><Text strong>{result.date}</Text></div>
        <div><Text type="secondary">获利筹码</Text><br /><Text strong style={{ color: PROFIT }}>{result.profitRatio.toFixed(2)}%</Text></div>
        <div><Text type="secondary">50% 成本</Text><br /><Text strong>{formatPrice(result.medianCost)}</Text></div>
        <div><Text type="secondary">70% 成本区间</Text><br /><Text strong>{formatPrice(result.cost70.low)}-{formatPrice(result.cost70.high)}</Text></div>
    </div>;
}

function ChipDistributionChart({ result }) {
    const option = useMemo(() => {
        if (!result || result.status !== "ready") return null;
        const points = result.points;
        const nearestPrice = value => points.reduce((nearest, point) =>
            Math.abs(point.price - value) < Math.abs(nearest.price - value) ? point : nearest, points[0]).price.toFixed(2);
        return {
            animation: false,
            aria: { enabled: true },
            grid: { left: 48, right: 18, top: 10, bottom: 34 },
            tooltip: {
                trigger: "axis", axisPointer: { type: "shadow" },
                formatter: params => params[0] ? "成本价 " + params[0].name + "<br/>筹码占比 " + Number(params[0].value).toFixed(3) + "%" : ""
            },
            xAxis: { type: "value", name: "占比", nameLocation: "middle", nameGap: 24,
                axisLabel: { formatter: value => Number(value).toFixed(1) + "%", color: "#718096", fontSize: 10 },
                splitLine: { lineStyle: { color: "#edf0f5" } } },
            yAxis: { type: "category", data: points.map(point => point.price.toFixed(2)),
                axisLabel: { color: "#718096", fontSize: 10 }, axisTick: { show: false } },
            series: [{
                type: "bar", barCategoryGap: "8%",
                data: points.map(point => ({ value: point.percent,
                    itemStyle: { color: point.price <= result.close ? PROFIT : LOCKED } })),
                markLine: { silent: true, symbol: "none", animation: false,
                    data: [
                        { yAxis: nearestPrice(result.close), name: "收盘 " + formatPrice(result.close),
                            label: { formatter: "收盘 " + formatPrice(result.close), color: PROFIT }, lineStyle: { color: PROFIT, width: 1.5 } },
                        { yAxis: nearestPrice(result.medianCost), name: "50% 成本 " + formatPrice(result.medianCost),
                            label: { formatter: "50% " + formatPrice(result.medianCost), color: MEDIAN }, lineStyle: { color: MEDIAN, type: "dashed" } }
                    ] }
            }]
        };
    }, [result]);

    if (!result) return <div style={{ padding: "90px 12px", textAlign: "center", color: "#999" }}>请选择 K 线日期</div>;
    if (result.status === "missing-turnover") return <div style={{ padding: "90px 12px", textAlign: "center", color: "#8c8c8c" }}>
        当前历史数据缺少每日换手率<br />请重新构建该股票历史
    </div>;
    if (!option) return <div style={{ padding: "90px 12px", textAlign: "center", color: "#999" }}>该日期暂无可用筹码数据</div>;
    return <>
        <ChipSummary result={result} />
        <EChartView option={option} height={390} ariaLabel={result.date + " 筹码分布图"} />
    </>;
}

function StockKlinePanel({ rows, historyRows, trades, targets, onRangeWheel, selectedDate: controlledDate, onDateChange }) {
    const latestDate = rows.length ? rows[rows.length - 1].trade_date : null;
    const [internalDate, setInternalDate] = useState(latestDate);
    const selectedDate = controlledDate || internalDate;
    useEffect(() => {
        if (!rows.some(row => row.trade_date === selectedDate)) setInternalDate(latestDate);
    }, [rows, selectedDate, latestDate]);
    const selectDate = useCallback(date => {
        setInternalDate(previous => previous === date ? previous : date);
        if (onDateChange) onDateChange(date);
    }, [onDateChange]);
    const result = useMemo(() => calculateChipDistribution(historyRows, selectedDate), [historyRows, selectedDate]);
    const chipTrend = useMemo(() => calculateChipTrend(
        historyRows, rows.map(row => row.trade_date)
    ), [historyRows, rows]);
    return <Row gutter={[16, 12]} align="top">
        <Col xs={24} lg={18}>
            <StockKlineChart rows={rows} trades={trades} targets={targets}
                chipTrend={chipTrend} activeDate={selectedDate} onRangeWheel={onRangeWheel} onDateChange={selectDate} />
        </Col>
        <Col xs={24} lg={6}>
            <div style={{ height: 530 }}>
                <Text strong>筹码分布</Text>
                <div style={{ marginTop: 8 }}><ChipDistributionChart result={result} /></div>
            </div>
        </Col>
    </Row>;
}

export { ChipDistributionChart, StockKlinePanel };
