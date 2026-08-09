import { App } from "../app";
import { IncomeExpenditureType } from "../domain/entity/income_expenditure";
import { IncomeExpenditureService } from "../domain/service/income_expenditure_service";
import { ReportCalculationService } from "../domain/service/report_calculation_service";

const summary = (current = 0, invested = 0, profit = 0, products = {}) => ({
    totalMoneys: [current, invested],
    totalProfitMoneys: [profit, profit],
    products
})

describe('ReportCalculationService', () => {
    beforeAll(async () => {
        await App.createDb()
    })

    test('计算总资产时资产负债取现值，基金股票取本金', () => {
        const data = {
            asset: summary(10000), debt: summary(-3000),
            fund: summary(12000, 9000), stock: summary(8000, 7000)
        }
        expect(ReportCalculationService.getTotalMoney(data)).toBe(23000)
    })

    test('计算期间利润包含已实现利润和账面利润变化', () => {
        const previousProduct = {
            currentPrice: { money: 1400 }, buySells: { totalMoney: 1000 }
        }
        const currentProduct = {
            info: { productId: 7 }, currentPrice: { money: 1800 },
            buySells: { totalMoney: 1200 }, profits: { filterTotalMoney: 50 }
        }
        const previous = {
            fund: summary(0, 0, 0, { 7: previousProduct }), stock: summary(),
            asset: summary(), debt: summary()
        }
        expect(ReportCalculationService.getPeriodProfit(currentProduct, previous)).toBe(250)
        expect(ReportCalculationService.getPeriodProfitPercent(currentProduct, previous)).toBeCloseTo(250 / 1200)
    })

    test('产品列表可过滤所有金额均为空或零的产品', () => {
        const products = {
            1: { currentPrice: { money: 0 } },
            2: { buySells: { totalMoney: 100 } }
        }
        expect(ReportCalculationService.productsToRows(products, true).map(row => row.key)).toEqual(['2'])
        expect(ReportCalculationService.productsToRows(products, false)).toHaveLength(2)
    })

    test('月度被动收入按产品明细汇总', () => {
        const detail = { happenTime: new Date('2026-01-10'), productName: '测试基金', money: 88 }
        const data = {
            asset: summary(), debt: summary(), stock: summary(0, 0, 12),
            fund: summary(0, 0, 88, { 1: { profits: { filterDatas: [detail] } } })
        }
        const result = ReportCalculationService.getPassiveSummary(data, ['asset', 'fund', 'stock'])
        expect(result.total).toBe(100)
        expect(result.details).toEqual([expect.objectContaining({ title: '测试基金', money: 88 })])
    })

    test('年度分类聚合保留分组、子类、金额和占比', () => {
        const salary = IncomeExpenditureType.getByCode(10000)
        const bonus = IncomeExpenditureType.getByCode(10002)
        const other = IncomeExpenditureType.getByCode(30000)
        const result = ReportCalculationService.aggregateByGroup([
            { type: salary, money: 10000 }, { type: bonus, money: 5000 },
            { type: other, money: 5000 }
        ])
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(expect.objectContaining({ code: 10000, value: 150, valuePercent: 0.75 }))
        expect(result[0].details).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 10000, value: 100 }),
            expect.objectContaining({ code: 10002, value: 50 })
        ]))
    })

    test('按月份和类型聚合时只统计指定分组并按月份排序', () => {
        const salary = IncomeExpenditureType.getByCode(10000)
        const bonus = IncomeExpenditureType.getByCode(10002)
        const other = IncomeExpenditureType.getByCode(30000)
        const result = ReportCalculationService.aggregateByMonthAndType([
            { type: bonus, money: 2000, happenTime: new Date('2026-02-02') },
            { type: salary, money: 1000, happenTime: new Date('2026-01-02') },
            { type: other, money: 9999, happenTime: new Date('2026-01-02') }
        ], 10000)
        expect(result.map(item => item.month)).toEqual(['2026-01', '2026-02'])
        expect(result.map(item => item.value)).toEqual([10, 20])
        expect(result.map(item => item.valuePercent)).toEqual([1 / 3, 2 / 3])
    })

    test('支出图表按一级与二级分类汇总并保留原始明细', () => {
        const daily = IncomeExpenditureType.getByCode(-20000)
        const taxi = IncomeExpenditureType.getByCode(-20001)
        const details = [
            { type: daily, money: -100, desc: '早餐' },
            { type: taxi, money: -300, desc: '地铁' }
        ]
        const result = ReportCalculationService.getExpenseChartData(
            details,
            code => IncomeExpenditureService.getIncomeExpendTypeByCode(code),
            code => IncomeExpenditureService.getIncomeExpendGroupByCode(code)
        )
        expect(result).toEqual([expect.objectContaining({ type: '日常', value: 400, percent: 1 })])
        expect(result[0].subs[-20001].details[0].desc).toBe('地铁')
    })

    test('空聚合不会产生 NaN 占比', () => {
        expect(ReportCalculationService.aggregateByGroup([])).toEqual([])
        expect(ReportCalculationService.aggregateByMonthAndType([], 10000)).toEqual([])
        expect(ReportCalculationService.getExpenseChartData([], () => null, () => null)).toEqual([])
    })
})
