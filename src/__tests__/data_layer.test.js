import { App } from "../app";
import { IncomeExpenditureDetail, IncomeExpenditureType } from "../domain/entity/income_expenditure";
import { InvestmentDetail, InvestmentRecordType, InvestmentType } from "../domain/entity/investment";

describe('数据访问层', () => {
    beforeEach(async () => {
        await App.createDb()
    })

    test('收入支出写入时自动修正符号并可按时间范围读取', () => {
        const detail = new IncomeExpenditureDetail()
        detail.type = IncomeExpenditureType.getByCode(-20000)
        detail.money = 1234
        detail.desc = '测试支出'
        detail.happenTime = new Date('2026-03-15 12:00:00')
        detail.save()

        const rows = IncomeExpenditureDetail.queryTimeBetwen(
            new Date('2026-03-01 00:00:00'), new Date('2026-04-01 00:00:00')
        )
        expect(rows).toHaveLength(1)
        expect(rows[0]).toEqual(expect.objectContaining({ money: -1234, desc: '测试支出' }))
        expect(rows[0].type.code).toBe(-20000)
    })

    test('收入支出更新保留 id 且不新增重复记录', () => {
        const type = IncomeExpenditureType.getByCode(10000)
        const detail = new IncomeExpenditureDetail()
        detail.type = type
        detail.money = 100
        detail.happenTime = new Date('2026-04-10 12:00:00')
        detail.save()
        const saved = IncomeExpenditureDetail.queryTimeBetwen(
            new Date('2026-04-01'), new Date('2026-05-01')
        )[0]
        saved.money = 250
        saved.desc = '已更新'
        saved.save()
        const rows = IncomeExpenditureDetail.queryTimeBetwen(
            new Date('2026-04-01'), new Date('2026-05-01')
        )
        expect(rows).toHaveLength(1)
        expect(rows[0]).toEqual(expect.objectContaining({ id: saved.id, money: 250, desc: '已更新' }))
    })

    test('删除买卖记录时级联删除其现价和利润关联记录', () => {
        const buySell = new InvestmentDetail()
        Object.assign(buySell, {
            productId: 9, productName: '测试股票', productType: InvestmentType.Product.stock,
            money: 1000, happenTime: new Date('2026-05-10 12:00:00'),
            recordType: InvestmentRecordType.BuySell
        })
        const buySellId = buySell.save()
        for (const recordType of [InvestmentRecordType.CurrentPrice, InvestmentRecordType.Profit]) {
            const related = new InvestmentDetail()
            Object.assign(related, {
                productId: 9, productName: '测试股票', productType: InvestmentType.Product.stock,
                money: 100, happenTime: new Date('2026-05-10 12:00:00'), recordType,
                buySellId
            })
            related.save()
        }
        InvestmentDetail.query(buySellId)[0].delete()
        expect(InvestmentDetail.queryTimeBetwen(9, null, null, null)).toEqual([])
    })

    test('时间范围结束早于开始时拒绝查询', () => {
        expect(() => InvestmentDetail.queryTimeBetwen(
            null, null, new Date('2026-06-02'), new Date('2026-06-01')
        )).toThrow('结束时间不能小于开始时间')
    })
})
