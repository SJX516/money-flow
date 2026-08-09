const TARGET_COLORS = [
    { name: "红色", value: "#ef4444" }, { name: "橙色", value: "#f97316" },
    { name: "琥珀", value: "#f59e0b" }, { name: "黄色", value: "#eab308" },
    { name: "绿色", value: "#22c55e" }, { name: "青绿", value: "#14b8a6" },
    { name: "青色", value: "#06b6d4" }, { name: "蓝色", value: "#3b82f6" },
    { name: "紫色", value: "#a855f7" }, { name: "灰色", value: "#6b7280" }
];

const STOCK_TARGET_METRICS = [
    { key: "price", name: "价格" }, { key: "pe", name: "PE" },
    { key: "pb", name: "PB" }, { key: "dividend_yield", name: "股息率（%）" }
];
const MARKET_TARGET_METRICS = [
    { key: "turnover_trillion", name: "两市成交额（万亿）" },
    { key: "margin_trillion", name: "融资余额（万亿）" }
];

function targetMetrics(scopeCode) {
    return scopeCode === "MARKET" ? MARKET_TARGET_METRICS : STOCK_TARGET_METRICS;
}

function targetMetricName(scopeCode, metric) {
    const definition = targetMetrics(scopeCode).find(item => item.key === metric);
    return definition ? definition.name : metric;
}

export { MARKET_TARGET_METRICS, STOCK_TARGET_METRICS, TARGET_COLORS, targetMetricName, targetMetrics };
