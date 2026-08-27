const JSONP_TIMEOUT = 30000;
const INDEX_CODE_ALIASES = { "1A0001": "000001.SH" };

function normalizeStockCode(input) {
    const raw = String(input || "").trim().toUpperCase();
    const matched = raw.match(/^(\d{6})(?:\.(SH|SZ))?$/);
    if (!matched) throw new Error("股票代码必须是 6 位数字，例如 600519.SH");
    const digits = matched[1];
    let market = matched[2];
    if (!market) {
        if (/^[569]/.test(digits)) market = "SH";
        else if (/^[0123]/.test(digits)) market = "SZ";
        else throw new Error("目前仅支持沪深 A 股");
    }
    if ((market === "SH" && !/^[569]/.test(digits)) || (market === "SZ" && !/^[0123]/.test(digits))) {
        throw new Error("股票代码与市场后缀不匹配");
    }
    return digits + "." + market;
}

function normalizeSecurityCode(input) {
    const raw = String(input || "").trim().toUpperCase();
    if (/^\d{6}\.(SH|SZ|BJ)$/.test(raw)) return raw;
    return normalizeStockCode(raw);
}

function normalizeIndexCode(input) {
    const raw = String(input || "").trim().toUpperCase();
    if (INDEX_CODE_ALIASES[raw]) return INDEX_CODE_ALIASES[raw];
    const matched = raw.match(/^(\d{6})(?:\.(SH|SZ|BJ))?$/);
    if (!matched) throw new Error("指数代码必须是 6 位字母或数字，例如 1A0001、000688");
    const market = matched[2] || (matched[1].startsWith("399") ? "SZ" : matched[1].startsWith("899") ? "BJ" : "SH");
    return matched[1] + "." + market;
}

function jsonp(url, callbackParam = "callback") {
    return new Promise((resolve, reject) => {
        const callbackName = "moneyFlowJsonp" + Date.now() + Math.random().toString(16).slice(2);
        const separator = url.includes("?") ? "&" : "?";
        const script = document.createElement("script");
        const cleanup = () => {
            clearTimeout(timer);
            script.remove();
            delete window[callbackName];
        };
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error("行情接口请求超时"));
        }, JSONP_TIMEOUT);
        window[callbackName] = data => {
            cleanup();
            if (data && data.success === false) reject(new Error(data.message || "行情接口返回失败"));
            else resolve(data);
        };
        script.onerror = () => {
            cleanup();
            reject(new Error("行情接口不可用，请稍后重试"));
        };
        script.src = url + separator + callbackParam + "=" + callbackName;
        document.head.appendChild(script);
    });
}

function eastmoneyUrl(host, params) {
    const query = new URLSearchParams(params);
    return host + "?" + query.toString();
}

async function fetchStockInfo(code) {
    const normalized = normalizeStockCode(code);
    const now = new Date();
    const endDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const start = new Date(endDate + "T00:00:00Z");
    start.setUTCDate(start.getUTCDate() - 370);
    const info = await fetchTencentKline(normalized, start.toISOString().slice(0, 10), endDate);
    return { code: normalized, name: info.name };
}

async function fetchIndexInfo(code) {
    const normalized = normalizeIndexCode(code);
    const now = new Date();
    const endDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const start = new Date(endDate + "T00:00:00Z");
    start.setUTCDate(start.getUTCDate() - 370);
    const info = await fetchTencentKline(normalized, start.toISOString().slice(0, 10), endDate);
    return { code: normalized, name: info.name };
}

function splitDateRange(startDate, endDate, chunkDays = 700) {
    const ranges = [];
    let cursor = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");
    if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) {
        throw new Error("日期范围无效");
    }
    while (cursor <= end) {
        const chunkEnd = new Date(Math.min(end.getTime(), cursor.getTime() + (chunkDays - 1) * 86400000));
        ranges.push([cursor.toISOString().slice(0, 10), chunkEnd.toISOString().slice(0, 10)]);
        cursor = new Date(chunkEnd.getTime() + 86400000);
    }
    return ranges;
}

