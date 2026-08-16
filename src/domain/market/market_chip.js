const CHIP_BIN_COUNT = 150;
const CHIP_WINDOW_DAYS = 210;

function rowDate(row) {
    return row.trade_date || row.date;
}

function round(value, digits = 4) {
    return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function calculateAtIndex(ordered, selectedIndex, includeDetails) {
    const selected = ordered[selectedIndex];
    const selectedDate = rowDate(selected);
    const windowRows = ordered.slice(Math.max(0, selectedIndex - CHIP_WINDOW_DAYS + 1), selectedIndex + 1);
    const missingTurnover = windowRows.some(row => {
        const value = Number(row.turnover_rate ?? row.turnoverRate);
        return (row.turnover_rate == null && row.turnoverRate == null) || !Number.isFinite(value) || value < 0;
    });
    if (missingTurnover) return { status: "missing-turnover", date: selectedDate, close: Number(selected.close) };

    const highest = Math.max(...windowRows.map(row => Number(row.high)));
    const lowest = Math.min(...windowRows.map(row => Number(row.low)));
    if (!Number.isFinite(highest) || !Number.isFinite(lowest)) return null;
    const accuracy = Math.max(0.01, (highest - lowest) / (CHIP_BIN_COUNT - 1));
    const chips = Array(CHIP_BIN_COUNT).fill(0);

    windowRows.forEach(row => {
        const open = Number(row.open);
        const close = Number(row.close);
        const high = Number(row.high);
        const low = Number(row.low);
        const average = (open + close + high + low) / 4;
        const turnover = Math.min(1, Number(row.turnover_rate ?? row.turnoverRate) / 100);
        const highIndex = Math.min(CHIP_BIN_COUNT - 1, Math.floor((high - lowest) / accuracy));
        const lowIndex = Math.max(0, Math.ceil((low - lowest) / accuracy));
        for (let index = 0; index < chips.length; index++) chips[index] *= 1 - turnover;

        if (high === low) {
            const index = Math.max(0, Math.min(CHIP_BIN_COUNT - 1, Math.floor((average - lowest) / accuracy)));
            chips[index] += (CHIP_BIN_COUNT - 1) * turnover / 2;
            return;
        }
        const peak = 2 / (high - low);
        for (let index = lowIndex; index <= highIndex; index++) {
            const price = lowest + accuracy * index;
            if (price <= average) {
                chips[index] += Math.abs(average - low) < 1e-8
                    ? peak * turnover : (price - low) / (average - low) * peak * turnover;
            } else {
                chips[index] += Math.abs(high - average) < 1e-8
                    ? peak * turnover : (high - price) / (high - average) * peak * turnover;
            }
        }
    });

    const total = chips.reduce((sum, value) => sum + value, 0);
    if (!(total > 0)) return { status: "empty", date: selectedDate, close: Number(selected.close) };
    const costAt = percentile => {
        const target = total * percentile;
        let cumulative = 0;
        for (let index = 0; index < chips.length; index++) {
            cumulative += chips[index];
            if (cumulative >= target) return lowest + accuracy * index;
        }
        return highest;
    };
    const close = Number(selected.close);
    const profitable = chips.reduce((sum, value, index) =>
        close >= lowest + accuracy * index ? sum + value : sum, 0);
    const summary = {
        status: "ready", date: selectedDate, close,
        profitRatio: round(profitable / total * 100, 2),
        medianCost: round(costAt(0.5), 2)
    };
    if (!includeDetails) return summary;
    const costBand = percent => {
        const low = costAt((1 - percent) / 2);
        const high = costAt((1 + percent) / 2);
        return {
            low: round(low, 2), high: round(high, 2),
            concentration: low + high > 0 ? round((high - low) / (high + low) * 100, 2) : null
        };
    };
    const points = chips.map((value, index) => ({
        price: round(lowest + accuracy * index, 2),
        percent: round(value / total * 100, 4)
    }));
    return {
        ...summary, points,
        cost70: costBand(0.7), cost90: costBand(0.9)
    };
}

function calculateChipDistribution(rows, selectedDate) {
    const ordered = [...(rows || [])].sort((a, b) => rowDate(a).localeCompare(rowDate(b)));
    const selectedIndex = ordered.findIndex(row => rowDate(row) === selectedDate);
    return selectedIndex < 0 ? null : calculateAtIndex(ordered, selectedIndex, true);
}

function calculateChipTrend(rows, visibleDates) {
    const ordered = [...(rows || [])].sort((a, b) => rowDate(a).localeCompare(rowDate(b)));
    const indexByDate = new Map(ordered.map((row, index) => [rowDate(row), index]));
    return (visibleDates || []).map(date => {
        const index = indexByDate.get(date);
        if (index == null) return { date, medianCost: null, profitRatio: null };
        const result = calculateAtIndex(ordered, index, false);
        return result && result.status === "ready" ? result
            : { date, status: result && result.status, medianCost: null, profitRatio: null };
    });
}

export { CHIP_WINDOW_DAYS, calculateChipDistribution, calculateChipTrend };
