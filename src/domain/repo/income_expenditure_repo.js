import { BaseRepo } from './base_repo';
import { IncomeExpenditureDetail, IncomeExpenditureType } from '../entity/income_expenditure';
import { App } from '../..';

class IncomeExpenditureRepo extends BaseRepo {

    constructor() {
        super()
        this.tablename = "income_expenditure_detail"
    }

    /**
      * @param {IncomeExpenditureDetail} detail 
      */
    upsert(detail) {
        let gmtCreate = BaseRepo.getDateStr(detail.gmtCreate, true)
        let gmtModified = BaseRepo.getDateStr(detail.gmtModified)
        let happenTime = BaseRepo.getDateStr(detail.happenTime)
        if (detail.id == null) {
            App.db?.insert(this.tablename, ['gmt_create', 'gmt_modified', 
            'type', 'desc', 'money', 'happen_time'], [gmtCreate, gmtModified,
                 detail.type.code, detail.desc, detail.money, happenTime])
        } else {
            App.db?.update(this.tablename, detail.id, ['gmt_create', 'gmt_modified', 
            'type', 'desc', 'money', 'happen_time'], [gmtCreate, gmtModified,
                detail.type.code, detail.desc, detail.money, happenTime])
        }
    }

    select(startTime, endTime) {
        if(endTime < startTime) {
            throw new Error("结束时间不能小于开始时间")
        }
        return this.convert(App.db?.select(this.tablename, ["happen_time", "happen_time"],
         [startTime.timeStr(), endTime.timeStr()], ['>', '<']))
    }

    convert(content) {
        let result = []
        if(content === undefined || content[0] === undefined) {
            return result
        }
        for(const data of content[0].values) {
            let detail = new IncomeExpenditureDetail()
            detail.id = data[0]
            detail.gmtCreate = new Date(data[1])
            detail.gmtModified = new Date(data[2])
            detail.type = IncomeExpenditureType.getByCode(data[3])
            detail.desc = data[4]
            detail.money = data[5]
            detail.happenTime = new Date(data[6])
            result.push(detail)
        }
        return result
    }
}

export {IncomeExpenditureRepo}