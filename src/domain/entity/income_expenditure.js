import { IncomeExpenditureRepo } from '../repo/income_expenditure_repo';
import { IncomeExpenditureService } from '../service/income_expenditure_service';
import { BaseEntity } from './base_entity';
import { UserConfig, UserConfigStatus, UserConfigType } from './user_entity';

//'收入/支出' 表
class IncomeExpenditureDetail extends BaseEntity {
    /**
     * @type {IncomeExpenditureType}
     */
    type = null;
    //额外描述，备注
    desc = null;
    //分为单位，流入为正，流出为负
    money = null;
    //实际发生时间，不确定可以填月初
    happenTime = null;

    static repo = new IncomeExpenditureRepo()

    static query(id) {
        return this.repo.get(id)
    }

    static queryTimeBetwen(startTime, endTime) {
        return this.repo.select(startTime, endTime)
    }

    static delete(id) {
        IncomeExpenditureDetail.repo.delete(id)
    }

    save() {
        this.gmtModified = new Date()
        if(this.money*this.type.code < 0) {
            this.money = -1 * this.money
        }
        IncomeExpenditureDetail.repo.upsert(this)
    }
}

class IncomeExpenditureType {

    /**
     * @param {UserConfig} config 
     */
    constructor(config) {
        this.config = config;
        this.code = config.code;
        this.name = config.name;
    }

    /**
     * @param {number} code 
     * @returns {IncomeExpenditureType}
     */
    static getByCode(code) {
        return IncomeExpenditureService.getIncomeExpendTypeByCode(code);
    }

    getGroup() {
        return IncomeExpenditureService.getIncomeExpendGroupByCode(this.code);
    }

    isIncome() {
        return this.config.type == UserConfigType.IncomeType;
    }

    isEnable() {
        return this.config.status == UserConfigStatus.Normal;
    }
}

export { IncomeExpenditureDetail, IncomeExpenditureType };

