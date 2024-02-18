import { App, DB_INIT } from '../../app';
import { InvestmentDetail, InvestmentProduct, InvestmentRecordType, InvestmentType } from '../entity/investment';
import { BaseRepo } from './base_repo';

class InvestmentProductRepo extends BaseRepo {

    constructor() {
        super()
        this.tablename = "investment_product"
    }

    /**
      * @param {InvestmentProduct} entity
      */
    upsert(entity) {
        let gmtCreate = BaseRepo.getDateStr(entity.gmtCreate, true)
        let gmtModified = BaseRepo.getDateStr(entity.gmtModified)
        if (entity.id == null) {
            App.db?.insert(this.tablename, ['gmt_create', 'gmt_modified', 'name', 'type', 'desc', 'fix_vote'], [gmtCreate, gmtModified,
                entity.name, entity.type.code, entity.desc, entity.fixVote])
        } else {
            App.db?.update(this.tablename, entity.id, ['gmt_create', 'gmt_modified', 'name', 'type', 'desc', 'fix_vote'], [gmtCreate, gmtModified,
                entity.name, entity.type.code, entity.desc, entity.fixVote])
        }
    }

    convert(content) {
        let result = []
        if(content === undefined || content[0] === undefined) {
            return result
        }
        for (const data of content[0].values) {
            let detail = new InvestmentProduct()
            detail.id = data[0]
            detail.gmtCreate = new Date(data[1])
            detail.gmtModified = new Date(data[2])
            detail.name = data[3]
            detail.type = InvestmentType.getByCode(data[4])
            detail.desc = data[5]
            detail.fixVote = data[6]
            result.push(detail)
        }
        return result
    }
}

class InvestmentDetailRepo extends BaseRepo {

    constructor() {
        super()
        this.tablename = "investment_detail"
    }

    /**
      * @param {InvestmentDetail} detail 
      */
    upsert(detail) {
        let gmtCreate = BaseRepo.getDateStr(detail.gmtCreate, true)
        let gmtModified = BaseRepo.getDateStr(detail.gmtModified)
        let happenTime = BaseRepo.getDateStr(detail.happenTime)
        if (detail.id == null) {
            return App.db?.insert(this.tablename, ['gmt_create', 'gmt_modified', 
            'product_id', 'product_name', 'product_type', 'money', 'happen_time', 'buy_sell_id', 'record_type', 'count'], [gmtCreate, gmtModified,
                 detail.productId, detail.productName, detail.productType.code, detail.money, 
                 happenTime, detail.buySellId, detail.recordType.code, detail.count])
        } else {
            App.db?.update(this.tablename, detail.id, ['gmt_create', 'gmt_modified', 
            'product_id', 'product_name', 'product_type', 'money', 'happen_time', 'buy_sell_id', 'record_type', 'count'], [gmtCreate, gmtModified,
                detail.productId, detail.productName, detail.productType.code, detail.money,
                happenTime, detail.buySellId, detail.recordType.code, detail.count])
            return detail.id
        }
    }

    select(productId, recordType, startTime, endTime) {
        if(!DB_INIT) {
            return []
        }
        if(startTime != null && endTime < startTime) {
            throw new Error("结束时间不能小于开始时间")
        }
        let cols = [], values = [], ops = []
        if(productId != null) {
            cols.push('product_id')
            values.push(productId)
            ops.push('=')
        }
        if(recordType != null) {
            cols.push('record_type')
            values.push(recordType.code)
            ops.push('=')
        }
        if(startTime != null) {
            cols.push('happen_time')
            values.push(startTime.timeStr())
            ops.push('>')
        }
        if(endTime != null) {
            cols.push('happen_time')
            values.push(endTime.timeStr())
            ops.push('<')
        }
        return this.convert(App.db?.selectAndOrder(this.tablename, cols, values, ops, ['happen_time desc', 'gmt_modified desc']))
    }

    selectBySellId(buySellId) {
        return this.convert(App.db?.select(this.tablename, ["buy_sell_id"],
         [buySellId], ['=']))
    }

    deleteBySellId(buySellId) {
        App.db?.delete(this.tablename, ["buy_sell_id"], [buySellId], ['='])
    }

    convert(content) {
        let result = []
        if(content === undefined || content[0] === undefined) {
            return result
        }
        for(const data of content[0].values) {
            let detail = new InvestmentDetail()
            detail.id = data[0]
            detail.gmtCreate = new Date(data[1])
            detail.gmtModified = new Date(data[2])
            detail.productId = data[3]
            detail.productName = data[4]
            detail.productType = InvestmentType.getByCode(data[5])
            detail.money = data[6]
            detail.happenTime = new Date(data[7])
            detail.buySellId = data[8]
            detail.recordType = InvestmentRecordType.getByCode(data[9])
            detail.count = data[10]
            result.push(detail)
        }
        return result
    }
}

export { InvestmentDetailRepo, InvestmentProductRepo };
