const DAY = 86400000;
const TRADE_PRICE_MAX_DEVIATION = 0.2;

function dateToDay(date) {
    const value = new Date(date + "T00:00:00Z").getTime();
    return Number.isFinite(value) ? Math.floor(value / DAY) : 0;
}

function dayToDate(day) {
    return new Date(day * DAY).toISOString().slice(0, 10);
}

function compactNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    if (Math.abs(number) >= 100000000) return (number / 100000000).toFixed(2) + " 亿";
    if (Math.abs(number) >= 10000) return (number / 10000).toFixed(2) + " 万";
    return number.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function presetDateRange(minDate, maxDate, months) {
    if (months == null) return [minDate, maxDate];
    const end = new Date(maxDate + "T00:00:00Z");
    const day = end.getUTCDate();
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() - months);
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
    end.setUTCDate(Math.min(day, lastDay));
    const startDate = end.toISOString().slice(0, 10);
    return [startDate < minDate ? minDate : startDate, maxDate];
}

function mapTradesToRows(rows, trades) {
    if (!rows.length) return [];
    const dates = rows.map(row => row.trade_date);
    const firstDate = new Date(dates[0] + "T00:00:00Z");
    return trades.filter(trade => trade.date <= dates[dates.length - 1]).map(trade => {
        let index = dates.indexOf(trade.date);
        if (index < 0) index = dates.findIndex(date => date >= trade.date);
        if (index < 0) return null;
        if (trade.date < dates[0]) {
            const gapDays = (firstDate - new Date(trade.date + "T00:00:00Z")) / DAY;
            if (gapDays > 7) return null;
        }
        const row = rows[index];
        const close = Number(row.close);
        const price = Number(trade.price);
        const hasPrice = trade.price != null && Number.isFinite(price) && price > 0;
        const markerAdjusted = hasPrice && Number.isFinite(close) && close > 0
            && Math.abs(price - close) / close > TRADE_PRICE_MAX_DEVIATION;
        let markerPrice = hasPrice ? price : close;
        if(markerAdjusted) {
            const candleEdge = trade.type === "buy" ? Number(row.low) : Number(row.high);
            markerPrice = Number.isFinite(candleEdge) ? candleEdge : close;
        }
        return { ...trade, index, chartDate: dates[index], markerPrice, markerAdjusted };
    }).filter(Boolean);
}

function zoomDateRange(minDate, maxDate, startDate, endDate, deltaY, anchor = 0.5) {
    const min = dateToDay(minDate);
    const max = dateToDay(maxDate);
    const start = Math.max(min, dateToDay(startDate));
    const end = Math.min(max, dateToDay(endDate));
    const span = Math.max(1, end - start);
    const nextSpan = Math.max(14, Math.min(max - min, Math.round(span * (deltaY < 0 ? 0.8 : 1.25))));
    let nextStart = Math.round(start + span * anchor - nextSpan * anchor);
    let nextEnd = nextStart + nextSpan;
    if (nextStart < min) { nextEnd += min - nextStart; nextStart = min; }
    if (nextEnd > max) { nextStart -= nextEnd - max; nextEnd = max; }
    return [dayToDate(Math.max(min, nextStart)), dayToDate(Math.min(max, nextEnd))];
}

export { compactNumber, dateToDay, dayToDate, mapTradesToRows, presetDateRange, zoomDateRange };
