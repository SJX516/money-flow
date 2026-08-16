function round(value, digits) {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function calculateFinancingActivity(rows) {
    return (rows || []).map((row, index) => {
        const currentMargin = row.margin_trillion == null ? null : Number(row.margin_trillion);
        const previousValue = index > 0 ? rows[index - 1].margin_trillion : null;
        const previousMargin = previousValue == null ? null : Number(previousValue);
        const turnover = row.turnover_trillion == null ? null : Number(row.turnover_trillion);
        const hasMarginChange = currentMargin != null && previousMargin != null &&
            Number.isFinite(currentMargin) && Number.isFinite(previousMargin);
        const marginChange = hasMarginChange ? currentMargin - previousMargin : null;
        return {
            ...row,
            margin_change_trillion: round(marginChange, 6),
            financing_activity: hasMarginChange && turnover != null && Number.isFinite(turnover) && turnover > 0
                ? round(marginChange / turnover * 100, 4) : null
        };
    });
}

export { calculateFinancingActivity };
