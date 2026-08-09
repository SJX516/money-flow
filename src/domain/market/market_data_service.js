import { App } from "../../app";
import InvestmentService from "../service/investment_service";
import { InvestmentType } from "../entity/investment";
import MarketDatabase from "./market_database";
import { fetchMarketHistory, fetchStockHistory, normalizeStockCode } from "./market_provider";
import { TARGET_COLORS, targetMetrics } from "./market_target";
import { deriveDailyValuation } from "./market_valuation";

function sortStockOptions(stocks) {
    const group = stock => stock.hasHolding && stock.hasData ? 0 : stock.hasHolding ? 1 : stock.hasData ? 2 : 3;
    return stocks.sort((a, b) => {
        const groupDiff = group(a) - group(b);
        if (groupDiff) return groupDiff;
        if (a.hasHolding && b.hasHolding && b.holdingAmount !== a.holdingAmount) return b.holdingAmount - a.holdingAmount;
        return a.code.localeCompare(b.code);
    });
}

class MarketDataService {
    static isReady() {
        return App.marketDb != null;
    }

    static requireDb() {
        if (!App.marketDb) throw new Error("请先新建或导入行情 DB");
        return App.marketDb;
    }

    static async createDb() {
        App.marketDb = await MarketDatabase.create();
        App.marketDbName = "新建行情数据库（尚未导出）";
        return App.marketDb;
    }

    static async loadDb(file) {
        App.marketDb = await MarketDatabase.load(file);
        App.marketDbName = file && file.name ? file.name : "已导入行情数据库";
        return App.marketDb;
    }

    static exportDb() {
        this.requireDb().export();
    }

    static getDefaultRange() {
        return this.requireDb().getDefaultRange();
    }

    static setDefaultRange(startDate, endDate) {
        this.validateRange(startDate, endDate);
        this.requireDb().setDefaultRange(startDate, endDate);
    }

    static validateRange(startDate, endDate) {
        if (!startDate || !endDate) throw new Error("请选择开始和结束日期");
        if (endDate < startDate) throw new Error("结束日期不能早于开始日期");
        if (startDate < "1990-01-01") throw new Error("开始日期不能早于 1990-01-01");
    }

    static listTargets(scopeCode) {
        return this.requireDb().listTargets(scopeCode);
    }

    static validateTarget(scopeCode, metric, targetValue, color) {
        const scope = scopeCode === "MARKET" ? "MARKET" : normalizeStockCode(scopeCode);
        if (!targetMetrics(scope).some(item => item.key === metric)) throw new Error("目标指标不适用于当前标的");
        const value = Number(targetValue);
        if (!Number.isFinite(value)) throw new Error("请输入有效的目标值");
        if (!TARGET_COLORS.some(item => item.value === color)) throw new Error("请选择目标线颜色");
        return { scope, value };
    }

    static addTarget(scopeCode, metric, targetValue, description, color) {
        const { scope, value } = this.validateTarget(scopeCode, metric, targetValue, color);
        return this.requireDb().saveTarget(scope, metric, value, String(description || "").trim(), color);
    }

    static updateTarget(id, scopeCode, metric, targetValue, description, color) {
        if (!Number.isInteger(Number(id))) throw new Error("目标记录无效");
        const { scope, value } = this.validateTarget(scopeCode, metric, targetValue, color);
        const updated = this.requireDb().updateTarget(Number(id), scope, metric, value, String(description || "").trim(), color);
        if (!updated) throw new Error("目标记录不存在或已被删除");
        return updated;
    }

    static deleteTarget(id) {
        if (!Number.isInteger(Number(id))) throw new Error("目标记录无效");
        this.requireDb().deleteTarget(Number(id));
    }

    static getDatabaseOverview() {
        const db = this.requireDb();
        return {
            name: App.marketDbName || "当前行情数据库",
            stocks: db.listStockSummaries(),
            market: db.getMarketSummary()
        };
    }

    static listStocks() {
        return this.requireDb().listInstruments("stock");
    }