async function fetchTencentKlineChunk(symbol, startDate, endDate) {
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 40;
    const limit = Math.max(60, Math.min(800, days));
    const url = "https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param=" +
        [symbol, "day", startDate, endDate, limit, "qfq"].join(",");
    const response = await fetch(url);
    if (!response.ok) throw new Error("腾讯行情请求失败：" + response.status);
    const payload = await response.json();
    if (payload.msg === "param error") throw new Error("腾讯行情请求参数错误");
    const node = payload.data && payload.data[symbol];
    return { node, rows: (node && (node.qfqday || node.day)) || [] };
}

async function fetchTencentKline(code, startDate, endDate) {
    const normalized = normalizeSecurityCode(code);
    const [digits, market] = normalized.split(".");
    const symbol = market.toLowerCase() + digits;
    const chunks = await Promise.all(splitDateRange(startDate, endDate).map(range =>
        fetchTencentKlineChunk(symbol, range[0], range[1])));
    const node = chunks.find(chunk => chunk.node)?.node;
    const rowsByDate = new Map();
    chunks.forEach(chunk => chunk.rows.forEach(row => rowsByDate.set(row[0], row)));
    const rawRows = Array.from(rowsByDate.values()).sort((a, b) => a[0].localeCompare(b[0]));
    if (!rawRows.length) throw new Error("未找到 " + normalized + " 的日 K 数据");
    return {
        code: normalized,
        name: node.qt && node.qt[symbol] ? node.qt[symbol][1] : normalized,
        rows: rawRows.map(row => ({
            date: row[0], open: Number(row[1]), close: Number(row[2]),
            high: Number(row[3]), low: Number(row[4]), volume: Number(row[5]),
            turnoverRate: Number.isFinite(Number(row[7])) ? Number(row[7]) : null,
            amount: Number.isFinite(Number(row[8])) ? Number(row[8]) * 10000 : null
        })).filter(row => row.date >= startDate && row.date <= endDate)
    };
}

async function fetchFinancialReports(code) {
    const url = eastmoneyUrl("https://datacenter.eastmoney.com/securities/api/data/get", {
        type: "RPT_F10_FINANCE_MAINFINADATA", sty: "APP_F10_MAINFINADATA", quoteColumns: "",
        filter: '(SECUCODE="' + code + '")', p: "1", ps: "200", sr: "-1", st: "REPORT_DATE",
        source: "HSF10", client: "PC"
    });
    const payload = await jsonp(url);
    return payload.result ? payload.result.data || [] : [];
}

async function fetchDividendReports(code) {
    const digits = code.slice(0, 6);
    const url = eastmoneyUrl("https://datacenter-web.eastmoney.com/api/data/v1/get", {
        sortColumns: "REPORT_DATE", sortTypes: "-1", pageSize: "500", pageNumber: "1",
        reportName: "RPT_SHAREBONUS_DET", columns: "ALL", quoteColumns: "", source: "WEB",
        client: "WEB", filter: '(SECURITY_CODE="' + digits + '")'
    });
    const payload = await jsonp(url);
    return payload.result ? payload.result.data || [] : [];
}

function calculateMovingAverages(rows) {
    return rows.map((row, index) => {
        const average = window => {
            if (index + 1 < window) return null;
            const values = rows.slice(index + 1 - window, index + 1);
            return Number((values.reduce((sum, item) => sum + item.close, 0) / window).toFixed(4));
        };
        return { ...row, ma5: average(5), ma30: average(30) };
    });
}

function nearestClose(rows, date) {
    let close = null;
    for (const row of rows) {
        if (row.date > date) break;
        close = row.close;
    }
    return close;
}

function datePart(value) {
    return String(value || "").slice(0, 10);
}

function shiftYear(date, years) {
    const value = new Date(date + "T00:00:00Z");
    value.setUTCFullYear(value.getUTCFullYear() + years);
    return value.toISOString().slice(0, 10);
}

function numberValue(value) {
    if (value == null || value === "") return NaN;
    return Number(String(value).replace(/,/g, ""));
}

function kcfjValue(row) {
    const key = Object.keys(row || {}).find(name => /^KCFJCXSYJLR?$/.test(name) || name === "KCFJCX_NET_PROFIT");
    return numberValue(key ? row[key] : null);
}

