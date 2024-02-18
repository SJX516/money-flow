import { UserConfig, UserConfigStatus, UserConfigType } from "../entity/user_entity";
import { UserRepo } from "../repo/user_repo";
import { IncomeExpenditureService } from "./income_expenditure_service";

class UserService {

    static repo = new UserRepo()

    static initDefaultTypes() {
        for(const type of V0IncomeExpenditureType.values()) {
            let config = new UserConfig();
            config.type = type.isIncome() ? UserConfigType.IncomeType : UserConfigType.ExpenditureType;
            config.status = UserConfigStatus.Normal;
            config.code = type.code;
            config.name = type.name;
            config.parent_code = type.getParentCode();
            this.repo.upsert(config);
        }
    }

    /**
     * @param {UserConfig} config 
     */
    static save(config) {
        this.repo.upsert(config);
        if(config.type == UserConfigType.IncomeType || config.type == UserConfigType.ExpenditureType) {
            IncomeExpenditureService.refreshTypes(true);
        }
    }

    /**
     * @param {UserConfigType} type
     * @returns {Array[UserConfig]} 
     */
    static getAll(type) {
        return this.repo.selectType(type);
    }
}

class V0IncomeExpenditureType {
    static Incomme = {
        salary: {
            self: new V0IncomeExpenditureType(10000, "薪水"),
            num13: new V0IncomeExpenditureType(10001, "薪水-十三薪"),
            bonus: new V0IncomeExpenditureType(10002, "薪水-年终奖"),
        },
        luckmoney: {
            self: new V0IncomeExpenditureType(20000, "红包"),
            work: new V0IncomeExpenditureType(20001, "红包-工作"),
            home: new V0IncomeExpenditureType(20002, "红包-家人"),
        },
        other: {
            self: new V0IncomeExpenditureType(30000, "其他"),
        }
    };

    static Expenditure = {
        home: {
            self: new V0IncomeExpenditureType(-10000, "住房"),
            rent: new V0IncomeExpenditureType(-10001, "住房-房租"),
            utility: new V0IncomeExpenditureType(-10002, "住房-水电"),
        },
        daily: {
            self: new V0IncomeExpenditureType(-20000, "日常"),
            taxi: new V0IncomeExpenditureType(-20001, "日常-交通"),
            phone: new V0IncomeExpenditureType(-20002, "日常-话费"),
        },
        shopping: {
            self: new V0IncomeExpenditureType(-30000, "购物"),
            elc: new V0IncomeExpenditureType(-30001, "购物-电子"),
            life: new V0IncomeExpenditureType(-30002, "购物-生活"),
        },
        happy: {
            self: new V0IncomeExpenditureType(-40000, "娱乐"),
            online: new V0IncomeExpenditureType(-40001, "娱乐-线上"),
            offline: new V0IncomeExpenditureType(-40002, "娱乐-线下"),
        },
        food: {
            self: new V0IncomeExpenditureType(-50000, "餐饮"),
            canteen: new V0IncomeExpenditureType(-50001, "餐饮-食堂"),
            out: new V0IncomeExpenditureType(-50002, "餐饮-外出"),
        },
        family: {
            self: new V0IncomeExpenditureType(-60000, "家人"),
            traval: new V0IncomeExpenditureType(-60001, "家人-交通"),
            gift: new V0IncomeExpenditureType(-60002, "家人-礼物"),
        },
        study: {
            self: new V0IncomeExpenditureType(-70000, "学习"),
            online: new V0IncomeExpenditureType(-70001, "学习-线上"),
            offline: new V0IncomeExpenditureType(-70002, "学习-线下"),
        },
        health: {
            self: new V0IncomeExpenditureType(-80000, "健康"),
        },
        car: {
            self: new V0IncomeExpenditureType(-90000, "车"),
            etc: new V0IncomeExpenditureType(-90001, "车-停车/ETC"),
            oil: new V0IncomeExpenditureType(-90002, "车-加油"),
        },
        girlfriend: {
            self: new V0IncomeExpenditureType(-100000, "女朋友"),
            traval: new V0IncomeExpenditureType(-100001, "女朋友-旅游"),
            eat: new V0IncomeExpenditureType(-100002, "女朋友-吃喝"),
            gift: new V0IncomeExpenditureType(-100003, "女朋友-礼物"),
        },
        other: {
            self: new V0IncomeExpenditureType(-110000, "其他"),
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
        if(data instanceof V0IncomeExpenditureType) {
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

    /**
     * @returns {Array[V0IncomeExpenditureType]}
     */
    static values() {
        return this.toList(this.Incomme).concat(this.toList(this.Expenditure))
    }

    getParentCode() {
        let parentCode = this.code - this.code % 100;
        if(parentCode === this.code) {
            return null;
        } else {
            return parentCode;
        }
    }

    isIncome() {
        return this.code > 0
    }
}

export { UserService };
