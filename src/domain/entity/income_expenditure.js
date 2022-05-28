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
        },
        daily: {
            self: new IncomeExpenditureType(-20000, "日常"),
            taxi: new IncomeExpenditureType(-20001, "日常-交通"),
            phone: new IncomeExpenditureType(-20002, "日常-话费"),
        },
        shopping: {
            self: new IncomeExpenditureType(-30000, "购物"),
            elc: new IncomeExpenditureType(-30001, "购物-电子"),
            life: new IncomeExpenditureType(-30002, "购物-生活"),
        },
        happy: {
            self: new IncomeExpenditureType(-40000, "娱乐"),
            online: new IncomeExpenditureType(-40001, "娱乐-线上"),
            offline: new IncomeExpenditureType(-40002, "娱乐-线下"),
        },
        food: {
            self: new IncomeExpenditureType(-50000, "餐饮"),
            canteen: new IncomeExpenditureType(-50001, "餐饮-食堂"),
            out: new IncomeExpenditureType(-50002, "餐饮-外出"),
        },
        family: {
            self: new IncomeExpenditureType(-60000, "家人"),
            traval: new IncomeExpenditureType(-60001, "家人-交通"),
            gift: new IncomeExpenditureType(-60002, "家人-礼物"),
        },
        study: {
            self: new IncomeExpenditureType(-70000, "学习"),
            online: new IncomeExpenditureType(-70001, "学习-线上"),
            offline: new IncomeExpenditureType(-70002, "学习-线下"),
        },
        health: {
            self: new IncomeExpenditureType(-80000, "健康"),
        },
        car: {
            self: new IncomeExpenditureType(-90000, "车"),
            etc: new IncomeExpenditureType(-90001, "车-停车/ETC"),
            oil: new IncomeExpenditureType(-90002, "车-加油"),
        },
        girlfriend: {
            self: new IncomeExpenditureType(-100000, "女朋友"),
            traval: new IncomeExpenditureType(-100001, "女朋友-旅游"),
            eat: new IncomeExpenditureType(-100002, "女朋友-吃喝"),
            gift: new IncomeExpenditureType(-100003, "女朋友-礼物"),
        },
    }

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