function buildTtmEps(financialRows) {
    const byDate = new Map();
    financialRows.forEach(row => {
        const date = datePart(row.REPORT_DATE);
        if (date && !byDate.has(date)) byDate.set(date, row);
    });
    const result = new Map();
    byDate.forEach((row, date) => {
        const current = Number(row.EPSJB);
        if (!Number.isFinite(current)) return;
        if (date.slice(5) === "12-31") {
            result.set(date, current);
            return;
        }
        const previousYear = String(Number(date.slice(0, 4)) - 1);
        const previousAnnual = byDate.get(previousYear + "-12-31");
        const previousPeriod = byDate.get(previousYear + date.slice(4));
        const annualEps = Number(previousAnnual && previousAnnual.EPSJB);
        const periodEps = Number(previousPeriod && previousPeriod.EPSJB);
        if (Number.isFinite(annualEps) && Number.isFinite(periodEps)) {
            result.set(date, current + annualEps - periodEps);
        }
    });
    return result;
}

function buildTtmKcfj(financialRows) {
    const byDate = new Map();
    financialRows.forEach(row => { const date = datePart(row.REPORT_DATE); if (date && !byDate.has(date)) byDate.set(date, row); });
    const values = new Map();
    byDate.forEach((row, date) => {
        const current = kcfjValue(row);
        if (!Number.isFinite(current)) return;
        let ttm = current;
        if (date.slice(5) !== "12-31") {
            const y = String(Number(date.slice(0, 4)) - 1);
            const annualRow = byDate.get(y + "-12-31");
            const priorRow = byDate.get(y + date.slice(4));
            const annual = kcfjValue(annualRow);
            const prior = kcfjValue(priorRow);
            if (!Number.isFinite(annual) || !Number.isFinite(prior)) return;
            ttm = current + annual - prior;
        }
        values.set(date, ttm);
    });
    const result = new Map();
    const dates = [...values.keys()].sort();
    dates.forEach((date, index) => {
        const value = values.get(date);
        const previous = index > 0 ? values.get(dates[index - 1]) : null;
        result.set(date, { value, growth: Number.isFinite(previous) && previous !== 0 ? (value / previous - 1) * 100 : null });
    });
    return result;
}

function buildCashDividends(dividendRows) {
    if (!Array.isArray(dividendRows)) return null;
    return dividendRows.map(row => ({
        date: datePart(row.EX_DIVIDEND_DATE),
        perShare: Number(row.PRETAX_BONUS_RMB) / 10,
        progress: String(row.ASSIGN_PROGRESS || "")
    })).filter(row => row.date && Number.isFinite(row.perShare) && row.perShare > 0 &&
        (!row.progress || row.progress.includes("实施")));
}

function buildValuationRows(dailyRows, financialRows, dividendRows, startDate, endDate) {
    const ttmEps = buildTtmEps(financialRows);
    const ttmKcfj = buildTtmKcfj(financialRows);
    const cashDividends = buildCashDividends(dividendRows);
    const sourceRows = financialRows.map(row => {
        const date = datePart(row.REPORT_DATE);
        const close = nearestClose(dailyRows, date);
        const eps = ttmEps.get(date);
        const kcfj = ttmKcfj.get(date);
        const bps = Number(row.BPS);
        const dividendPerShare = cashDividends == null ? null : cashDividends
            .filter(item => item.date > shiftYear(date, -1) && item.date <= date)
            .reduce((sum, item) => sum + item.perShare, 0);
        return {
            date,
            pe: close > 0 && eps > 0 ? close / eps : null,
            pb: close > 0 && bps > 0 ? close / bps : null,
            dividendYield: close > 0 && dividendPerShare != null ? dividendPerShare / close * 100 : null,
            ttmKcfjNetProfit: kcfj?.value ?? null, ttmKcfjGrowth: kcfj?.growth ?? null
        };
    }).filter(row => row.date >= startDate && row.date <= endDate).sort((a, b) => a.date.localeCompare(b.date));
    const previous = { pe: null, pb: null, dividendYield: null, ttmKcfjNetProfit: null, ttmKcfjGrowth: null };
    return sourceRows.map(row => {
        const output = { ...row };
        for (const field of ["pe", "pb", "dividendYield", "ttmKcfjNetProfit", "ttmKcfjGrowth"]) {
            const flag = field === "dividendYield" ? "dividendFilled" : field + "Filled";
            output[flag] = output[field] == null && previous[field] != null;
            if (output[flag]) output[field] = previous[field];
            if (output[field] != null) previous[field] = output[field];
            if (output[field] != null) output[field] = Number(output[field].toFixed(4));
        }
        return output;
    });
}