    static getPersonalStocks() {
        if (!App.db) return [];
        const result = [];
        const holdings = InvestmentService.getAllInvestDetailBefore(null).stock;
        InvestmentService.queryProducts().forEach(product => {
            if (!product.type || product.type.code !== InvestmentType.Product.stock.code || !product.desc) return;
            try {
                const code = normalizeStockCode(product.desc);
                const holding = holdings[product.id];
                const holdingAmount = holding && holding.currentPrice ? Number(holding.currentPrice.money) / 100 : 0;
                if (!result.some(item => item.code === code)) result.push({
                    code, name: product.name, productId: product.id,
                    holdingAmount: Number.isFinite(holdingAmount) ? holdingAmount : 0,
                    hasHolding: Number.isFinite(holdingAmount) && holdingAmount > 0
                });
            } catch (error) {
                // 非沪深股票或历史备注不作为行情标的。
            }
        });
        return result;
    }

    static getStockOptions() {
        const map = new Map();
        this.getPersonalStocks().forEach(stock => map.set(stock.code, stock));
        if (this.isReady()) this.requireDb().listStockSummaries().forEach(stock => map.set(stock.code, {
            ...map.get(stock.code), ...stock, hasData: Number(stock.row_count) > 0, latestDate: stock.latest_date
        }));
        const stocks = Array.from(map.values()).map(stock => ({
            ...stock, hasHolding: Boolean(stock.hasHolding), hasData: Boolean(stock.hasData), holdingAmount: Number(stock.holdingAmount) || 0
        }));
        return sortStockOptions(stocks);
    }

    static async buildStock(code, name, startDate, endDate, options = {}) {
        this.validateRange(startDate, endDate);
        const db = this.requireDb();
        const normalized = normalizeStockCode(code);
        const existing = db.getInstrument(normalized);
        if (existing && !options.replace && !options.append) return { skipped: true, instrument: existing };
        let actualStart = startDate;
        if (options.append && existing) {
            const latestDate = db.getStockLatestDate(normalized);
            if (!latestDate) throw new Error(normalized + " 没有可补齐的历史日 K");
            const overlap = new Date(latestDate + "T00:00:00");
            overlap.setDate(overlap.getDate() - 45);
            actualStart = overlap.toISOString().slice(0, 10);
            if (actualStart < existing.start_date) actualStart = existing.start_date;
        }
        const data = await fetchStockHistory(normalized, actualStart, endDate, options.onProgress);
        if (options.append && existing) {
            const previousRows = db.getStockValuation(normalized, "1900-01-01", actualStart);
            this.mergePriorValuation(data.valuationRows, previousRows[previousRows.length - 1]);
        }
        db.saveStock(normalized, name || data.name, options.append && existing ? existing.start_date : startDate,
            endDate, data.dailyRows, data.valuationRows, Boolean(options.replace));
        return { skipped: false, instrument: db.getInstrument(normalized), rows: data.dailyRows.length, warnings: data.warnings || [] };
    }

    static mergePriorValuation(rows, previousRow) {
        const previous = {
            pe: previousRow && previousRow.pe,
            pb: previousRow && previousRow.pb,
            dividendYield: previousRow && previousRow.dividend_yield
        };
        rows.forEach(row => {
            [["pe", "peFilled"], ["pb", "pbFilled"], ["dividendYield", "dividendFilled"]].forEach(([field, flag]) => {
                if (row[field] == null && previous[field] != null) {
                    row[field] = previous[field];
                    row[flag] = true;
                }
                if (row[field] != null) previous[field] = row[field];
            });
        });
        return rows;
    }

    static removeStock(code) {
        this.requireDb().removeStock(normalizeStockCode(code));
    }

    static async rebuildStock(code, name, startDate, endDate, onProgress) {
        const normalized = normalizeStockCode(code);
        this.requireDb().removeStock(normalized);
        return this.buildStock(normalized, name, startDate, endDate, { onProgress });
    }

