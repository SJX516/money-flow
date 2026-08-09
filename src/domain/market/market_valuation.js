function roundValue(value) {
    return Number.isFinite(value) ? Number(value.toFixed(4)) : null
}

function deriveDailyValuation(dailyRows, valuationRows) {
    const daily = [...(dailyRows || [])].sort((a, b) =>
        String(a.trade_date || a.date).localeCompare(String(b.trade_date || b.date)))
    const nodes = [...(valuationRows || [])].sort((a, b) =>
        String(a.report_date || a.date).localeCompare(String(b.report_date || b.date)))
    if(!daily.length || !nodes.length) return []

    const nearestClose = date => {
        let value = null
        for(const row of daily) {
            const rowDate = row.trade_date || row.date
            if(rowDate > date) break
            const close = Number(row.close)
            if(Number.isFinite(close) && close > 0) value = close
        }
        return value
    }
    const fundamentals = { earnings: null, bookValue: null, dividendPerShare: null }
    const snapshots = nodes.map(node => {
        const reportDate = node.report_date || node.date
        const close = nearestClose(reportDate)
        const pe = Number(node.pe)
        const pb = Number(node.pb)
        const dividendYield = Number(node.dividend_yield ?? node.dividendYield)
        const peFilled = Boolean(node.pe_filled ?? node.peFilled)
        const pbFilled = Boolean(node.pb_filled ?? node.pbFilled)
        const dividendFilled = Boolean(node.dividend_filled ?? node.dividendFilled)
        if(close > 0 && pe > 0 && !peFilled) fundamentals.earnings = close / pe
        if(close > 0 && pb > 0 && !pbFilled) fundamentals.bookValue = close / pb
        if(close > 0 && dividendYield >= 0 && !dividendFilled) {
            fundamentals.dividendPerShare = close * dividendYield / 100
        }
        return {
            reportDate,
            earnings: fundamentals.earnings,
            bookValue: fundamentals.bookValue,
            dividendPerShare: fundamentals.dividendPerShare
        }
    })

    let nodeIndex = -1
    return daily.map(row => {
        const tradeDate = row.trade_date || row.date
        while(nodeIndex + 1 < snapshots.length && snapshots[nodeIndex + 1].reportDate <= tradeDate) nodeIndex += 1
        if(nodeIndex < 0) return null
        const close = Number(row.close)
        const snapshot = snapshots[nodeIndex]
        return {
            report_date: tradeDate,
            source_report_date: snapshot.reportDate,
            approximate: true,
            pe: close > 0 && snapshot.earnings > 0 ? roundValue(close / snapshot.earnings) : null,
            pb: close > 0 && snapshot.bookValue > 0 ? roundValue(close / snapshot.bookValue) : null,
            dividend_yield: close > 0 && snapshot.dividendPerShare != null
                ? roundValue(snapshot.dividendPerShare / close * 100) : null
        }
    }).filter(Boolean)
}

export { deriveDailyValuation };
