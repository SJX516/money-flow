import { DataUtil, MoneyUtil, TimeUtil } from "../../utils/utils"
import { IncomeExpenditureDetail } from "../entity/income_expenditure"
import { IncomeExpenditureService } from "./income_expenditure_service"
import InvestmentService from "./investment_service"

class IncomeExpenditureVMService {

    static queryMonthData(monthDate) {
        return this._calIncomeExpendData(IncomeExpenditureService.queryMonth(monthDate))
    }

    static queryYearData(startMonthDate) {
        let data = this._calIncomeExpendData(IncomeExpenditureService.queryTimeBetwen(
            TimeUtil.monthStart(startMonthDate), TimeUtil.yearEnd(startMonthDate)))
        let incomeDetailByMonth = this._calSumByMonth(data['income']['details'])
        let expendDetailByMonth = this._calSumByMonth(data['expend']['details'])
        data['income']['sumByMonth'] = incomeDetailByMonth
        data['expend']['sumByMonth'] = expendDetailByMonth
        return data
    }

    static _calSumByMonth(details) {
        let sumByMonth = {}
        for(const detail of details) {
            let monthStr = TimeUtil.monthStr(detail.happenTime)
            if(!(monthStr in sumByMonth)) {
                sumByMonth[monthStr] = 0
            }
            sumByMonth[monthStr] += detail.money
        }
        return Object.keys(sumByMonth).map(month => {
            return {
                "month": month,
                "total": sumByMonth[month]
            }
        })
    }

    static _calIncomeExpendData(details) {
        let result = {
            'income': {
                'total': 0,
                'details': []
            },
            'expend': {
                'total': 0,
                'details': []
            }
        }
        details.sort((a, b) => Math.abs(a.type.code) > Math.abs(b.type.code) ? 1 : -1).forEach(detail => {
            let obj = result['expend']
            if (detail.type.code > 0) {
                obj = result['income']
            }
            obj.details.push(this._newEntityFromDetail(detail))
            obj.total += detail.money
        })
        return result
    }

    /**
     * @param {IncomeExpenditureDetail} detail 
     */
    static _newEntityFromDetail(detail) {
        return {
            id: detail.id,
            happenTime: detail.happenTime,
            title: detail.type.name,
            money: detail.money,
            desc: detail.desc,
            type: detail.type
        }
    }
}

class InvestmentVMService {

    static queryMonthData(monthDate) {
        let startDate = TimeUtil.monthStart(monthDate)
        let endDate = TimeUtil.monthEnd(monthDate)
        let investMap = InvestmentService.getAllInvestDetailBefore(endDate)

        return {
            "asset": this._getInvestSummary(investMap.asset, startDate, endDate),
            "debt": this._getInvestSummary(investMap.debt, startDate, endDate),
            "fund": this._getInvestSummary(investMap.fund, startDate, endDate),
            "stock": this._getInvestSummary(investMap.stock, startDate, endDate),
        }
    }

    static queryYearData(startMonthDate) {
        let startDate = TimeUtil.monthStart(startMonthDate)
        let endDate = TimeUtil.yearEnd(startMonthDate)
        let investMap = InvestmentService.getAllInvestDetailBefore(endDate)

        return {
            "asset": this._getInvestSummary(investMap.asset, startDate, endDate),
            "debt": this._getInvestSummary(investMap.debt, startDate, endDate),
            "fund": this._getInvestSummary(investMap.fund, startDate, endDate),
            "stock": this._getInvestSummary(investMap.stock, startDate, endDate),
        }
    }

    static getPaperProfit(product) {
        if(DataUtil.isNull(product)) {
            return 0
        }
        return product.currentPrice?.money - product.buySells?.totalMoney
    }

    static getPaperProfitPercent(product) {
        return MoneyUtil.safeDivision(this.getPaperProfit(product), product.buySells?.totalMoney)
    }

    static getSellProfitPercent(product) {
        return MoneyUtil.safeDivision(product.profits?.filterTotalMoney, Math.abs(product.buySells?.filterSellMoney))
    }

    static _getInvestSummary(details, startTimeDate, endTimeDate) {
        let profitSummary = this._getProfitSummary(details, startTimeDate, endTimeDate)
        return {
            "totalMoneys": this._getTotalMoney(details),
            "totalProfitMoneys": [profitSummary[0], profitSummary[1]],
            "products": profitSummary[2] 
        }
    }

    static _getProfitSummary(details, startTimeDate, endTimeDate) {
        let totalProfitMoney = 0
        let totalFilterProfitMoney = 0
        let products = {}
        for (let productId of Object.keys(details)) {
            let detail = details[productId]
            if (!DataUtil.isNull(detail['profits'])) {
                let filterTotalMoney = 0
                let filterDatas = []
                detail['profits']['datas'].forEach(ele => {
                    if (TimeUtil.inTime(ele.happenTime, startTimeDate, endTimeDate)) {
                        filterTotalMoney += ele.money
                        filterDatas.push(ele)
                    }
                })
                totalProfitMoney += detail['profits']['totalMoney']
                if(filterTotalMoney !== 0) {
                    totalFilterProfitMoney += filterTotalMoney
                    detail['profits']['filterDatas'] = filterDatas
                    detail['profits']['filterTotalMoney'] = filterTotalMoney
                }
            }
            if (!DataUtil.isNull(detail['buySells'])) {
                let filterMoney = 0
                let filterSellMoney = 0
                let filterTotalCount = 0
                let filterDatas = []
                detail.buySells.datas.forEach(ele => {
                    if (TimeUtil.inTime(ele.happenTime, startTimeDate, endTimeDate)
                        && ele.money !== 0) {
                        filterMoney += ele.money
                        if(ele.money < 0) {
                            filterSellMoney += ele.money
                        }
                        if(!DataUtil.notNumber(ele.count)) {
                            filterTotalCount += ele.count
                        }
                        filterDatas.push(ele)
                    }
                })
                detail['buySells']['filterMoney'] = filterMoney
                detail['buySells']['filterSellMoney'] = filterSellMoney
                detail['buySells']['filterTotalCount'] = filterTotalCount
                detail['buySells']['filterDatas'] = filterDatas
            }
            products[productId] = detail
        }
        return [totalProfitMoney, totalFilterProfitMoney, products]
    }

    static _getTotalMoney(details) {
        let totalCurrentPrice = 0, totalBuySellMoney = 0
        for (let productId of Object.keys(details)) {
            let detail = details[productId]
            if (!DataUtil.isNull(detail.currentPrice)) {
                totalCurrentPrice += detail.currentPrice.money
            }
            if (!DataUtil.isNull(detail.buySells)) {
                totalBuySellMoney += detail.buySells.totalMoney
            }
        }
        return [totalCurrentPrice, totalBuySellMoney]
    }
}

export { IncomeExpenditureVMService , InvestmentVMService}