async function fetchStockHistory(code, startDate, endDate, onProgress = () => {}) {
    const normalized = normalizeStockCode(code);
    onProgress("正在获取前复权日 K…");
    const kline = await fetchTencentKline(normalized, startDate, endDate);
    onProgress("正在获取财报期估值…");
    const results = await Promise.allSettled([
        fetchFinancialReports(normalized), fetchDividendReports(normalized)
    ]);
    const warnings = [];
    const financialRows = results[0].status === "fulfilled" ? results[0].value : [];
    const dividendRows = results[1].status === "fulfilled" ? results[1].value : null;
    if (results[0].status === "rejected") warnings.push("PE/PB 财报数据暂时不可用");
    if (results[1].status === "rejected") warnings.push("股息率数据暂时不可用");
    const dailyRows = calculateMovingAverages(kline.rows);
    return {
        code: normalized,
        name: kline.name,
        dailyRows,
        valuationRows: buildValuationRows(dailyRows, financialRows, dividendRows, startDate, endDate),
        warnings
    };
}

async function fetchIndexHistory(code, startDate, endDate, onProgress = () => {}) {
    const normalized = normalizeIndexCode(code);
    onProgress("正在获取指数日 K…");
    const kline = await fetchTencentKline(normalized, startDate, endDate);
    return {
        code: normalized,
        name: kline.name,
        dailyRows: calculateMovingAverages(kline.rows),
        valuationRows: [],
        warnings: []
    };
}

function buildMarketRow(row) {
    const tradeAmount = Number(row.MARGIN_TRADE_AMT);
    const tradeRatio = Number(row.TRADE_AMT_RATIO);
    return {
        date: String(row.STATISTICS_DATE).slice(0, 10),
        marginTrillion: Number(row.FIN_BALANCE) / 10000,
        turnoverTrillion: tradeAmount > 0 && tradeRatio > 0 ? tradeAmount / tradeRatio * 100 / 10000 : null
    };
}

async function fetchAllMargin(startDate, endDate) {
    const common = {
        reportName: "RPTA_WEB_MARGIN_DAILYTRADE", columns: "ALL", pageSize: "500",
        sortColumns: "STATISTICS_DATE", sortTypes: "-1"
    };
    const first = await jsonp(eastmoneyUrl("https://datacenter-web.eastmoney.com/api/data/v1/get", { ...common, pageNumber: "1" }));
    const pages = first.result ? first.result.pages : 0;
    let rows = first.result ? first.result.data || [] : [];
    for (let page = 2; page <= pages; page++) {
        const payload = await jsonp(eastmoneyUrl("https://datacenter-web.eastmoney.com/api/data/v1/get", { ...common, pageNumber: String(page) }));
        rows = rows.concat(payload.result ? payload.result.data || [] : []);
    }
    return rows.map(buildMarketRow).filter(row => row.date >= startDate && row.date <= endDate);
}

async function fetchMarketHistory(startDate, endDate, onProgress = () => {}) {
    onProgress("正在获取两市成交额与融资余额…");
    const rows = await fetchAllMargin(startDate, endDate);
    if (!rows.length) throw new Error("未找到所选范围内的大盘数据");
    return rows.sort((a, b) => a.date.localeCompare(b.date)).map(row => ({
        ...row,
        turnoverTrillion: row.turnoverTrillion == null ? null : Number(row.turnoverTrillion.toFixed(4)),
        marginTrillion: Number(row.marginTrillion.toFixed(4))
    }));
}

export {
    buildMarketRow, buildValuationRows, calculateMovingAverages, fetchIndexHistory, fetchIndexInfo, fetchMarketHistory,
    fetchStockHistory, fetchStockInfo, normalizeIndexCode, normalizeSecurityCode, normalizeStockCode, splitDateRange
};
