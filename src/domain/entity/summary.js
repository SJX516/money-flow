import { SummaryDataRepo } from '../repo/summary_repo';
import { BaseEntity } from './base_entity';

//数据总结
class SummaryData extends BaseEntity {
    /**
     * @type {SummaryType}
     */
    type = null
    time = null
    money = null

    static repo = new SummaryDataRepo()

    static queryAllMonthKey() {
        return this.repo.selectAllMonthKey()
    }

    static delete(id) {
        this.repo.delete(id)
    }

    save() {
        this.gmtModified = new Date()
        SummaryData.repo.upsert(this)
    }
}

class SummaryType {
    static BY_MONTH_KEY = new SummaryType(1, "按月展示的可用月份")

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
        return [this.BY_MONTH_KEY]
    }
}

export { SummaryData, SummaryType };
