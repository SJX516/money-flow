import { BaseEntity } from "./base_entity";

class UserConfig extends BaseEntity {
    /**
     * @type {UserConfigType}
     */
    type = null;
    /**
     * @type {UserConfigStatus}
     */
    status = null;
    code = null;
    name = null;
    // 用于表示层级关系
    parent_code = null;
}

class UserConfigStatus {
    static Normal = new UserConfigStatus(1, "normal")
    static Disabled = new UserConfigStatus(99, "disabled")

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

    static values() {
        return [this.Normal, this.Disabled]
    }
}

class UserConfigType {
    static Account = new UserConfigType(1, "Account")
    static IncomeType = new UserConfigType(2, "IncomeType")
    static ExpenditureType = new UserConfigType(3, "ExpenditureType")

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

    static values() {
        return [this.Account, this.IncomeType, this.ExpenditureType]
    }
}

export { UserConfig, UserConfigStatus, UserConfigType };
