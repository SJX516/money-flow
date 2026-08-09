import { IncomeExpenditureType } from "../entity/income_expenditure";
import { DataUtil, MoneyUtil, TimeUtil } from "../../utils/utils";
import { InvestmentVMService } from "./view_model_service";

class ReportCalculationService {
    static newEntity(happenTime, title, money, desc, child = []) {
        return { happenTime, title, money, desc, child }
    }

    static findProduct(investData, productId) {
        for (const type of ['fund', 'stock', 'asset', 'debt']) {
            const product = investData?.[type]?.products?.[productId]
            if (product) return product
        }
        return null
    }

    static getPeriodProfit(entity, previousInvestData) {
        const previous = this.findProduct(previousInvestData, entity.info.productId)
        const previousPaperProfit = InvestmentVMService.getPaperProfit(previous)
        const paperProfit = InvestmentVMService.getPaperProfit(entity)
        const realizedProfit = DataUtil.safeGetNumber(entity.profits?.filterTotalMoney)
        return realizedProfit + paperProfit - previousPaperProfit
    }

    static getPeriodProfitPercent(entity, previousInvestData) {
        return MoneyUtil.safeDivision(
            this.getPeriodProfit(entity, previousInvestData),
            entity?.buySells?.totalMoney
        )
    }

    static getTotalMoney(investData) {
        return investData.asset.totalMoneys[0]
            + investData.debt.totalMoneys[0]
            + investData.fund.totalMoneys[1]
            + investData.stock.totalMoneys[1]
    }

    static productsToRows(productMap, hideEmpty = false) {
        return Object.keys(productMap).reduce((rows, productId) => {
            const product = productMap[productId]
            const empty = MoneyUtil.noValue(product.currentPrice?.money)
                && MoneyUtil.noValue(product.profits?.filterTotalMoney)
                && MoneyUtil.noValue(product.buySells?.filterMoney)
                && MoneyUtil.noValue(product.buySells?.totalMoney)
            if (!hideEmpty || !empty) rows.push({ key: productId, entity: product })
            return rows
        }, [])
    }

    static getProductProfitEntities(products) {
        if (DataUtil.isEmpty(products)) return []
        return Object.values(products).flatMap(product =>
            (product.profits?.filterDatas || []).map(data =>
                this.newEntity(data.happenTime, data.productName, data.money, null)
            )
        )
    }

    static getPassiveSummary(investData, productTypes) {
        const summaries = productTypes.map(type => investData[type])
        return {
            total: summaries.reduce((sum, data) => sum + data.totalProfitMoneys[1], 0),
            details: summaries.flatMap(data => this.getProductProfitEntities(data.products))
        }
    }

    static getYearPassiveIncomeSummary(investData) {
        const names = { asset: '资产收入', fund: '投资收入', stock: '股票收入' }
        const types = Object.keys(names)
        return {
            total: types.reduce((sum, type) => sum + investData[type].totalProfitMoneys[1], 0),
            details: types.map(type => this.newEntity(
                null, names[type], investData[type].totalProfitMoneys[1]
            ))
        }
    }

    static getYearPassiveExpendSummary(investData) {
        const total = investData.debt.totalProfitMoneys[1]
        return { total, details: [this.newEntity(null, '负债支出', total)] }
    }

    static aggregateByGroup(details) {
        const groups = {}
        let total = 0
        details.forEach(detail => {
            const type = IncomeExpenditureType.getByCode(detail.type.code)
            const group = type.getGroup()
            if (!groups[group.code]) {
                groups[group.code] = { name: group.name, code: group.code, value: 0, details: {} }
            }
            const money = Math.abs(detail.money / 100)
            const groupData = groups[group.code]
            groupData.value += money
            total += money
            if (!groupData.details[type.code]) {
                groupData.details[type.code] = { name: type.name, code: type.code, value: 0 }
            }
            groupData.details[type.code].value += money
        })
        return Object.values(groups).map(group => ({
            ...group,
            valuePercent: total > 0 ? group.value / total : 0,
            details: Object.values(group.details)
        })).sort((a, b) => DataUtil.compare(a.code, b.code))
    }

    static aggregateByMonthAndType(details, groupCode) {
        const values = {}
        let total = 0
        details.forEach(detail => {
            const type = IncomeExpenditureType.getByCode(detail.type.code)
            const group = type.getGroup()
            if (group.code !== groupCode) return
            const month = TimeUtil.monthStr(detail.happenTime)
            const key = `${month}_${type.code}`
            if (!values[key]) {
                values[key] = {
                    name: type.name, code: type.code, groupCode: group.code,
                    groupName: group.name, month, value: 0
                }
            }
            const money = Math.abs(detail.money / 100)
            values[key].value += money
            total += money
        })
        return Object.values(values).map(value => ({
            ...value,
            valuePercent: total > 0 ? value.value / total : 0
        })).sort((a, b) => a.month === b.month
            ? DataUtil.compare(a.code, b.code)
            : (a.month > b.month ? 1 : -1))
    }

    static getExpenseChartData(details, getType, getGroup) {
        if (!Array.isArray(details)) return []
        const categories = {}
        details.forEach(detail => {
            if (!detail.type) return
            const type = getType(detail.type.code)
            const group = getGroup(detail.type.code)
            if (!group) return
            if (!categories[group.code]) {
                categories[group.code] = { name: group.name, total: 0, subs: {} }
            }
            const category = categories[group.code]
            const money = Math.abs(detail.money || 0)
            category.total += money
            if (!category.subs[type.code]) {
                category.subs[type.code] = { name: type.name, total: 0, details: [] }
            }
            category.subs[type.code].total += money
            category.subs[type.code].details.push({
                money: detail.money, desc: detail.desc, happenTime: detail.happenTime
            })
        })
        const result = Object.values(categories)
        const total = result.reduce((sum, category) => sum + category.total, 0)
        return result.map(category => ({
            type: category.name,
            value: category.total,
            percent: total > 0 ? category.total / total : 0,
            subs: category.subs
        }))
    }

    static getSubChartData(subs) {
        const values = Object.values(subs || {})
        const total = values.reduce((sum, sub) => sum + sub.total, 0)
        return values.map(sub => ({
            type: sub.name,
            value: sub.total,
            percent: total > 0 ? sub.total / total : 0,
            details: sub.details
        }))
    }
}

export { ReportCalculationService }
