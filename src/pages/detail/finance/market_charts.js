import React, { useMemo } from "react";
import { compactNumber, mapTradesToRows } from "./chart_utils";
import EChartView from "./echart_view";

const UP = "#ef4444";
const DOWN = "#22c55e";
const BUY = "#8b5cf6";
const SELL = "#ff2d95";
const CHIP_MEDIAN = "#722ed1";
const CHIP_PROFIT = "#0891b2";
const AXIS = "#718096";
const GRID = "#edf0f5";
const FINANCING_POSITIVE = "#ef4444";
const FINANCING_NEGATIVE = "#22c55e";

function financingActivityColor(value) {
    return value > 0 ? FINANCING_POSITIVE : value < 0 ? FINANCING_NEGATIVE : "#94a3b8";
}

function money(value) {
    return "¥" + Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function signed(value, digits) {
    if (value == null || !Number.isFinite(Number(value))) return "-";
    const number = Number(value);
    return (number > 0 ? "+" : "") + number.toFixed(digits);
}

function baseTooltip(formatter) {
    return {
        trigger: "axis", axisPointer: { type: "cross", link: [{ xAxisIndex: "all" }] },
        backgroundColor: "rgba(17,24,39,.96)", borderColor: "#374151",
        textStyle: { color: "#e5e7eb", fontSize: 12 }, formatter
    };
}

function targetLine(target, yAxisIndex = 0, xAxisIndex = 0) {
    const label = (target.description || target.metric) + " · " + Number(target.target_value).toLocaleString("zh-CN");
    return { name: "目标：" + label, type: "line", data: [], silent: true, yAxisIndex, xAxisIndex,
        lineStyle: { color: target.color }, itemStyle: { color: target.color },
        markLine: { silent: true, symbol: "none", animation: false,
            label: { show: true, formatter: label, color: target.color, position: "insideEndTop" },
            lineStyle: { color: target.color, width: 1.5, type: "solid" },
            data: [{ yAxis: Number(target.target_value) }] }
    };
}

function categoryAxis(dates, gridIndex, showLabel = true) {
    return { type: "category", data: dates, gridIndex, boundaryGap: true,
        axisLabel: { show: showLabel, color: AXIS, fontSize: 10 }, axisLine: { lineStyle: { color: "#d9d9d9" } } };
}

function valueAxis(gridIndex, formatter) {
    return { type: "value", scale: true, gridIndex, axisLabel: { color: AXIS, formatter },
        splitLine: { lineStyle: { color: GRID } } };
}

function StockKlineChart({ rows, trades = [], targets = [], chipTrend = [], activeDate, onRangeWheel, onDateChange }) {
    const option = useMemo(() => {
        if (!rows.length) return null;
        const dates = rows.map(row => row.trade_date);
        const chipByDate = new Map(chipTrend.map(item => [item.date, item]));
        const visibleTrades = mapTradesToRows(rows, trades);
        const tradesByIndex = new Map();
        visibleTrades.forEach(trade => tradesByIndex.set(trade.index, [...(tradesByIndex.get(trade.index) || []), trade]));
        const tooltip = params => {
            const index = params[0] && params[0].dataIndex;
            const row = rows[index];
            if (!row) return "";
            const close = Number(row.close);
            const previousClose = index > 0 ? Number(rows[index - 1].close) : null;
            const changePercent = previousClose != null && Number.isFinite(previousClose) && previousClose !== 0
                ? (close - previousClose) / previousClose * 100 : null;
            const closeColor = changePercent > 0 ? UP : changePercent < 0 ? DOWN : "#d1d5db";
            const tradeLines = (tradesByIndex.get(index) || []).map(trade =>
                '<div style="margin-top:5px;color:' + (trade.type === "buy" ? BUY : SELL) + '"><b>' +
                (trade.type === "buy" ? "买入" : "卖出") + "</b>　价格 " + (trade.price == null ? "未知" : money(trade.price)) +
                "<br/>数量 " + (trade.count == null ? "未知" : compactNumber(trade.count) + " 股") + "　金额 " + money(trade.amount) + "</div>").join("");
            return '<div style="font-size:18px;font-weight:700;color:' + closeColor + ';margin-bottom:3px">收盘 ' + close.toFixed(2) +
                '<span style="font-size:13px;margin-left:10px">' + (changePercent == null ? "-" : signed(changePercent, 2) + "%") + "</span></div>" +
                "<b>" + row.trade_date + "</b><br/>开 " + Number(row.open).toFixed(2) + "　高 " + Number(row.high).toFixed(2) +
                "<br/>低 " + Number(row.low).toFixed(2) +
                '<br/><span style="color:#fa8c16">MA5 ' + (row.ma5 == null ? "-" : Number(row.ma5).toFixed(2)) + '</span>　<span style="color:#1677ff">MA30 ' + (row.ma30 == null ? "-" : Number(row.ma30).toFixed(2)) +
                '</span><br/><span style="color:' + CHIP_MEDIAN + '">50% 成本 ' + (chipByDate.get(row.trade_date)?.medianCost == null ? "-" : Number(chipByDate.get(row.trade_date).medianCost).toFixed(2)) +
                '</span>　<span style="color:' + CHIP_PROFIT + '">获利筹码 ' + (chipByDate.get(row.trade_date)?.profitRatio == null ? "-" : Number(chipByDate.get(row.trade_date).profitRatio).toFixed(2) + "%") +
                '</span><br/><span style="color:#8c8c8c">成交量 ' + compactNumber(row.volume) + "</span>" + tradeLines;
        };
        const tradeTip = param => { const trade = param.data.trade;
            return "<b>" + (trade.type === "buy" ? "买入" : "卖出") + " · " + trade.date + "</b><br/>价格 " + (trade.price == null ? "未知" : money(trade.price)) +
                "<br/>数量 " + (trade.count == null ? "未知" : compactNumber(trade.count) + " 股") + "<br/>金额 " + money(trade.amount); };
        return {
            animation: false, aria: { enabled: true }, tooltip: baseTooltip(tooltip), axisPointer: { link: [{ xAxisIndex: "all" }] },
            legend: { top: 0, icon: "path://M0 4 L24 4 L24 6 L0 6 Z", itemWidth: 24, itemHeight: 8,
                data: ["MA5", "MA30", "50% 成本", "获利筹码", "成交量"], selected: { "获利筹码": false },
                textStyle: { color: AXIS } },
            grid: [{ left: 64, right: 74, top: 48, height: "61%" }, { left: 64, right: 74, top: "76%", height: "13%" }],
            xAxis: [categoryAxis(dates, 0, false), categoryAxis(dates, 1, true)],
            yAxis: [valueAxis(0), valueAxis(1, value => compactNumber(value)),
                { type: "value", gridIndex: 0, position: "right", min: 0, max: 100, interval: 20,
                    name: "获利筹码", nameTextStyle: { color: CHIP_PROFIT },
                    axisLabel: { color: AXIS, formatter: value => Number(value).toFixed(0) + "%" },
                    splitLine: { show: false } }],
            series: [{ name: "K线", type: "candlestick", data: rows.map(row => [row.open, row.close, row.low, row.high]),
                itemStyle: { color: UP, color0: DOWN, borderColor: UP, borderColor0: DOWN },
                markPoint: { symbolSize: 21, label: { color: "#fff", fontWeight: "bold", fontSize: 9 },
                    tooltip: { trigger: "item", formatter: tradeTip }, data: visibleTrades.map(trade => ({
                    name: trade.type === "buy" ? "买入" : "卖出", coord: [trade.chartDate, trade.markerPrice], value: trade.type === "buy" ? "B" : "S",
                    symbol: "triangle", symbolRotate: trade.type === "buy" ? 0 : 180,
                    itemStyle: { color: trade.type === "buy" ? BUY : SELL, borderColor: "#fff", borderWidth: 1 }, trade
                })) } },
            { name: "MA5", type: "line", data: rows.map(row => row.ma5), showSymbol: false, lineStyle: { width: 1.4, color: "#fa8c16" }, itemStyle: { color: "#fa8c16" } },
            { name: "MA30", type: "line", data: rows.map(row => row.ma30), showSymbol: false, lineStyle: { width: 1.4, color: "#1677ff" }, itemStyle: { color: "#1677ff" } },
            { name: "50% 成本", type: "line", data: rows.map(row => chipByDate.get(row.trade_date)?.medianCost ?? null),
                showSymbol: false, connectNulls: false, lineStyle: { width: 1.6, color: CHIP_MEDIAN }, itemStyle: { color: CHIP_MEDIAN } },
            { name: "获利筹码", type: "line", yAxisIndex: 2,
                data: rows.map(row => chipByDate.get(row.trade_date)?.profitRatio ?? null),
                showSymbol: false, connectNulls: false, lineStyle: { width: 1.6, color: CHIP_PROFIT }, itemStyle: { color: CHIP_PROFIT } },
            { name: "成交量", type: "bar", xAxisIndex: 1, yAxisIndex: 1, itemStyle: { color: "#8c8c8c" }, data: rows.map(row => ({ value: row.volume,
                itemStyle: { color: row.close >= row.open ? "#fca5a5" : "#86efac" } })), barMaxWidth: 8 },
            ...targets.filter(target => target.metric === "price").map(target => targetLine(target))]
        };
    }, [rows, trades, targets, chipTrend]);
    const onEvents = useMemo(() => onDateChange ? ({
        updateAxisPointer: event => {
            const axis = (event.axesInfo || []).find(item => item.axisDim === "x" && Number(item.axisIndex) === 0);
            if (!axis) return;
            const numericIndex = Number(axis.value);
            const index = Number.isInteger(numericIndex) ? numericIndex
                : rows.findIndex(row => row.trade_date === String(axis.value));
            if (rows[index]) onDateChange(rows[index].trade_date);
        }
    }) : {}, [rows, onDateChange]);
    const activeDataIndex = activeDate ? rows.findIndex(row => row.trade_date === activeDate) : null;
    if (!option) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>当前范围没有日 K 数据</div>;
    return <EChartView option={option} height={530} ariaLabel="股票蜡烛 K 线图" onWheel={onRangeWheel}
        onEvents={onEvents} activeDataIndex={activeDataIndex} />;
}

function ValuationChart({ rows, metrics, targets = [], activeDate, onDateChange }) {
    const valid = rows.filter(row => metrics.some(key => ({ pe: "pe", pb: "pb", dividend: "dividend_yield", peg: "peg" })[key] && row[({ pe: "pe", pb: "pb", dividend: "dividend_yield", peg: "peg" })[key]] != null));
    const option = useMemo(() => {
        const definitions = [
            { key: "pe", field: "pe", name: "PE（TTM）", color: "#1677ff", axis: 0 },
            { key: "pb", field: "pb", name: "PB", color: "#722ed1", axis: 1 },
            { key: "dividend", field: "dividend_yield", name: "股息率（TTM）", color: "#13c2c2", axis: 2 }
            ,{ key: "peg", field: "peg", name: "PEG", color: "#eb2f96", axis: 3 }
        ];
        const visible = definitions.filter(item => metrics.includes(item.key));
        const selected = definitions.filter(item => metrics.includes(item.key) || item.key === "pb" || item.key === "dividend");
        if (!visible.length || !valid.length) return null;
        const dates = valid.map(row => row.report_date);
        const series = selected.map(metric => ({
            name: metric.name,
            type: "line",
            yAxisIndex: metric.axis,
            showSymbol: false,
            connectNulls: false,
            sampling: "lttb",
            data: valid.map(row => row[metric.field]),
            itemStyle: { color: metric.color },
            lineStyle: { color: metric.color, width: 1.6 }
        }));
        return { animation: false, aria: { enabled: true },
            tooltip: baseTooltip(params => {
                const row = valid[params[0] && params[0].dataIndex];
                if (!row) return "";
                return "<b>" + row.report_date + "</b><br/>" + visible.map(metric =>
                    '<span style="color:' + metric.color + '">●</span> ' + metric.name + "：" +
                    (row[metric.field] == null ? "-" : Number(row[metric.field]).toFixed(2))).join("<br/>") +
                    '<br/><span style="color:#9ca3af">基于 ' + row.source_report_date + " 财报期 TTM 数据计算</span>";
            }),
            legend: { top: 0, icon: "path://M0 4 L24 4 L24 6 L0 6 Z", itemWidth: 24, itemHeight: 8,
                data: selected.map(item => item.name), selected: { "PB": false, "股息率（TTM）": false }, textStyle: { color: AXIS } },
            grid: { left: 64, right: 180, top: 46, bottom: 50 },
            xAxis: { type: "category", data: dates, axisLabel: { color: AXIS }, axisPointer: { type: "shadow" } },
            yAxis: [
                { ...valueAxis(0), name: "PE TTM", nameTextStyle: { color: "#1677ff" } },
                { ...valueAxis(0), name: "PB", position: "right", offset: 112, nameTextStyle: { color: "#722ed1" } },
                { ...valueAxis(0, value => Number(value).toFixed(1) + "%"), name: "股息率", position: "right",
                    offset: 58, nameTextStyle: { color: "#13c2c2" } },
                { ...valueAxis(0, value => Number(value).toFixed(2)), name: "PEG", position: "right", offset: 0,
                    nameTextStyle: { color: "#eb2f96" } }
            ],
            series: [...series, ...targets.filter(target => selected.some(metric => metric.field === target.metric))
                .map(target => targetLine(target, definitions.find(metric => metric.field === target.metric).axis))]
        };
    }, [metrics, targets, valid]);
    const onEvents = useMemo(() => onDateChange ? ({ updateAxisPointer: event => {
        const axis = (event.axesInfo || []).find(item => item.axisDim === "x");
        if (!axis) return;
        const index = Number(axis.value);
        if (Number.isInteger(index) && valid[index]) onDateChange(valid[index].report_date);
    } }) : {}, [onDateChange, valid]);
    const activeDataIndex = activeDate ? valid.reduce((found, row, index) => row.report_date <= activeDate ? index : found, -1) : null;
    if (!metrics.length) return <div style={{ padding: 32, color: "#999" }}>请至少选择一项估值指标</div>;
    if (!option) return <div style={{ padding: 32, color: "#999" }}>当前范围没有可用估值数据</div>;
    return <div>
        <div style={{ color: "#999", fontSize: 12, marginBottom: 2 }}>
            PE 使用滚动 12 个月每股收益，股息率使用过去 12 个月税前现金分红；每日数值按当日收盘价计算。
        </div>
        <EChartView option={option} height={390} ariaLabel="每日 PE TTM、PB 与股息率 TTM 综合图"
            onEvents={onEvents} activeDataIndex={activeDataIndex} />
    </div>;
}

function FinancialDataChart({ rows, activeDate, onDateChange }) {
    const nodes = useMemo(() => {
        const result = []; let last = null;
        rows.forEach(row => { if (row.source_report_date !== last) { result.push(row); last = row.source_report_date; } });
        console.info("[MarketDiag] financial chart input", { rows: rows.length, nodes: result.length,
            profitNodes: result.filter(row => row.ttm_kcfj_net_profit != null).length,
            growthNodes: result.filter(row => row.ttm_kcfj_growth != null).length,
            sample: result.slice(-2).map(row => ({ report_date: row.source_report_date,
                ttm_kcfj_net_profit: row.ttm_kcfj_net_profit, ttm_kcfj_growth: row.ttm_kcfj_growth,
                profitFilled: row.ttm_kcfj_net_profit_filled, growthFilled: row.ttm_kcfj_growth_filled })) });
        return result;
    }, [rows]);
    const option = useMemo(() => {
        if (!nodes.length) return null;
        const dates = nodes.map(row => row.source_report_date);
        const formatProfit = value => value == null ? "-" : Math.round(Number(value) / 100000000) + " 亿";
        const formatGrowth = value => value == null ? "-" : Number(value).toFixed(2) + "%";
        return { animation: false, tooltip: baseTooltip(params => { const row = nodes[params[0]?.dataIndex]; if (!row) return "";
            const profit = row.ttm_kcfj_net_profit_filled ? formatProfit(row.ttm_kcfj_net_profit) + "（沿用上期）" : formatProfit(row.ttm_kcfj_net_profit);
            const growth = row.ttm_kcfj_growth_filled ? formatGrowth(row.ttm_kcfj_growth) + "（沿用上期）" : formatGrowth(row.ttm_kcfj_growth);
            return "<b>" + row.source_report_date + "</b><br/>TTM 扣非归母净利润：" + profit + "<br/>TTM 扣非增速：" + growth; }),
            legend: { top: 0, data: ["TTM 扣非归母净利润", "TTM 扣非增速"], textStyle: { color: AXIS } },
            grid: { left: 72, right: 72, top: 46, bottom: 50 }, xAxis: { type: "category", data: dates },
            yAxis: [{ ...valueAxis(0, value => Math.round(Number(value)) + " 亿"), name: "利润（亿）" }, { ...valueAxis(0, value => Number(value).toFixed(1) + "%"), name: "增速", position: "right" }],
            series: [{ name: "TTM 扣非归母净利润", type: "line", data: nodes.map(row => row.ttm_kcfj_net_profit == null ? null : Number(row.ttm_kcfj_net_profit) / 100000000), showSymbol: true, yAxisIndex: 0, lineStyle: { color: "#f97316" } },
                { name: "TTM 扣非增速", type: "line", data: nodes.map(row => row.ttm_kcfj_growth), showSymbol: true, yAxisIndex: 1, lineStyle: { color: "#10b981" } }]
        };
    }, [nodes]);
    const onEvents = useMemo(() => onDateChange ? ({ updateAxisPointer: event => {
        const axis = (event.axesInfo || []).find(item => item.axisDim === "x");
        const index = Number(axis && axis.value);
        if (Number.isInteger(index) && nodes[index]) onDateChange(nodes[index].source_report_date);
    } }) : {}, [onDateChange, nodes]);
    const activeDataIndex = activeDate ? nodes.reduce((found, row, index) => row.source_report_date <= activeDate ? index : found, -1) : null;
    return option ? <div>
        <div style={{ color: "#999", fontSize: 12, marginBottom: 2 }}>增速按当前 TTM 扣非归母净利润相对上一个财报节点计算。</div>
        <EChartView option={option} height={330} ariaLabel="财报期 TTM 扣非利润与增速图"
            onEvents={onEvents} activeDataIndex={activeDataIndex} />
    </div> : <div style={{ padding: 32, color: "#999" }}>暂无财报期数据</div>;
}

function MarketAmountChart({ rows, targets = [], activeDate, onRangeWheel, onDateChange }) {
    const valid = rows.filter(row => row.turnover_trillion != null || row.margin_trillion != null);
    const option = useMemo(() => {
        if (!valid.length) return null;
        const dates = valid.map(row => row.trade_date);
        return { animation: false, aria: { enabled: true }, axisPointer: { link: [{ xAxisIndex: "all" }] },
            tooltip: baseTooltip(params => { const row = valid[params[0] && params[0].dataIndex];
                const activityColor = financingActivityColor(row && row.financing_activity);
                const hasActivity = row && row.financing_activity != null;
                const activityType = row && row.financing_activity > 0 ? "融资买入" : row && row.financing_activity < 0 ? "融资偿还" : "持平";
                return row ? "<b>" + row.trade_date +
                '</b><br/><span style="color:#93c5fd">两市成交额：' + (row.turnover_trillion == null ? "-" : Number(row.turnover_trillion).toFixed(4) + " 万亿") +
                '</span><br/><span style="color:#d8b4fe">融资余额：' + (row.margin_trillion == null ? "-" : Number(row.margin_trillion).toFixed(4) + " 万亿") +
                '</span><br/><span style="color:' + activityColor + '">融资活跃度：' + (hasActivity
                    ? signed(row.financing_activity, 4) + "%（" + activityType + "，余额变化 " + signed(row.margin_change_trillion, 6) + " 万亿）"
                    : "-") + "</span>" : ""; }),
            legend: { top: 0, icon: "path://M0 4 L24 4 L24 6 L0 6 Z", itemWidth: 24, itemHeight: 8,
                data: ["两市成交额", "融资活跃度", "融资余额"], textStyle: { color: AXIS } },
            visualMap: { show: false, type: "piecewise", seriesIndex: 2, dimension: 1,
                // ECharts canvas line path uses the complementary piece color; symbols are hidden for this series.
                pieces: [{ gt: 0, color: FINANCING_NEGATIVE }, { value: 0, color: "#94a3b8" },
                    { lt: 0, color: FINANCING_POSITIVE }] },
            grid: [{ left: 66, right: 78, top: 44, height: "35%" }, { left: 66, right: 78, top: "57%", height: "30%" }],
            xAxis: [categoryAxis(dates, 0, false), categoryAxis(dates, 1, true)],
            yAxis: [valueAxis(0, value => Number(value).toFixed(2)), valueAxis(1, value => Number(value).toFixed(2)),
                { type: "value", scale: true, gridIndex: 0, position: "right", name: "融资活跃度",
                    min: value => Math.min(value.min, 0), max: value => Math.max(value.max, 0),
                    axisLabel: { color: AXIS, formatter: value => Number(value).toFixed(2) + "%" },
                    splitLine: { show: false } }],
            series: [{ name: "两市成交额", type: "line", data: valid.map(row => row.turnover_trillion), showSymbol: false, lineStyle: { color: "#3b82f6", width: 2 }, itemStyle: { color: "#3b82f6" }, areaStyle: { color: "rgba(59,130,246,.08)" } },
                { name: "融资余额", type: "line", xAxisIndex: 1, yAxisIndex: 1, data: valid.map(row => row.margin_trillion), showSymbol: false, lineStyle: { color: "#a855f7", width: 2 }, itemStyle: { color: "#a855f7" }, areaStyle: { color: "rgba(168,85,247,.08)" } },
                { name: "融资活跃度", type: "line", yAxisIndex: 2,
                    data: valid.map(row => [row.trade_date, row.financing_activity]), encode: { x: 0, y: 1 },
                    showSymbol: false, connectNulls: false,
                    lineStyle: { width: 1.8 }, markLine: { silent: true, symbol: "none", label: { show: false },
                        lineStyle: { color: "#94a3b8", width: 1, type: "dashed" }, data: [{ yAxis: 0 }] } },
                ...targets.map(target => target.metric === "margin_trillion" ? targetLine(target, 1, 1) : targetLine(target))]
        };
    }, [valid, targets]);
    const onEvents = useMemo(() => onDateChange ? ({
        updateAxisPointer: event => {
            const axis = (event.axesInfo || []).find(item => item.axisDim === "x" && Number(item.axisIndex) === 0);
            if (!axis) return;
            const numericIndex = Number(axis.value);
            const index = Number.isInteger(numericIndex) ? numericIndex
                : valid.findIndex(row => row.trade_date === String(axis.value));
            if (valid[index]) onDateChange(valid[index].trade_date);
        }
    }) : {}, [valid, onDateChange]);
    const activeDataIndex = activeDate ? valid.findIndex(row => row.trade_date === activeDate) : null;
    if (!option) return <div style={{ padding: 32, color: "#999" }}>当前范围暂无大盘金额数据</div>;
    return <EChartView option={option} height={490} ariaLabel="大盘金额走势图" onWheel={onRangeWheel}
        onEvents={onEvents} activeDataIndex={activeDataIndex} />;
}

export { FinancialDataChart, MarketAmountChart, StockKlineChart, ValuationChart };
