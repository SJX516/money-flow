import { presetDateRange } from "./chart_utils";

const LAST_STOCK_KEY = "money-flow.finance.last-stock";

function readLastStock() {
    try { return window.localStorage.getItem(LAST_STOCK_KEY); } catch (error) { return null; }
}

function saveLastStock(code) {
    try {
        if (code) window.localStorage.setItem(LAST_STOCK_KEY, code);
        else window.localStorage.removeItem(LAST_STOCK_KEY);
    } catch (error) {
        // 浏览器禁用本地存储时仅不记忆选择，不影响行情功能。
    }
}

function today() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function defaultViewRange(startDate, endDate) {
    return presetDateRange(startDate, endDate, 12);
}

function autoExportMarketUpdate(result, enabled, exportDb) {
    if (!enabled || (result && result.skipped)) return false;
    exportDb();
    return true;
}

export { autoExportMarketUpdate, defaultViewRange, readLastStock, saveLastStock, today };
