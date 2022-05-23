import { BaseRepo } from '../repo/base_repo';
import { BaseEntity } from './base_entity';
import {IncomeExpenditureRepo} from '../repo/income_expenditure_repo';

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

    save() {
        this.gmtModified = new Date()
        if(this.money*this.type.code < 0) {
            this.money = -1 * this.money
        }
        IncomeExpenditureDetail.repo.upsert(this)
    }
}


class IncomeExpenditureType {
    static Incomme = {
        salary: new IncomeExpenditureType(10000, "薪水"),
        luckmoney: {
            self: new IncomeExpenditureType(20000, "红包"),
            work: new IncomeExpenditureType(20001, "红包-工作"),
            home: new IncomeExpenditureType(20002, "红包-家人"),
        },
    };

    static Expenditure = {
        home: {
            self: new IncomeExpenditureType(-10000, "住房"),
            rent: new IncomeExpenditureType(-10001, "住房-房租"),
            utility: new IncomeExpenditureType(-10002, "住房-水电"),
        }
    }

    constructor(code, name) {
        this.code = code
        this.name = name
    }

    static getByCode(code) {
        for(const type of this.values()) {
            if(type.code === code) {
                return type
            }
        }
        return null
    }

    static toList(data) {
        if(data instanceof IncomeExpenditureType) {
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
        return this.toList(this.Incomme).concat(this.toList(this.Expenditure))
    }
}

export {IncomeExpenditureDetail, IncomeExpenditureType}