    static async buildMarket(startDate, endDate, options = {}) {
        this.validateRange(startDate, endDate);
        const db = this.requireDb();
        const existing = db.getInstrument("MARKET");
        if (existing && !options.replace && !options.append) return { skipped: true, instrument: existing };
        const actualStart = options.append && existing ? existing.end_date : startDate;
        const rows = await fetchMarketHistory(actualStart, endDate, options.onProgress);
        db.saveMarket(options.append && existing ? existing.start_date : startDate, endDate, rows, Boolean(options.replace));
        return { skipped: false, instrument: db.getInstrument("MARKET"), rows: rows.length };
    }

    static async rebuildAll(startDate, endDate, onProgress = () => {}) {
        const stocks = this.listStocks();
        const errors = [];
        for (let index = 0; index < stocks.length; index++) {
            const stock = stocks[index];
            const prefix = "重建 " + stock.name + "（" + (index + 1) + "/" + stocks.length + "）";
            onProgress(prefix + "：准备删除旧数据…");
            try {
                await this.rebuildStock(stock.code, stock.name, startDate, endDate,
                    detail => onProgress(prefix + "：" + detail));
            } catch (error) {
                errors.push(stock.name + "：" + error.message);
                onProgress(prefix + "：失败，继续下一只");
            }
        }
        if (errors.length) throw new Error("部分股票重建失败：" + errors.join("；"));
        return { count: stocks.length };
    }

    static async fillAll(endDate, onProgress = () => {}) {
        const db = this.requireDb();
        const summaries = db.listStockSummaries().filter(stock => Number(stock.row_count) > 0);
        const errors = [];
        for (let index = 0; index < summaries.length; index++) {
            const stock = summaries[index];
            const instrument = db.getInstrument(stock.code);
            const prefix = "补齐 " + stock.name + "（" + (index + 1) + "/" + summaries.length + "）";
            onProgress(prefix + "：从 " + stock.latest_date + " 补齐到 " + endDate);
            try {
                await this.buildStock(stock.code, stock.name, instrument.start_date, endDate, {
                    append: true, onProgress: detail => onProgress(prefix + "：" + detail)
                });
            } catch (error) {
                errors.push(stock.name + "：" + error.message);
                onProgress(prefix + "：失败，继续下一只");
            }
        }
        if (errors.length) throw new Error("部分股票补齐失败：" + errors.join("；"));
        return { count: summaries.length };
    }

    static getStockData(code, startDate, endDate) {
        const db = this.requireDb();
        const normalized = normalizeStockCode(code);
        const instrument = db.getInstrument(normalized);
        const daily = db.getStockDaily(normalized, startDate, endDate);
        const allDaily = db.getStockDaily(normalized, instrument?.start_date || "1900-01-01", endDate);
        const valuationNodes = db.getStockValuation(normalized, "1900-01-01", endDate);
        const valuation = deriveDailyValuation(allDaily, valuationNodes)
            .filter(row => row.report_date >= startDate && row.report_date <= endDate);
        return {
            instrument,
            daily,
            valuation,
            trades: this.getPersonalTrades(normalized)
        };
    }

    static getMarketData(startDate, endDate) {
        return this.requireDb().getMarketDaily(startDate, endDate);
    }

    static getPersonalTrades(code) {
        if (!App.db) return [];
        const product = this.getPersonalStocks().find(stock => stock.code === code);
        if (!product) return [];
        return InvestmentService.getProductTradesWithProceedsBefore(product.productId, null)
            .map(trade => {
                const detail = trade.detail;
                const count = Number(detail.count);
                const hasCount = detail.count != null && Number.isFinite(count) && count !== 0;
                if (!hasCount && trade.amount === 0) return null;
                const sell = Number(detail.money) < 0 || count < 0;
                const amount = Number(trade.amount) / 100;
                return {
                    id: detail.id,
                    date: detail.happenTime.toISOString().slice(0, 10),
                    type: sell ? "sell" : "buy",
                    count: hasCount ? Math.abs(count) : null,
                    amount,
                    price: hasCount ? Number((amount / Math.abs(count)).toFixed(4)) : null
                };
            }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
    }
}

export { sortStockOptions };
export default MarketDataService;
