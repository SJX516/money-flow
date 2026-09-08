// ECharts 的轴提示参数只包含当前图例中启用的系列。
export function valuationTooltip(params, rows, metrics) {
    const row = rows[params[0] && params[0].dataIndex];
    if (!row) return "";
    const visible = metrics.filter(metric => params.some(param => param.seriesName === metric.name));
    return "<b>" + row.report_date + "</b><br/>" + visible.map(metric =>
        '<span style="color:' + metric.color + '">●</span> ' + metric.name + "：" +
        (row[metric.field] == null ? "-" : Number(row[metric.field]).toFixed(2) +
            (metric.key === "dividend" ? "%" : ""))).join("<br/>") +
        '<br/><span style="color:#9ca3af">基于 ' + row.source_report_date + " 财报期 TTM 数据计算</span>";
}
