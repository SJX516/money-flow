import React, { useMemo } from "react";
import { compactNumber, mapTradesToRows } from "./chart_utils";
import EChartView from "./echart_view";

const UP = "#ef4444";
const DOWN = "#22c55e";
const BUY = "#8b5cf6";
const SELL = "#ff2d95";
const AXIS = "#718096";
const GRID = "#edf0f5";

function money(value) {
    return "¥" + Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function StockKlineChart({ rows, trades = [], targets = [], onRangeWheel }) {
    const option = useMemo(() => {
        if (!rows.length) return null;
        const dates = rows.map(row => row.trade_date);
        const visibleTrades = mapTradesToRows(rows, trades);
        const tradesByIndex = new Map();
        visibleTrades.forEach(trade => tradesByIndex.set(trade.index, [...(tradesByIndex.get(trade.index) || []), trade]));
        const tooltip = params => {
            const index = params[0] && params[0].dataIndex;
            const row = rows[index];
            if (!row) return "";
            const tradeLines = (tradesByIndex.get(index) || []).map(trade =>
                '<div style="margin-top:5px;color:' + (trade.type === "buy" ? BUY : SELL) + '"><b>' +
                (trade.type === "buy" ? "买入" : "卖出") + "</b>　价格 " + (trade.price == null ? "未知" : money(trade.price)) +
                "<br/>数量 " + (trade.count == null ? "未知" : compactNumber(trade.count) + " 股") + "　金额 " + money(trade.amount) + "</div>").join("");
            return "<b>" + row.trade_date + "</b><br/>开 " + Number(row.open).toFixed(2) + "　高 " + Number(row.high).toFixed(2) +
                "<br/>低 " + Number(row.low).toFixed(2) + "　收 " + Number(row.close).toFixed(2) +
                '<br/><span style="color:#1677ff">MA5 ' + (row.ma5 == null ? "-" : Number(row.ma5).toFixed(2)) + '</span>　<span style="color:#fa8c16">MA30 ' + (row.ma30 == null ? "-" : Number(row.ma30).toFixed(2)) +
                '</span><br/><span style="color:#8c8c8c">成交量 ' + compactNumber(row.volume) + "</span>" + tradeLines;
        };
        const tradeTip = param => { const trade = param.data.trade;
            return "<b>" + (trade.type === "buy" ? "买入" : "卖出") + " · " + trade.date + "</b><br/>价格 " + (trade.price == null ? "未知" : money(trade.price)) +
                "<br/>数量 " + (trade.count == null ? "未知" : compactNumber(trade.count) + " 股") + "<br/>金额 " + money(trade.amount); };
        return {
            animation: false, aria: { enabled: true }, tooltip: baseTooltip(tooltip), axisPointer: { link: [{ xAxisIndex: "all" }] },
            legend: { top: 0, icon: "path://M0 4 L24 4 L24 6 L0 6 Z", itemWidth: 24, itemHeight: 8, data: ["MA5", "MA30", "成交量"], textStyle: { color: AXIS } },
            grid: [{ left: 64, right: 28, top: 48, height: "61%" }, { left: 64, right: 28, top: "76%", height: "13%" }],
            xAxis: [categoryAxis(dates, 0, false), categoryAxis(dates, 1, true)],
            yAxis: [valueAxis(0), valueAxis(1, value => compactNumber(value))],
            series: [{ name: "K线", type: "candlestick", data: rows.map(row => [row.open, row.close, row.low, row.high]),
                itemStyle: { color: UP, color0: DOWN, borderColor: UP, borderColor0: DOWN },
                markPoint: { symbolSize: 21, label: { color: "#fff", fontWeight: "bold", fontSize: 9 },
                    tooltip: { trigger: "item", formatter: tradeTip }, data: visibleTrades.map(trade => ({
                    name: trade.type === "buy" ? "买入" : "卖出", coord: [trade.chartDate, trade.markerPrice], value: trade.type === "buy" ? "B" : "S",
                    symbol: "triangle", symbolRotate: trade.type === "buy" ? 0 : 180,
                    itemStyle: { color: trade.type === "buy" ? BUY : SELL, borderColor: "#fff", borderWidth: 1 }, trade
                })) } },
            { name: "MA5", type: "line", data: rows.map(row => row.ma5), showSymbol: false, lineStyle: { width: 1.4, color: "#1677ff" }, itemStyle: { color: "#1677ff" } },
            { name: "MA30", type: "line", data: rows.map(row => row.ma30), showSymbol: false, lineStyle: { width: 1.4, color: "#fa8c16" }, itemStyle: { color: "#fa8c16" } },
            { name: "成交量", type: "bar", xAxisIndex: 1, yAxisIndex: 1, itemStyle: { color: "#8c8c8c" }, data: rows.map(row => ({ value: row.volume,
                itemStyle: { color: row.close >= row.open ? "#fca5a5" : "#86efac" } })), barMaxWidth: 8 },
            ...targets.filter(target => target.metric === "price").map(target => targetLine(target))]
        };
    }, [rows, trades, targets]);
    if (!option) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>当前范围没有日 K 数据</div>;
    return <EChartView option={option} height={530} ariaLabel="股票蜡烛 K 线图" onWheel={onRangeWheel} />;
}

function ValuationChart({ rows, metrics, targets = [] }) {
    const option = useMemo(() => {
        const definitions = [
            { key: "pe", field: "pe", name: "PE", color: "#722ed1", axis: 0 },
            { key: "pb", field: "pb", name: "PB", color: "#1677ff", axis: 1 },
            { key: "dividend", field: "dividend_yield", name: "股息率（%）", color: "#13c2c2", axis: 2 }
        ];
        const selected = definitions.filter(item => metrics.includes(item.key));
        const valid = rows.filter(row => selected.some(item => row[item.field] != null));
        if (!selected.length || !valid.length) return null;
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
                return "<b>" + row.report_date + "</b><br/>" + selected.map(metric =>
                    '<span style="color:' + metric.color + '">●</span> ' + metric.name + "：" +
                    (row[metric.field] == null ? "-" : Number(row[metric.field]).toFixed(2))).join("<br/>") +
                    '<br/><span style="color:#9ca3af">基于 ' + row.source_report_date + " 财报期数据近似计算</span>";
            }),
            legend: { top: 0, icon: "path://M0 4 L24 4 L24 6 L0 6 Z", itemWidth: 24, itemHeight: 8,
                data: selected.map(item => item.name), textStyle: { color: AXIS } },
            grid: { left: 64, right: 125, top: 46, bottom: 50 },
            xAxis: { type: "category", data: dates, axisLabel: { color: AXIS }, axisPointer: { type: "shadow" } },
            yAxis: [
                { ...valueAxis(0), name: "PE", nameTextStyle: { color: "#722ed1" } },
                { ...valueAxis(0), name: "PB", position: "right", nameTextStyle: { color: "#1677ff" } },
                { ...valueAxis(0, value => Number(value).toFixed(1) + "%"), name: "股息率", position: "right",
                    offset: 58, nameTextStyle: { color: "#13c2c2" } }
            ],
            series: [...series, ...targets.filter(target => selected.some(metric => metric.field === target.metric))
                .map(target => targetLine(target, definitions.find(metric => metric.field === target.metric).axis))]
        };
    }, [rows, metrics, targets]);
    if (!metrics.length) return <div style={{ padding: 32, color: "#999" }}>请至少选择一项估值指标</div>;
    if (!option) return <div style={{ padding: 32, color: "#999" }}>当前范围没有可用估值数据</div>;
    return <div>
        <div style={{ color: "#999", fontSize: 12, marginBottom: 2 }}>
            每日估值根据最近一期财报指标与当日收盘价近似计算，不会写入行情数据库。
        </div>
        <EChartView option={option} height={390} ariaLabel="每日 PE、PB 与股息率综合图" />
    </div>;
}

