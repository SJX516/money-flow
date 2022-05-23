import { BaseRepo } from '../repo/base_repo';
import IncomeExpenditureRepo from '../repo/income_expenditure_repo';
import { BaseEntity } from './base_entity';

//投资产品
class InvestmentProduct extends BaseEntity {
    //产品名称
    name = null
    /**
     * @type {InvestmentProductType}
     */
    type = null
    desc = null
}

class InvestmentProductType {
    static Product_saving = new InvestmentProductType(1000000, "储蓄类");
    static Product_stock = new InvestmentProductType(2000000, "股票类");
    static Product_bond = new InvestmentProductType(3000000, "债券类");

    constructor(code, name) {
        this.code = code
        this.name = name
    }
}

//投资明细
 class InvestmentDetail {
    product_id = null
    product_name = null
    //分为单位，买入为正，卖出为负
    money = null
    //实际发生时间，不确定可以填月初
    happenTime = null

    save() {
        this.gmtCreate = BaseRepo.getDateStr(this.gmtCreate)
        this.gmtModified = new Date().timeStr()
        this.happenTime = BaseRepo.getDateStr(this.happenTime, allowNull=false)
    }

}

 //产品现值
 class InvestmentProductReal {
    product_id = null
    product_name = null
    //分为单位，当前产品的现价
    money = null
    //记录时间
    happenTime = null

    save() {
        this.gmtCreate = BaseRepo.getDateStr(this.gmtCreate)
        this.gmtModified = new Date().timeStr()
        this.happenTime = BaseRepo.getDateStr(this.happenTime, allowNull=false)
    }
}

//投资收益
class InvestmentProfit {
    product_id = null
    product_name = null
    //分为单位，正为正收益，负为负收益
    money = null
    //记录时间
    happenTime = null

    save() {
        this.gmtCreate = BaseRepo.getDateStr(this.gmtCreate)
        this.gmtModified = new Date().timeStr()
        this.happenTime = BaseRepo.getDateStr(this.happenTime, allowNull=false)
    }

}

export {InvestmentProduct, InvestmentProductType, InvestmentProductReal, InvestmentDetail, InvestmentProfit}
