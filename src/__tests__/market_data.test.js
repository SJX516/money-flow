import { App } from "../app";
import DBHelper from "../utils/db";
import MarketDatabase, { MARKET_DB_VERSION } from "../domain/market/market_database";
import MarketDataService, { sortStockOptions } from "../domain/market/market_data_service";
import InvestmentService from "../domain/service/investment_service";
import { InvestmentType } from "../domain/entity/investment";
import { SummaryService } from "../domain/service/summary_service";
import { compactNumber, dateToDay, dayToDate, mapTradesToRows, presetDateRange, zoomDateRange } from "../pages/detail/finance/chart_utils";
import { buildMarketRow, buildValuationRows, calculateMovingAverages, normalizeStockCode, splitDateRange } from "../domain/market/market_provider";
import { deriveDailyValuation } from "../domain/market/market_valuation";

describe("独立行情数据", () => {
    test("展示时间轴日期与刻度可双向转换", () => {
        expect(dayToDate(dateToDay("2025-06-30"))).toBe("2025-06-30");
        expect(dateToDay("2025-07-01") - dateToDay("2025-06-30")).toBe(1);
    });

    test("展示时间轴快捷范围按全局结束日回溯并受开始日限制", () => {
        expect(presetDateRange("2015-01-01", "2026-08-09", 6)).toEqual(["2026-02-09", "2026-08-09"]);
        expect(presetDateRange("2015-01-01", "2026-08-09", 36)).toEqual(["2023-08-09", "2026-08-09"]);
        expect(presetDateRange("2026-06-01", "2026-08-31", 12)).toEqual(["2026-06-01", "2026-08-31"]);
        expect(presetDateRange("2015-01-01", "2026-08-09", null)).toEqual(["2015-01-01", "2026-08-09"]);
    });

    test("图表数量级按万和亿格式化", () => {
        expect(compactNumber(123456)).toBe("12.35 万");
        expect(compactNumber(123456789)).toBe("1.23 亿");
    });

    test("无成交数量的交易点使用下一交易日收盘价定位", () => {
        const rows = [{ trade_date: "2025-06-02", close: 321.5 }, { trade_date: "2025-06-03", close: 325 }];
        const mapped = mapTradesToRows(rows, [{ date: "2025-06-01", type: "sell", count: null, price: null }]);
        expect(mapped[0]).toEqual(expect.objectContaining({ chartDate: "2025-06-02", markerPrice: 321.5, index: 0 }));
    });

    test("成交价与前复权K线偏差过大时标记贴近当日K线且保留真实价格", () => {
        const rows = [{ trade_date: "2022-06-01", low: 0.4, high: 0.44, close: 0.422 }];
        const mapped = mapTradesToRows(rows, [
            { date: "2022-06-01", type: "buy", price: 0.9271, count: 50100, amount: 46449.57 },
            { date: "2022-06-01", type: "sell", price: 0.9268, count: 99700, amount: 92403.42 },
            { date: "2022-06-01", type: "buy", price: 0.42, count: 100, amount: 42 }
        ]);
        expect(mapped[0]).toEqual(expect.objectContaining({ price: 0.9271, markerPrice: 0.4, markerAdjusted: true }));
        expect(mapped[1]).toEqual(expect.objectContaining({ price: 0.9268, markerPrice: 0.44, markerAdjusted: true }));
        expect(mapped[2]).toEqual(expect.objectContaining({ price: 0.42, markerPrice: 0.42, markerAdjusted: false }));
    });

    test("股票选项按有持仓有数据、持仓金额、仅持仓、仅数据排序", () => {
        const rows = sortStockOptions([
            { code: "600003.SH", hasHolding: false, hasData: false, holdingAmount: 0 },
            { code: "600002.SH", hasHolding: true, hasData: false, holdingAmount: 500 },
            { code: "600004.SH", hasHolding: false, hasData: true, holdingAmount: 0 },
            { code: "600001.SH", hasHolding: true, hasData: true, holdingAmount: 1000 },
            { code: "600005.SH", hasHolding: true, hasData: true, holdingAmount: 2000 }
        ]);
        expect(rows.map(row => row.code)).toEqual(["600005.SH", "600001.SH", "600002.SH", "600004.SH", "600003.SH"]);
    });

    test("股票图滚轮缩放围绕鼠标位置并限制在全局范围", () => {
        expect(zoomDateRange("2020-01-01", "2026-01-01", "2023-01-01", "2025-01-01", -1, 0.5))
            .toEqual(["2023-03-15", "2024-10-20"]);
        const expanded = zoomDateRange("2020-01-01", "2026-01-01", "2020-01-01", "2026-01-01", 1, 0.5);
        expect(expanded).toEqual(["2020-01-01", "2026-01-01"]);
    });

    test("标准化沪深股票代码并拒绝非沪深代码", () => {
        expect(normalizeStockCode("600519")).toBe("600519.SH");
        expect(normalizeStockCode("002241.sz")).toBe("002241.SZ");
        expect(normalizeStockCode("512000")).toBe("512000.SH");
        expect(() => normalizeStockCode("830001")).toThrow("仅支持沪深");
        expect(() => normalizeStockCode("600519.SZ")).toThrow("不匹配");
    });

    test("MA5 和 MA30 仅在足够窗口后产生", () => {
        const rows = Array.from({ length: 31 }, (_, index) => ({
            date: "2026-01-" + String(index + 1).padStart(2, "0"), close: index + 1
        }));
        const result = calculateMovingAverages(rows);
        expect(result[3].ma5).toBeNull();
        expect(result[4].ma5).toBe(3);
        expect(result[28].ma30).toBeNull();
        expect(result[29].ma30).toBe(15.5);
        expect(result[30].ma30).toBe(16.5);
    });

    test("长时间范围拆分为行情接口可接受的小区间且连续无重叠", () => {
        const ranges = splitDateRange("2015-01-01", "2026-08-09");
        expect(ranges.length).toBeGreaterThan(1);
        expect(ranges[0][0]).toBe("2015-01-01");
        expect(ranges[ranges.length - 1][1]).toBe("2026-08-09");
        ranges.slice(1).forEach((range, index) => {
            const previousEnd = new Date(ranges[index][1] + "T00:00:00Z");
            expect(new Date(range[0] + "T00:00:00Z").getTime() - previousEnd.getTime()).toBe(86400000);
        });
    });

    test("财报期估值按收盘价计算且缺失股息率沿用并标记", () => {
        const daily = [
            { date: "2025-03-31", close: 20 },
            { date: "2025-06-30", close: 24 },
            { date: "2025-09-30", close: 30 }
        ];
        const financial = [
            { REPORT_DATE: "2025-03-31 00:00:00", EPSJB: 1, BPS: 5 },
            { REPORT_DATE: "2025-06-30 00:00:00", EPSJB: 2, BPS: 6 },
            { REPORT_DATE: "2025-09-30 00:00:00", EPSJB: 3, BPS: 10 }
        ];
        const dividends = [{ REPORT_DATE: "2025-03-31 00:00:00", DIVIDENT_RATIO: 0.02 }];
        const rows = buildValuationRows(daily, financial, dividends, "2025-01-01", "2025-12-31");
        expect(rows[0]).toEqual(expect.objectContaining({ pe: 5, pb: 4, dividendYield: 2, dividendFilled: false }));
        expect(rows[1]).toEqual(expect.objectContaining({ pe: 6, pb: 4, dividendYield: 2, dividendFilled: true }));
        expect(rows[2].pe).toBe(7.5);
    });

    test("日度估值按最近财报基数随每日收盘价变化且不受沿用节点重置", () => {
        const daily = [
            { trade_date: "2025-03-31", close: 20 },
            { trade_date: "2025-04-01", close: 22 },
            { trade_date: "2025-06-30", close: 24 },
            { trade_date: "2025-07-01", close: 30 }
        ];
        const nodes = [
            { report_date: "2025-03-31", pe: 5, pb: 4, dividend_yield: 2, pe_filled: 0, pb_filled: 0, dividend_filled: 0 },
            { report_date: "2025-06-30", pe: 5, pb: 4, dividend_yield: 2, pe_filled: 1, pb_filled: 1, dividend_filled: 1 }
        ];
        const result = deriveDailyValuation(daily, nodes);
        expect(result[0]).toEqual(expect.objectContaining({ pe: 5, pb: 4, dividend_yield: 2, source_report_date: "2025-03-31" }));
        expect(result[1]).toEqual(expect.objectContaining({ pe: 5.5, pb: 4.4, dividend_yield: 1.8182 }));
        expect(result[2]).toEqual(expect.objectContaining({ pe: 6, pb: 4.8, dividend_yield: 1.6667, source_report_date: "2025-06-30" }));
        expect(result[3]).toEqual(expect.objectContaining({ pe: 7.5, pb: 6, dividend_yield: 1.3333 }));
    });

    test("两融日报按交易额占比还原两市成交额并转换为万亿", () => {
        const row = buildMarketRow({
            STATISTICS_DATE: "2026-08-06 00:00:00", FIN_BALANCE: 26155.5687,
            MARGIN_TRADE_AMT: 2381.3651, TRADE_AMT_RATIO: 9.3477
        });
        expect(row.date).toBe("2026-08-06");
        expect(row.marginTrillion).toBeCloseTo(2.6156, 4);
        expect(row.turnoverTrillion).toBeCloseTo(2.5475, 4);
    });

    test("个人数据库摘要返回最新可展示理财月份", async () => {
        await App.createDb();
        SummaryService.addMonth(new Date("2024-06-01"));
        SummaryService.addMonth(new Date("2025-03-01"));
        expect(SummaryService.latestMonth()).toBe("2025-03");
    });

    test("个人财务股票按描述 code 关联真实买卖记录", async () => {
        await App.createDb();
        InvestmentService.upsertProduct(InvestmentType.Product.stock.code, "贵州茅台", "600519");
        const product = InvestmentService.queryProducts().find(item => item.desc === "600519");
        InvestmentService.addBuyInvest(product.id, product.name, product.type.code, 100, 100000, 100000, new Date("2025-01-02 10:00:00"));
        InvestmentService.addSellInvestOfProfit(product.id, product.name, product.type.code, null,
            20000, 1000, 0, new Date("2025-01-03 10:00:00"));
        InvestmentService.addBuyInvest(product.id, product.name, product.type.code, null,
            50000, 50000, new Date("2025-01-04 10:00:00"));
        InvestmentService.addSellInvestOfProfit(product.id, product.name, product.type.code, 10,
            23830, 1830, 0, new Date("2025-01-05 10:00:00"));
        InvestmentService.addSellInvestOfProfit(product.id, product.name, product.type.code, 10,
            25960, 1960, 0, new Date("2025-01-06 10:00:00"));
        expect(MarketDataService.getPersonalStocks()).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: "600519.SH", productId: product.id })
        ]));
        const trades = MarketDataService.getPersonalTrades("600519.SH");
        expect(trades[0]).toEqual(expect.objectContaining({
            type: "buy", count: 100, amount: 1000, price: 10, date: "2025-01-02"
        }));
        expect(trades[1]).toEqual(expect.objectContaining({
            type: "sell", count: null, amount: 200, price: null, date: "2025-01-03"
        }));
        expect(trades[2]).toEqual(expect.objectContaining({
            type: "buy", count: null, amount: 500, price: null, date: "2025-01-04"
        }));
        expect(trades[3]).toEqual(expect.objectContaining({
            type: "sell", count: 10, amount: 238.3, price: 23.83, date: "2025-01-05"
        }));
        expect(trades[4]).toEqual(expect.objectContaining({
            type: "sell", count: 10, amount: 259.6, price: 25.96, date: "2025-01-06"
        }));
    });

    test("一键重建按股票逐项处理并保留股票名进度", async () => {
        const db = await MarketDatabase.create();
        db.saveStock("600001.SH", "股票甲", "2025-01-01", "2025-01-02", [{ date: "2025-01-02", open: 1, close: 1, high: 1, low: 1, volume: null, amount: null, ma5: null, ma30: null }], []);
        db.saveStock("600002.SH", "股票乙", "2025-01-01", "2025-01-02", [{ date: "2025-01-02", open: 2, close: 2, high: 2, low: 2, volume: null, amount: null, ma5: null, ma30: null }], []);
        App.marketDb = db;
        const rebuild = jest.spyOn(MarketDataService, "rebuildStock").mockImplementation(async (code, name, start, end, progress) => progress("正在拉取"));
        const progress = [];
        await MarketDataService.rebuildAll("2020-01-01", "2026-01-01", text => progress.push(text));
        expect(rebuild).toHaveBeenCalledTimes(2);
        expect(progress).toEqual(expect.arrayContaining([expect.stringContaining("股票甲（1/2）"), expect.stringContaining("股票乙（2/2）")]));
        rebuild.mockRestore();
    });

    test("一键补齐只处理已有日K股票并从实际最后交易日继续", async () => {
        const db = await MarketDatabase.create();
        db.saveStock("600001.SH", "已有数据", "2025-01-01", "2025-01-02", [{ date: "2025-01-02", open: 1, close: 1, high: 1, low: 1, volume: null, amount: null, ma5: null, ma30: null }], []);
        db.saveInstrument({ code: "600002.SH", name: "空股票", type: "stock", startDate: "2025-01-01", endDate: "2025-01-02" });
        App.marketDb = db;
        const build = jest.spyOn(MarketDataService, "buildStock").mockResolvedValue({});
        const progress = [];
        await MarketDataService.fillAll("2026-01-01", text => progress.push(text));
        expect(build).toHaveBeenCalledTimes(1);
        expect(build.mock.calls[0][0]).toBe("600001.SH");
        expect(progress[0]).toContain("从 2025-01-02 补齐到 2026-01-01");
        build.mockRestore();
    });

    test("增量补齐跨批次沿用最后财报值并标记", () => {
        const rows = [{ date: "2026-03-31", pe: null, pb: 3, dividendYield: null }];
        MarketDataService.mergePriorValuation(rows, { pe: 12, pb: 2, dividend_yield: 1.5 });
        expect(rows[0]).toEqual(expect.objectContaining({
            pe: 12, peFilled: true, pb: 3, dividendYield: 1.5, dividendFilled: true
        }));
    });

    test("个人库与行情库可按核心表结构区分", async () => {
        const personal = new DBHelper();
        await personal.createV0Db();
        expect(() => personal.validatePersonalSchema()).not.toThrow();
        const market = await MarketDatabase.create();
        const wrongType = new DBHelper();
        wrongType.db = market.db;
        expect(() => wrongType.validatePersonalSchema()).toThrow("不是有效的个人数据库");
    });

    test("旧版行情库自动升级并保留原数据", async () => {
        const legacy = await MarketDatabase.create();
        legacy.saveStock("600519.SH", "贵州茅台", "2025-01-01", "2025-01-02", [{
            date: "2025-01-02", open: 10, close: 11, high: 12, low: 9, volume: 100, amount: null, ma5: null, ma30: null
        }], []);
        legacy.run("DROP INDEX idx_market_target_scope");
        legacy.run("DROP TABLE market_target");
        legacy.setMeta("db_version", "1");
        const bytes = legacy.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const upgraded = await MarketDatabase.load({ arrayBuffer: async () => buffer });
        expect(upgraded.getMeta("db_version")).toBe(MARKET_DB_VERSION);
        expect(upgraded.getStockDaily("600519.SH", "2025-01-01", "2025-12-31")).toHaveLength(1);
        expect(upgraded.listTargets("600519.SH")).toEqual([]);
    });

    test("股票与大盘目标指标保存、查询和删除", async () => {
        const db = await MarketDatabase.create();
        const stockTarget = db.saveTarget("600519.SH", "price", 1450, "可以买入", "#22c55e");
        db.saveTarget("MARKET", "turnover_trillion", 1.2, "市场冷清", "#3b82f6");
        expect(db.listTargets("600519.SH")[0]).toEqual(expect.objectContaining({
            id: stockTarget.id, target_value: 1450, description: "可以买入", color: "#22c55e"
        }));
        expect(db.listTargets("MARKET")).toHaveLength(1);
        db.updateTarget(stockTarget.id, "600519.SH", "pe", 22.5, "估值合理", "#3b82f6");
        expect(db.listTargets("600519.SH")[0]).toEqual(expect.objectContaining({
            id: stockTarget.id, metric: "pe", target_value: 22.5, description: "估值合理", color: "#3b82f6"
        }));
        db.deleteTarget(stockTarget.id);
        expect(db.listTargets("600519.SH")).toEqual([]);
    });

    test("行情 DB 独立保存股票、大盘、默认范围并支持按股票移除", async () => {
        const db = await MarketDatabase.create();
        db.setDefaultRange("2020-01-01", "2026-01-01");
        db.saveStock("600519.SH", "贵州茅台", "2025-01-01", "2025-01-02", [{
            date: "2025-01-02", open: 10, close: 11, high: 12, low: 9, volume: 100, amount: 1000, ma5: null, ma30: null
        }], [{ date: "2025-03-31", pe: 10, pb: 2, dividendYield: 3, peFilled: false, pbFilled: false, dividendFilled: false }]);
        db.saveMarket("2025-01-01", "2025-01-02", [{ date: "2025-01-02", turnoverTrillion: 1.2, marginTrillion: 1.8 }]);
        db.saveTarget("600519.SH", "pe", 20, "重建保留", "#ef4444");

        expect(db.getDefaultRange()).toEqual(["2020-01-01", "2026-01-01"]);
        expect(db.listStockSummaries()[0]).toEqual(expect.objectContaining({
            code: "600519.SH", latest_date: "2025-01-02", row_count: 1
        }));
        expect(db.getMarketSummary()).toEqual(expect.objectContaining({ latest_date: "2025-01-02", row_count: 1 }));
        expect(db.getStockLatestDate("600519.SH")).toBe("2025-01-02");

        expect(db.listInstruments()).toHaveLength(2);
        expect(db.getStockDaily("600519.SH", "2025-01-01", "2025-12-31")[0].close).toBe(11);
        expect(db.getStockValuation("600519.SH", "2025-01-01", "2025-12-31")[0].dividend_yield).toBe(3);
        expect(db.getMarketDaily("2025-01-01", "2025-12-31")[0].turnover_trillion).toBe(1.2);

        db.removeStock("600519.SH");
        expect(db.listTargets("600519.SH")).toHaveLength(1);
        expect(db.getInstrument("600519.SH")).toBeNull();
        expect(db.getStockDaily("600519.SH", "2025-01-01", "2025-12-31")).toEqual([]);
        expect(db.getInstrument("MARKET")).not.toBeNull();
    });
});
