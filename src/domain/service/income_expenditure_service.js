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
    static queryMonth(month) {
        let startDate = TimeUtil.monthStart(new Date(month))
        return IncomeExpenditureDetail.queryTimeBetwen(startDate, TimeUtil.monthEnd(startDate))
    }

    /**
     * @param {IncomeExpenditureDetail} detail 
     */
    static delete(detail) {
        IncomeExpenditureDetail.delete(detail.id)
    }


}

export {IncomeExpenditureService}