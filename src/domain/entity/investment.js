import { DataUtil } from '../../utils/utils';
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
    fixVote = null

    static repo = new InvestmentProductRepo()

    static queryAll() {
        return this.repo.selectAll()
    }

    static delete(id) {
        InvestmentProduct.repo.delete(id)
    }

    save() {
        this.gmtModified = new Date()
        if(DataUtil.isNull(this.fixVote)) {
            this.fixVote = 0
        }
        InvestmentProduct.repo.upsert(this)
    }
}

//投资明细
 class InvestmentDetail extends BaseEntity {
    productId = null
    productName = null
    /**
     * @type {InvestmentType}
     */
    productType = null
    //分为单位，买入为正，卖出为负
    money = null
    //份数，只在表示股票时候可能存在，用于计算成本价
    count = null
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
        if(this.recordType.code === InvestmentRecordType.BuySell.code) {
            InvestmentDetail.repo.deleteBySellId(this.id)
        }
        InvestmentDetail.repo.delete(this.id)
    }
}

class InvestmentRecordType {
    static BuySell = new InvestmentRecordType(1, "买入或卖出")
    static CurrentPrice = new InvestmentRecordType(2, "投资类现价")
    static Profit = new InvestmentRecordType(3, "投资类收益")
    static AssetDebtCurrentPrice = new InvestmentRecordType(4, "资产/负债类现价")
    static AssetDebtProfit = new InvestmentRecordType(5, "资产/负债类收益")

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
        return [this.BuySell, this.CurrentPrice, this.Profit, this.AssetDebtCurrentPrice, this.AssetDebtProfit]
    }
}

class InvestmentType {
    static Product = {
        saving: new InvestmentType(1000000, "现金类资产"),
        stock_fund: new InvestmentType(2000000, "股票类基金"),
        etf: new InvestmentType(3000000, "指数类基金"),
        bond: new InvestmentType(4000000, "债券类基金"),
        stock: new InvestmentType(5000000, "股票"),
        debt: new InvestmentType(6000000, "负债"),
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

    isAsset() {
        return this === InvestmentType.Product.saving
    }

    isDebt() {
        return this === InvestmentType.Product.debt
    }
}

export {InvestmentProduct, InvestmentType, InvestmentRecordType, InvestmentDetail}
