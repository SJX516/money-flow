import { TimeUtil } from "../../utils/utils"
import { IncomeExpenditureDetail } from "../entity/income_expenditure"
import { IncomeExpenditureService } from "./income_expenditure_service"

class IncomeExpenditureVMService {

    static queryMonthData(monthDate) {
        return this._cal_income_expend_data(IncomeExpenditureService.queryMonth(monthDate))
    }

    static queryYearData(startMonthDate) {
        let data = this._cal_income_expend_data(IncomeExpenditureService.queryTimeBetwen(
            TimeUtil.monthStart(startMonthDate), TimeUtil.yearEnd(startMonthDate)))
        let incomeDetailByMonth = this._cal_sum_by_month(data['income']['details'])
        let expendDetailByMonth = this._cal_sum_by_month(data['expend']['details'])
        data['income']['sumByMonth'] = incomeDetailByMonth
        data['expend']['sumByMonth'] = expendDetailByMonth
        return data
    }

    static _cal_sum_by_month(details) {
        let sumByMonth = {}
        for(const detail of details) {
            let monthStr = TimeUtil.monthStr(detail.happenTime)
            if(!(monthStr in sumByMonth)) {
                sumByMonth[monthStr] = 0
            }
            sumByMonth[monthStr] += detail.money
        }
        return Object.keys(sumByMonth).map(month => {
            return this._newEntity(new Date(month), month, sumByMonth[month], null)
        })
    }

    static _cal_income_expend_data(details) {
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

    static _newEntity(happenTime, title, money, desc, child = []) {
        return {
            happenTime: happenTime,
            title: title,
            money: money,
            desc: desc,
            child: child
        }
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
        }
    }
}

export { IncomeExpenditureVMService }