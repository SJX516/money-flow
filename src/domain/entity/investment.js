import { InvestmentDetailRepo, InvestmentProductRepo } from '../repo/investment_repo';
import { BaseEntity } from './base_entity';

//投资产品
class InvestmentProduct extends BaseEntity {
    //产品名称
    name = null
    /**
     * @type {InvestmentType}
     */
    type = null
    desc = null

    static repo = new InvestmentProductRepo()

    static queryAll() {
        return this.repo.selectAll()
    }

    static delete(id) {
        InvestmentProduct.repo.delete(id)
    }

    static 

    save() {
        this.gmtModified = new Date()
        InvestmentProduct.repo.upsert(this)
    }
}

//投资明细
 class InvestmentDetail extends BaseEntity {
    productId = null
    productName = null
    //分为单位，买入为正，卖出为负
    money = null
    //实际发生时间，不确定可以填月初
    happenTime = null
    /**
     * 相关联的 买入/卖出 事件ID
     */
    buySellId = null
    /**
     * @type {InvestmentRecordType}
     */
    recordType = null

    static repo = new InvestmentDetailRepo()

    static query(id) {
        return this.repo.get(id)
    }

    static queryTimeBetwen(productId, recordType, startTime, endTime) {
        return this.repo.select(productId, recordType, startTime, endTime)
    }

    save() {
        this.gmtModified = new Date()
        return InvestmentDetail.repo.upsert(this)
    }

    delete() {
        InvestmentDetail.repo.delete(this.id)
        if(this.type.code === InvestmentRecordType.BuySell.code) {
            InvestmentDetail.repo.deleteBySellId(this.buySellId)
        }
    }
}

class InvestmentRecordType {
    static BuySell = new InvestmentRecordType(1, "买入或卖出")
    static CurrentPrice = new InvestmentRecordType(2, "现价")
    static Profit = new InvestmentRecordType(3, "收益")

    constructor(code, name) {
        this.code = code
        this.name = name
    }

    static getByCode(code) {
        for(const type of this.values()) {
            if(type.code == code) {
                return type
            }
        }
        return null
    }

    static values() {
        return [this.BuySell, this.CurrentPrice, this.Profit]
    }
}

class InvestmentType {
    static Product = {
        saving: new InvestmentType(1000000, "储蓄"),
        stock_fund: new InvestmentType(2000000, "股票类基金"),
        etf: new InvestmentType(3000000, "指数类基金"),
        bond: new InvestmentType(4000000, "债券类基金"),
        stock: new InvestmentType(5000000, "股票"),
    };

    constructor(code, name) {
        this.code = code
        this.name = name
    }

    static getByCode(code) {
        for(const type of this.values()) {
            if(type.code == code) {
                return type
            }
        }
        return null
    }

    static toList(data) {
        if(data instanceof InvestmentType) {
            return [data]
        } else {
            let keys = Object.keys(data)
            let result = []
            for(const key of keys) {
                result = result.concat(this.toList(data[key]))
            }
            return result
        }
    }

    static values() {
        return this.toList(this.Product)
    }
}

export {InvestmentProduct, InvestmentType, InvestmentRecordType, InvestmentDetail}
