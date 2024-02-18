import { TimeUtil } from "../../utils/utils";
import { IncomeExpenditureDetail, IncomeExpenditureType } from "../entity/income_expenditure";
import { UserConfig, UserConfigStatus, UserConfigType } from "../entity/user_entity";
import { UserService } from "./user_service";

class IncomeExpenditureService {

    /**
     * @type {Array[IncomeExpenditureType]}
     */
    static incomeTypes = [];

    /**
     * @type {Array[IncomeExpenditureType]}
     */
    static expendTypes = [];

    static codeToType = {};
    static nameToType = {};
    static codeToParentCode = {};

    static maxCode = 0;
    static minCode = 0;

    static getIncomeTypes() {
        this.refreshTypes(false);
        return this.incomeTypes
    }

    static getExpenditureTypes() {
        this.refreshTypes(false);
        return this.expendTypes;
    }

    /**
     * @returns {IncomeExpenditureType}
     */
    static getIncomeExpendTypeByCode(code) {
        this.refreshTypes(false);
        return this.codeToType[code];
    }

    /**
     * @returns {IncomeExpenditureType}
     */
    static getIncomeExpendGroupByCode(code) {
        this.refreshTypes(false);
        let parentCode = this.codeToParentCode[code];
        while(parentCode != null) {
            code = parentCode;
            parentCode = this.codeToParentCode[code];
        }
        return this.getIncomeExpendTypeByCode(code);
    }

    static refreshTypes(force) {
        if(this.incomeTypes.length == 0 || this.expendTypes.length == 0 || force) {
            this.incomeTypes = []
            this.expendTypes = []
            this.codeToType = {}
            this.nameToType = {}
            this.codeToParentCode = {}
            UserService.getAll(UserConfigType.IncomeType).forEach(config => this._addFromUserConfig(config))
            UserService.getAll(UserConfigType.ExpenditureType).forEach(config => this._addFromUserConfig(config))
        }
    }

    /**
     * @param {UserConfig} config 
     */
    static _addFromUserConfig(config) {
        let type = new IncomeExpenditureType(config);
        this.codeToType[config.code] = type
        this.codeToParentCode[config.code] = config.parent_code;
        if(config.type === UserConfigType.IncomeType) {
            this.incomeTypes.push(type);
        } else {
            this.expendTypes.push(type);
        }
        if(config.code > this.maxCode) {
            this.maxCode = config.code
        }
        if(config.code < this.minCode) {
            this.minCode = config.code
        }
    }

    /**
     * @param {IncomeExpenditureType} type 
     * @param {string} name
     * @param {UserConfigStatus} status
     */
    static updateType(type, name, parent_code, status) {
        let config = type.config;
        config.name = name;
        config.parent_code = parent_code;
        config.status = status;
        UserService.save(config);
    }

    /**
     * @param {UserConfigType} configType 
     */
    static addType(configType, name, parent_code, status) {
        let code = null;
        if(configType === UserConfigType.IncomeType) {
            code = this.maxCode + 10
        } else {
            code = this.minCode - 10
        }
        let config = new UserConfig();
        config.type = configType;
        config.code = code;
        config.name = name;
        config.parent_code = parent_code;
        config.status = status;
        UserService.save(config);
    }

    /**
     * @param {IncomeExpenditureType} type
     * @param {Date} happenTime 
     */
    static upsert(money, type, happenTime, desc=null, id=null) {
        var detail = new IncomeExpenditureDetail()
        detail.id = id
        detail.type = type
        detail.desc = desc
        detail.money = money
        detail.happenTime = happenTime
        detail.save()
    }

    /**
     * @returns {Array[IncomeExpenditureDetail]}
     */
    static queryMonth(monthDate) {
        let startDate = TimeUtil.monthStart(monthDate)
        return IncomeExpenditureDetail.queryTimeBetwen(startDate, TimeUtil.monthEnd(startDate))
    }

    static queryTimeBetwen(startDate, endDate) {
        return IncomeExpenditureDetail.queryTimeBetwen(startDate, endDate)
    }

    static delete(id) {
        IncomeExpenditureDetail.delete(id)
    }
}

export { IncomeExpenditureService };