function MarketAmountChart({ rows, targets = [], onRangeWheel }) {
    const valid = rows.filter(row => row.turnover_trillion != null || row.margin_trillion != null);
    const option = useMemo(() => {
        if (!valid.length) return null;
        const dates = valid.map(row => row.trade_date);
        return { animation: false, aria: { enabled: true }, axisPointer: { link: [{ xAxisIndex: "all" }] },
            tooltip: baseTooltip(params => { const row = valid[params[0] && params[0].dataIndex]; return row ? "<b>" + row.trade_date +
                '</b><br/><span style="color:#93c5fd">两市成交额：' + (row.turnover_trillion == null ? "-" : Number(row.turnover_trillion).toFixed(4) + " 万亿") +
                '</span><br/><span style="color:#d8b4fe">融资余额：' + (row.margin_trillion == null ? "-" : Number(row.margin_trillion).toFixed(4) + " 万亿") + "</span>" : ""; }),
            legend: { top: 0, icon: "path://M0 4 L24 4 L24 6 L0 6 Z", itemWidth: 24, itemHeight: 8, data: ["两市成交额", "融资余额"], textStyle: { color: AXIS } },
            grid: [{ left: 66, right: 28, top: 44, height: "35%" }, { left: 66, right: 28, top: "57%", height: "30%" }],
            xAxis: [categoryAxis(dates, 0, false), categoryAxis(dates, 1, true)],
            yAxis: [valueAxis(0, value => Number(value).toFixed(2)), valueAxis(1, value => Number(value).toFixed(2))],
            series: [{ name: "两市成交额", type: "line", data: valid.map(row => row.turnover_trillion), showSymbol: false, lineStyle: { color: "#3b82f6", width: 2 }, itemStyle: { color: "#3b82f6" }, areaStyle: { color: "rgba(59,130,246,.08)" } },
                { name: "融资余额", type: "line", xAxisIndex: 1, yAxisIndex: 1, data: valid.map(row => row.margin_trillion), showSymbol: false, lineStyle: { color: "#a855f7", width: 2 }, itemStyle: { color: "#a855f7" }, areaStyle: { color: "rgba(168,85,247,.08)" } },
                ...targets.map(target => target.metric === "margin_trillion" ? targetLine(target, 1, 1) : targetLine(target))]
        };
    }, [valid, targets]);
    if (!option) return <div style={{ padding: 32, color: "#999" }}>当前范围暂无大盘金额数据</div>;
    return <EChartView option={option} height={490} ariaLabel="大盘金额走势图" onWheel={onRangeWheel} />;
}

export { MarketAmountChart, StockKlineChart, ValuationChart };
