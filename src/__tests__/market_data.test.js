import { App } from "../app";
import DBHelper from "../utils/db";
import MarketDatabase, { MARKET_DB_VERSION } from "../domain/market/market_database";
import MarketDataService, { sortStockOptions } from "../domain/market/market_data_service";
import InvestmentService from "../domain/service/investment_service";
import { InvestmentType } from "../domain/entity/investment";
import { SummaryService } from "../domain/service/summary_service";
import { compactNumber, dateToDay, dayToDate, mapTradesToRows, presetDateRange, zoomDateRange } from "../pages/detail/finance/chart_utils";
import { autoExportMarketUpdate } from "../pages/detail/finance/finance_page_state";
import { buildMarketRow, buildValuationRows, calculateMovingAverages, normalizeIndexCode, normalizeSecurityCode,
    normalizeStockCode, splitDateRange } from "../domain/market/market_provider";
import { deriveDailyValuation } from "../domain/market/market_valuation";
import { calculateChipDistribution, calculateChipTrend } from "../domain/market/market_chip";
import { calculateFinancingActivity } from "../domain/market/market_activity";

describe("独立行情数据", () => {
    test("展示时间轴日期与刻度可双向转换", () => {
        expect(dayToDate(dateToDay("2025-06-30"))).toBe("2025-06-30");
        expect(dateToDay("2025-07-01") - dateToDay("2025-06-30")).toBe(1);
    });

    test("展示时间轴快捷范围按全局结束日回溯并受开始日限制", () => {
        expect(presetDateRange("2015-01-01", "2026-08-09", 3)).toEqual(["2026-05-09", "2026-08-09"]);
        expect(presetDateRange("2015-01-01", "2026-08-09", 6)).toEqual(["2026-02-09", "2026-08-09"]);
        expect(presetDateRange("2015-01-01", "2026-08-09", 36)).toEqual(["2023-08-09", "2026-08-09"]);
        expect(presetDateRange("2026-06-01", "2026-08-31", 12)).toEqual(["2026-06-01", "2026-08-31"]);
        expect(presetDateRange("2015-01-01", "2026-08-09", null)).toEqual(["2015-01-01", "2026-08-09"]);
    });

    test("行情更新成功后自动导出一次且跳过构建时不导出", () => {
        const exportDb = jest.fn();
        expect(autoExportMarketUpdate({ rows: 100 }, true, exportDb)).toBe(true);
        expect(autoExportMarketUpdate({ skipped: true }, true, exportDb)).toBe(false);
        expect(autoExportMarketUpdate({ rows: 100 }, false, exportDb)).toBe(false);
        expect(exportDb).toHaveBeenCalledTimes(1);
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

    test("股票选项先按分组排序并在组内沿用持仓和行情排序", () => {
        const rows = sortStockOptions([
            { code: "600006.SH", groupSortOrder: null, hasHolding: true, hasData: true, holdingAmount: 3000 },
            { code: "600003.SH", groupSortOrder: 0, hasHolding: false, hasData: false, holdingAmount: 0 },
            { code: "600002.SH", groupSortOrder: 1, hasHolding: true, hasData: false, holdingAmount: 500 },
            { code: "600004.SH", groupSortOrder: 0, hasHolding: false, hasData: true, holdingAmount: 0 },
            { code: "600001.SH", groupSortOrder: 0, hasHolding: true, hasData: true, holdingAmount: 1000 },
            { code: "600005.SH", groupSortOrder: 0, hasHolding: true, hasData: true, holdingAmount: 2000 }
        ]);
        expect(rows.map(row => row.code)).toEqual([
            "600005.SH", "600001.SH", "600004.SH", "600003.SH", "600002.SH", "600006.SH"
        ]);
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
        expect(normalizeIndexCode("000001")).toBe("000001.SH");
        expect(normalizeIndexCode("1a0001")).toBe("000001.SH");
        expect(normalizeIndexCode("399001")).toBe("399001.SZ");
        expect(normalizeIndexCode("899050")).toBe("899050.BJ");
        expect(normalizeSecurityCode("000688.SH")).toBe("000688.SH");
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

    test("财报期 PE 和股息率使用滚动十二个月口径", () => {
        const daily = [
            { date: "2025-03-31", close: 26 },
            { date: "2025-06-30", close: 28 },
            { date: "2025-09-30", close: 30 },
            { date: "2025-12-31", close: 32 }
        ];
        const financial = [
            { REPORT_DATE: "2024-03-31 00:00:00", EPSJB: 0.2, BPS: 4 },
            { REPORT_DATE: "2024-06-30 00:00:00", EPSJB: 0.5, BPS: 4 },
            { REPORT_DATE: "2024-09-30 00:00:00", EPSJB: 0.8, BPS: 4 },
            { REPORT_DATE: "2024-12-31 00:00:00", EPSJB: 1.2, BPS: 4 },
            { REPORT_DATE: "2025-03-31 00:00:00", EPSJB: 0.3, BPS: 5 },
            { REPORT_DATE: "2025-06-30 00:00:00", EPSJB: 0.7, BPS: 7 },
            { REPORT_DATE: "2025-09-30 00:00:00", EPSJB: 1.1, BPS: 10 },
            { REPORT_DATE: "2025-12-31 00:00:00", EPSJB: 1.6, BPS: 16 }
        ];
        const dividends = [
            { EX_DIVIDEND_DATE: "2024-04-01 00:00:00", PRETAX_BONUS_RMB: 1, ASSIGN_PROGRESS: "实施分配" },
            { EX_DIVIDEND_DATE: "2024-10-01 00:00:00", PRETAX_BONUS_RMB: 2, ASSIGN_PROGRESS: "实施分配" },
            { EX_DIVIDEND_DATE: "2025-03-20 00:00:00", PRETAX_BONUS_RMB: 3, ASSIGN_PROGRESS: "实施分配" },
            { EX_DIVIDEND_DATE: "2025-05-01 00:00:00", PRETAX_BONUS_RMB: 10, ASSIGN_PROGRESS: "预案" }
        ];
        const rows = buildValuationRows(daily, financial, dividends, "2025-01-01", "2025-12-31");
        expect(rows.map(row => row.pe)).toEqual([20, 20, 20, 20]);
        expect(rows[0]).toEqual(expect.objectContaining({ pb: 5.2, dividendYield: 2.3077, dividendFilled: false }));
        expect(rows[1].dividendYield).toBe(1.7857);
        expect(rows[2].dividendYield).toBe(1.6667);
        expect(rows[3].dividendYield).toBe(0.9375);
    });

    test("TTM 扣非利润增速使用相邻财报节点环比", () => {
        const daily = ["2024-03-31", "2024-06-30", "2024-12-31", "2025-03-31", "2025-06-30"]
            .map(date => ({ date, close: 10 }));
        const financial = [
            { REPORT_DATE: "2024-03-31", EPSJB: 0.1, KCFJCXSYJLR: 100 },
            { REPORT_DATE: "2024-06-30", EPSJB: 0.2, KCFJCXSYJLR: 200 },
            { REPORT_DATE: "2024-12-31", EPSJB: 1, KCFJCXSYJLR: 1000 },
            { REPORT_DATE: "2025-03-31", EPSJB: 0.2, KCFJCXSYJLR: 110 },
            { REPORT_DATE: "2025-06-30", EPSJB: 0.4, KCFJCXSYJLR: 220 }
        ];
        const rows = buildValuationRows(daily, financial, [], "2024-01-01", "2025-12-31");
        const march = rows.find(row => row.date === "2025-03-31");
        const june = rows.find(row => row.date === "2025-06-30");
        expect(march.ttmKcfjNetProfit).toBe(1010);
        expect(june.ttmKcfjNetProfit).toBe(1020);
        expect(june.ttmKcfjGrowth).toBeCloseTo((1020 / 1010 - 1) * 100, 4);
    });

    test("筹码分布按换手衰减归一化并返回成本区间", () => {
        const rows = [
            { trade_date: "2026-08-12", open: 9, close: 10, high: 11, low: 9, turnover_rate: 10 },
            { trade_date: "2026-08-13", open: 10, close: 11, high: 12, low: 10, turnover_rate: 20 },
            { trade_date: "2026-08-14", open: 11, close: 12, high: 13, low: 11, turnover_rate: 30 }
        ];
        const result = calculateChipDistribution(rows, "2026-08-14");
        expect(result.status).toBe("ready");
        expect(result.points.reduce((sum, point) => sum + point.percent, 0)).toBeCloseTo(100, 2);
        expect(result.medianCost).toBeGreaterThanOrEqual(9);
        expect(result.medianCost).toBeLessThanOrEqual(13);
        expect(result.cost70.low).toBeLessThanOrEqual(result.cost70.high);
        expect(result.profitRatio).toBeGreaterThan(0);
        const trend = calculateChipTrend(rows, rows.map(row => row.trade_date));
        expect(trend[2]).toEqual(expect.objectContaining({
            date: "2026-08-14", medianCost: result.medianCost, profitRatio: result.profitRatio
        }));
        expect(trend.every(item => item.points == null)).toBe(true);
    });

    test("筹码计算遇到旧库缺失换手率时要求重建", () => {
        const rows = [{
            trade_date: "2026-08-14", open: 10, close: 11, high: 12, low: 9, turnover_rate: null
        }];
        const result = calculateChipDistribution(rows, "2026-08-14");
        expect(result).toEqual(expect.objectContaining({ status: "missing-turnover", date: "2026-08-14" }));
        expect(calculateChipTrend(rows, ["2026-08-14"])[0]).toEqual(expect.objectContaining({
            status: "missing-turnover", medianCost: null, profitRatio: null
        }));
    });

    test("日度估值按最近财报基数随每日收盘价变化且不受沿用节点重置", () => {
        const daily = [
            { trade_date: "2025-03-31", close: 20 },
            { trade_date: "2025-04-01", close: 22 },
            { trade_date: "2025-06-30", close: 24 },
            { trade_date: "2025-07-01", close: 30 }
        ];
        const nodes = [
            { report_date: "2025-03-31", pe: 5, pb: 4, dividend_yield: 2, ttm_kcfj_net_profit: 1000, ttm_kcfj_growth: 20, pe_filled: 0, pb_filled: 0, dividend_filled: 0 },
            { report_date: "2025-06-30", pe: 5, pb: 4, dividend_yield: 2, ttm_kcfj_net_profit: 1100, ttm_kcfj_growth: 25, pe_filled: 1, pb_filled: 1, dividend_filled: 1 }
        ];
        const result = deriveDailyValuation(daily, nodes);
        expect(result[0]).toEqual(expect.objectContaining({ pe: 5, pb: 4, dividend_yield: 2, ttm_kcfj_net_profit: 1000, ttm_kcfj_growth: 20, peg: 0.25, source_report_date: "2025-03-31" }));
        expect(result[1]).toEqual(expect.objectContaining({ pe: 5.5, pb: 4.4, dividend_yield: 1.8182, ttm_kcfj_net_profit: 1000, ttm_kcfj_growth: 20, peg: 0.275 }));
        expect(result[2]).toEqual(expect.objectContaining({ pe: 6, pb: 4.8, dividend_yield: 1.6667, ttm_kcfj_net_profit: 1100, ttm_kcfj_growth: 25, peg: 0.24, source_report_date: "2025-06-30" }));
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

    test("融资活跃度按融资余额变化量占两市成交额计算并保留正负", () => {
        const result = calculateFinancingActivity([
            { trade_date: "2026-08-12", turnover_trillion: 1, margin_trillion: 2 },
            { trade_date: "2026-08-13", turnover_trillion: 1.25, margin_trillion: 2.0125 },
            { trade_date: "2026-08-14", turnover_trillion: 0.5, margin_trillion: 2.0025 }
        ]);
        expect(result[0].financing_activity).toBeNull();
        expect(result[1]).toEqual(expect.objectContaining({
            margin_change_trillion: 0.0125, financing_activity: 1
        }));
        expect(result[2]).toEqual(expect.objectContaining({
            margin_change_trillion: -0.01, financing_activity: -2
        }));
        expect(calculateFinancingActivity([
            { trade_date: "2026-08-12", turnover_trillion: 1, margin_trillion: null },
            { trade_date: "2026-08-13", turnover_trillion: 1, margin_trillion: 2 }
        ])[1].financing_activity).toBeNull();
    });

    test("可见大盘区间首日使用上一交易日余额计算融资活跃度", async () => {
        App.marketDb = await MarketDatabase.create();
        App.marketDb.saveMarket("2026-08-12", "2026-08-14", [
            { date: "2026-08-12", turnoverTrillion: 1, marginTrillion: 2 },
            { date: "2026-08-13", turnoverTrillion: 1.25, marginTrillion: 2.0125 },
            { date: "2026-08-14", turnoverTrillion: 0.5, marginTrillion: 2.0025 }
        ]);
        const visible = MarketDataService.getMarketData("2026-08-13", "2026-08-14");
        expect(visible.map(row => row.financing_activity)).toEqual([1, -2]);
    });

    test("补齐成交额从数据库实际最后一天续接到指定日期", async () => {
        App.marketDb = await MarketDatabase.create();
        App.marketDb.saveMarket("2026-08-01", "2026-08-20", [
            { date: "2026-08-18", turnoverTrillion: 1.2, marginTrillion: 2.1 }
        ]);
        const fetchHistory = jest.fn(async () => [
            { date: "2026-08-19", turnoverTrillion: 1.3, marginTrillion: 2.11 }
        ]);

        await MarketDataService.fillMarket("2026-08-27", () => {}, { fetchHistory });

        expect(fetchHistory).toHaveBeenCalledWith("2026-08-18", "2026-08-27", expect.any(Function));
        expect(App.marketDb.getMarketDaily("2026-08-01", "2026-08-27").map(row => row.trade_date))
            .toEqual(["2026-08-18", "2026-08-19"]);
        expect(App.marketDb.getInstrument("MARKET")).toEqual(expect.objectContaining({
            start_date: "2026-08-01", end_date: "2026-08-27"
        }));
    });

    test("移除成交额历史时保留大盘目标指标", async () => {
        App.marketDb = await MarketDatabase.create();
        App.marketDb.saveMarket("2026-08-01", "2026-08-20", [
            { date: "2026-08-18", turnoverTrillion: 1.2, marginTrillion: 2.1 }
        ]);
        App.marketDb.saveTarget("MARKET", "turnover_trillion", 1, "成交低迷", "#3b82f6");

        MarketDataService.removeMarket();

        expect(App.marketDb.getMarketDaily("2026-08-01", "2026-08-27")).toEqual([]);
        expect(App.marketDb.getInstrument("MARKET")).toBeNull();
        expect(App.marketDb.listTargets("MARKET")).toHaveLength(1);
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

    test("大盘页一键重建只处理指数分组中的已构建标的", async () => {
        const db = await MarketDatabase.create();
        const indexGroup = db.listStockGroups().find(group => group.name === "指数");
        db.saveStock("000001.SH", "虚构指数", "2025-01-01", "2025-01-02", [], []);
        db.saveStock("600001.SH", "普通股票", "2025-01-01", "2025-01-02", [], []);
        db.saveWatchStock("000001.SH", "虚构指数", indexGroup.id);
        db.saveWatchStock("600001.SH", "普通股票", null);
        App.marketDb = db;
        const rebuild = jest.spyOn(MarketDataService, "rebuildStock").mockResolvedValue({});

        await MarketDataService.rebuildAll("2020-01-01", "2026-01-01", () => {}, indexGroup.id);

        expect(rebuild).toHaveBeenCalledTimes(1);
        expect(rebuild.mock.calls[0][0]).toBe("000001.SH");
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

    test("增量补齐保留历史均线计算上下文并修复已有 MA 缺口", async () => {
        const db = await MarketDatabase.create();
        const dates = [];
        for (let date = new Date("2026-05-01T00:00:00Z"); date <= new Date("2026-08-27T00:00:00Z");
            date.setUTCDate(date.getUTCDate() + 1)) {
            if (date.getUTCDay() > 0 && date.getUTCDay() < 6) dates.push(date.toISOString().slice(0, 10));
        }
        const rowForDate = date => {
            const close = dates.indexOf(date) + 1;
            return { date, open: close, close, high: close, low: close, volume: 1, amount: 1,
                turnoverRate: 1, ma5: null, ma30: null };
        };
        const existingRows = calculateMovingAverages(dates.filter(date => date <= "2026-08-20").map(rowForDate));
        const expected = new Map(existingRows.map(row => [row.date, { ma5: row.ma5, ma30: row.ma30 }]));
        db.saveStock("002920.SZ", "德赛西威", "2026-05-01", "2026-08-20", existingRows, []);
        db.run("UPDATE stock_daily SET ma5=NULL,ma30=NULL WHERE code=? AND trade_date>=? AND trade_date<=?", [
            "002920.SZ", "2026-07-03", "2026-08-20"
        ]);
        App.marketDb = db;
        const fetchHistory = jest.fn(async (code, startDate, endDate) => ({
            code, name: "德赛西威",
            dailyRows: calculateMovingAverages(dates.filter(date => date >= startDate && date <= endDate).map(rowForDate)),
            valuationRows: [], warnings: []
        }));

        await MarketDataService.buildStock("002920.SZ", "德赛西威", "2026-05-01", "2026-08-27", {
            append: true, fetchHistory
        });

        expect(fetchHistory.mock.calls[0].slice(0, 3)).toEqual(["002920.SZ", "2026-07-06", "2026-08-27"]);
        const repaired = db.getStockDaily("002920.SZ", "2026-07-03", "2026-08-20");
        repaired.forEach(row => expect({ ma5: row.ma5, ma30: row.ma30 }).toEqual(expected.get(row.trade_date)));
        expect(repaired.every(row => row.ma5 != null && row.ma30 != null)).toBe(true);
        expect(db.getStockDaily("002920.SZ", "2026-08-21", "2026-08-27")
            .every(row => row.ma5 != null && row.ma30 != null)).toBe(true);
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

    test("导入行情库时保留起始日期并将默认截至日期更新为当天", async () => {
        const source = await MarketDatabase.create();
        source.setDefaultRange("2020-01-01", "2025-12-31");
        const bytes = source.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const today = jest.spyOn(MarketDatabase.prototype, "today").mockReturnValue("2026-08-16");

        await MarketDataService.loadDb({ name: "行情.db", arrayBuffer: async () => buffer });

        expect(MarketDataService.getDefaultRange()).toEqual(["2020-01-01", "2026-08-16"]);
        expect(App.marketDbName).toBe("行情.db");
        today.mockRestore();
    });

    test("加载行情库时将库内股票补到未分组且保留已有分组", async () => {
        const source = await MarketDatabase.create();
        const group = source.saveStockGroup("核心");
        source.saveStock("600001.SH", "已分组股票", "2025-01-01", "2025-01-02", [], []);
        source.saveStock("600002.SH", "待同步股票", "2025-01-01", "2025-01-02", [], []);
        source.saveWatchStock("600001.SH", "已分组股票", group.id);
        const bytes = source.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        await MarketDataService.loadDb({ name: "同步测试.db", arrayBuffer: async () => buffer });

        const stocks = MarketDataService.getWatchStocks();
        expect(stocks.find(stock => stock.code === "600001.SH")).toEqual(expect.objectContaining({
            group_id: group.id, group_name: "核心"
        }));
        expect(stocks.find(stock => stock.code === "600002.SH")).toEqual(expect.objectContaining({
            group_id: null, group_name: null
        }));
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

    test("v2 行情库升级后新增观察列表表并保留版本兼容", async () => {
        const legacy = await MarketDatabase.create();
        legacy.run("DROP INDEX idx_stock_watchlist_group");
        legacy.run("DROP TABLE stock_watchlist");
        legacy.run("DROP TABLE stock_group");
        legacy.setMeta("db_version", "2");
        const bytes = legacy.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        const upgraded = await MarketDatabase.load({ arrayBuffer: async () => buffer });

        expect(upgraded.getMeta("db_version")).toBe(MARKET_DB_VERSION);
        expect(upgraded.listStockGroups()).toEqual([
            expect.objectContaining({ name: "指数", stock_count: 0 })
        ]);
        expect(upgraded.listWatchStocks()).toEqual([]);
    });

    test("v3 行情库升级后新增换手率列并保留原日 K", async () => {
        const legacy = await MarketDatabase.create();
        legacy.saveStock("600519.SH", "贵州茅台", "2025-01-01", "2025-01-02", [{
            date: "2025-01-02", open: 10, close: 11, high: 12, low: 9,
            volume: 100, amount: 1000, turnoverRate: 1.5, ma5: null, ma30: null
        }], []);
        legacy.run("ALTER TABLE stock_daily RENAME TO stock_daily_v4");
        legacy.run("CREATE TABLE stock_daily (code TEXT NOT NULL, trade_date TEXT NOT NULL, open REAL NOT NULL, close REAL NOT NULL, high REAL NOT NULL, low REAL NOT NULL, volume REAL, amount REAL, ma5 REAL, ma30 REAL, PRIMARY KEY (code, trade_date))");
        legacy.run("INSERT INTO stock_daily (code,trade_date,open,close,high,low,volume,amount,ma5,ma30) SELECT code,trade_date,open,close,high,low,volume,amount,ma5,ma30 FROM stock_daily_v4");
        legacy.run("DROP TABLE stock_daily_v4");
        legacy.setMeta("db_version", "3");
        const bytes = legacy.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        const upgraded = await MarketDatabase.load({ arrayBuffer: async () => buffer });

        expect(upgraded.getMeta("db_version")).toBe(MARKET_DB_VERSION);
        expect(upgraded.rows("PRAGMA table_info(stock_daily)").map(row => row.name)).toContain("turnover_rate");
        expect(upgraded.getStockDaily("600519.SH", "2025-01-01", "2025-12-31")[0]).toEqual(expect.objectContaining({
            close: 11, turnover_rate: null
        }));
    });

    test("v4 行情库升级后创建不可删除的指数分组", async () => {
        const legacy = await MarketDatabase.create();
        legacy.run("DELETE FROM stock_group WHERE name='指数'");
        legacy.saveStockGroup("普通分组");
        legacy.setMeta("db_version", "4");
        const bytes = legacy.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        const upgraded = await MarketDatabase.load({ arrayBuffer: async () => buffer });
        const groups = upgraded.listStockGroups();
        expect(groups.map(group => group.name)).toEqual(["指数", "普通分组"]);
        expect(() => upgraded.deleteStockGroup(groups[0].id)).toThrow("不可删除");
    });

    test("观察股票支持创建分组、移动、删除分组和取消观察", async () => {
        const db = await MarketDatabase.create();
        const valueGroup = db.saveStockGroup("价值");
        const growthGroup = db.saveStockGroup("成长");
        db.saveWatchStock("600519.SH", "贵州茅台", valueGroup.id);

        expect(db.listStockGroups()).toEqual([
            expect.objectContaining({ name: "指数", stock_count: 0 }),
            expect.objectContaining({ name: "价值", stock_count: 1 }),
            expect.objectContaining({ name: "成长", stock_count: 0 })
        ]);
        expect(db.listWatchStocks()[0]).toEqual(expect.objectContaining({
            code: "600519.SH", name: "贵州茅台", group_name: "价值"
        }));

        db.moveWatchStock("600519.SH", growthGroup.id);
        expect(db.listWatchStocks()[0].group_name).toBe("成长");
        db.deleteStockGroup(growthGroup.id);
        expect(db.listWatchStocks()[0]).toEqual(expect.objectContaining({ group_id: null, group_name: null }));
        db.removeWatchStock("600519.SH");
        expect(db.listWatchStocks()).toEqual([]);
    });

    test("股票分组可调整顺序并始终将未分组排在最后", async () => {
        const db = await MarketDatabase.create();
        const first = db.saveStockGroup("第一组");
        db.saveStockGroup("第二组");
        const third = db.saveStockGroup("第三组");
        db.saveWatchStock("600001.SH", "第一组股票", first.id);
        db.saveWatchStock("600002.SH", "第三组股票", third.id);
        db.saveWatchStock("600003.SH", "未分组股票", null);
        App.marketDb = db;

        MarketDataService.moveStockGroup(third.id, "before");

        expect(db.listStockGroups().map(group => group.name)).toEqual(["指数", "第一组", "第三组", "第二组"]);
        expect(db.listWatchStocks().map(stock => stock.code)).toEqual(["600001.SH", "600002.SH", "600003.SH"]);
        const bytes = db.db.export();
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const reloaded = await MarketDatabase.load({ arrayBuffer: async () => buffer });
        expect(reloaded.listStockGroups().map(group => group.name)).toEqual(["指数", "第一组", "第三组", "第二组"]);
    });

    test("通过六位代码添加观察股票并在筛选数据中携带分组", async () => {
        App.marketDb = await MarketDatabase.create();
        const group = MarketDataService.addStockGroup("核心观察");
        const stock = await MarketDataService.addWatchStock("600519", group.id, {
            fetchInfo: async code => ({ code, name: "虚构股票" })
        });

        expect(stock.code).toBe("600519.SH");
        expect(MarketDataService.getStockOptions()).toEqual(expect.arrayContaining([
            expect.objectContaining({
                code: "600519.SH", name: "虚构股票", groupName: "核心观察", isWatched: true
            })
        ]));
        await expect(MarketDataService.addWatchStock("60051", group.id, {
            fetchInfo: async code => ({ code, name: "无效股票" })
        })).rejects.toThrow("6 位数字");
        await expect(MarketDataService.addWatchStock("600519", group.id, {
            fetchInfo: async code => ({ code, name: "重复股票" })
        })).rejects.toThrow("已在观察列表");
    });

    test("指数只能添加到系统指数分组且股票可移动到该分组", async () => {
        App.marketDb = await MarketDatabase.create();
        const indexGroup = MarketDataService.getIndexGroup();
        const index = await MarketDataService.addIndex("1A0001", {
            fetchInfo: async code => ({ code, name: "虚构上证指数" })
        });
        const normalGroup = MarketDataService.addStockGroup("普通股票");
        await MarketDataService.addWatchStock("600519", normalGroup.id, {
            fetchInfo: async code => ({ code, name: "虚构股票" })
        });

        expect(index).toEqual(expect.objectContaining({ code: "000001.SH", group_id: indexGroup.id }));
        expect(MarketDataService.getIndexOptions().map(item => item.code)).toEqual(["000001.SH"]);
        MarketDataService.moveWatchStock("600519.SH", indexGroup.id);
        expect(MarketDataService.getIndexOptions().map(item => item.code)).toEqual(["000001.SH", "600519.SH"]);
        expect(() => MarketDataService.deleteStockGroup(indexGroup.id)).toThrow("不可删除");
    });

    test("行情 DB 独立保存股票、大盘、默认范围并支持按股票移除", async () => {
        const db = await MarketDatabase.create();
        db.setDefaultRange("2020-01-01", "2026-01-01");
        db.saveStock("600519.SH", "贵州茅台", "2025-01-01", "2025-01-02", [{
            date: "2025-01-02", open: 10, close: 11, high: 12, low: 9, volume: 100, amount: 1000,
            turnoverRate: 1.5, ma5: null, ma30: null
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
        expect(db.getStockDaily("600519.SH", "2025-01-01", "2025-12-31")[0]).toEqual(expect.objectContaining({
            close: 11, turnover_rate: 1.5
        }));
        expect(db.getStockValuation("600519.SH", "2025-01-01", "2025-12-31")[0].dividend_yield).toBe(3);
        expect(db.getMarketDaily("2025-01-01", "2025-12-31")[0].turnover_trillion).toBe(1.2);

        db.removeStock("600519.SH");
        expect(db.listTargets("600519.SH")).toHaveLength(1);
        expect(db.getInstrument("600519.SH")).toBeNull();
        expect(db.getStockDaily("600519.SH", "2025-01-01", "2025-12-31")).toEqual([]);
        expect(db.getInstrument("MARKET")).not.toBeNull();
    });
});
