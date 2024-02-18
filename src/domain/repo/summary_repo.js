import { App } from '../../app';
import { SummaryData, SummaryType } from '../entity/summary';
import { BaseRepo } from './base_repo';

class SummaryDataRepo extends BaseRepo {

    constructor() {
        super()
        this.tablename = "data_summary"
    }

    /**
      * @param {SummaryData} entity 
      */
    upsert(entity) {
        let gmtCreate = BaseRepo.getDateStr(entity.gmtCreate, true)
        let gmtModified = BaseRepo.getDateStr(entity.gmtModified)
        if (entity.id == null) {
            App.db?.insert(this.tablename, ['gmt_create', 'gmt_modified', 'type', 'time', 'money'], [gmtCreate, gmtModified,
                entity.type.code, entity.time.timeStr(), entity.money])
        } else {
            App.db?.update(this.tablename, entity.id, ['gmt_create', 'gmt_modified', 'type', 'time', 'money'], [gmtCreate, gmtModified,
                entity.type.code, entity.time.timeStr(), entity.money])
        }
    }

    selectAllMonthKey() {
        return this.convert(App.db?.select(this.tablename, ['type'], [SummaryType.BY_MONTH_KEY.code], ['=']))
    }

    convert(content) {
        let result = []
        if(content === undefined || content[0] === undefined) {
            return result
        }
        for (const data of content[0].values) {
            let detail = new SummaryData()
            detail.id = data[0]
            detail.gmtCreate = new Date(data[1])
            detail.gmtModified = new Date(data[2])
            detail.type = SummaryType.getByCode(data[3])
            detail.time = new Date(data[4])
            detail.money = data[5]
            result.push(detail)
        }
        return result
    }
}

export { SummaryDataRepo };
