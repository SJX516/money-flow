import { BaseRepo } from './base_repo';
import { App } from '../..';
import { InvestmentDetail, InvestmentProduct, InvestmentProductReal, InvestmentRecordType, InvestmentType} from '../entity/investment';

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
            App.db?.insert(this.tablename, ['gmt_create', 'gmt_modified', 'name', 'type', 'desc'], [gmtCreate, gmtModified,
                entity.name, entity.type.code, entity.desc])
        } else {
            App.db?.update(this.tablename, entity.id, ['gmt_create', 'gmt_modified', 'name', 'type', 'desc'], [gmtCreate, gmtModified,
                entity.name, entity.type.code, entity.desc])
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
            'product_id', 'product_name', 'money', 'happen_time', 'buy_sell_id', 'record_type'], [gmtCreate, gmtModified,
                 detail.productId, detail.productName, detail.money, happenTime, detail.buySellId, detail.recordType.code])
        } else {
            App.db?.update(this.tablename, detail.id, ['gmt_create', 'gmt_modified', 
            'product_id', 'product_name', 'money', 'happen_time', 'buy_sell_id_id', 'record_type'], [gmtCreate, gmtModified,
                detail.productId, detail.productName, detail.money, happenTime, detail.buySellId, detail.recordType.code])
            return detail.id
        }
    }

    select(productId, recordType, startTime, endTime) {
        if(startTime != null && endTime < startTime) {
            throw new Error("结束时间不能小于开始时间")
        }
        if(startTime == null) {
            return this.convert(App.db?.select(this.tablename, ["product_id", "record_type", "happen_time"],
            [productId, recordType.code, endTime.timeStr()], ['=', '=', '<']))
        } else {
            return this.convert(App.db?.select(this.tablename, ["product_id", "record_type", "happen_time", "happen_time"],
            [productId, recordType.code, startTime.timeStr(), endTime.timeStr()], ['=', '=', '>', '<']))
        }
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
            detail.money = data[5]
            detail.happenTime = new Date(data[6])
            detail.buySellId = data[7]
            detail.recordType = InvestmentRecordType.getByCode(data[8])
            result.push(detail)
        }
        return result
    }
}

export { InvestmentProductRepo, InvestmentDetailRepo}