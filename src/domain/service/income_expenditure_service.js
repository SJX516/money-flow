import { TimeUtil } from "../../utils/utils"
import { IncomeExpenditureDetail, IncomeExpenditureType } from "../entity/income_expenditure"

class IncomeExpenditureService {

    static getIncomeTypes() {
        return IncomeExpenditureType.Incomme
    }

    static getExpenditureTypes() {
        return IncomeExpenditureType.Expenditure
    }

    /**
     * 
     * @param {IncomeExpenditureType} type
     * @param {Date} happenTime 
     */
    static upsert(money, type, happenTime, desc=null, id=null) {
        var detail = new IncomeExpenditureDetail()
        detail.id = id
        detail.type = type
        detail.desc = desc
        detail.money = money
        detail.happenTime = happenTime
        detail.save()
    }

    /**
     * 
     * @returns {Array[IncomeExpenditureDetail]}
     */
    static queryMonth(monthDate) {
        let startDate = TimeUtil.monthStart(monthDate)
        return IncomeExpenditureDetail.queryTimeBetwen(startDate, TimeUtil.monthEnd(startDate))
    }

    static queryTimeBetwen(startDate, endDate) {
        return IncomeExpenditureDetail.queryTimeBetwen(startDate, endDate)
    }

    static delete(id) {
        IncomeExpenditureDetail.delete(id)
    }
}

export {IncomeExpenditureService}