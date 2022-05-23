const { IncomeExpenditureDetail, IncomeExpenditureType } = require("../entity/income_expenditure")

class IncomeExpenditureService {
    /**
     * @param {Date} happenTime 
     */
    static addIncome(happenTime) {
        var detail = new IncomeExpenditureDetail()
        detail.type = IncomeExpenditureType.Income_salary
        detail.money = 2091000
        detail.happenTime = new Date()
        detail.save()
    }
}