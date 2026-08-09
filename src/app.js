
import DBHelper from './utils/db';

var DB_INIT = false

class App {
    /**
     * @type {DBHelper}
     */
    static db = null;

    static personalDbName = null;

    // 行情数据使用独立 SQLite 文件，不与个人财务数据混合。
    static marketDb = null;

    static marketDbName = null;

    static _env = process.env.NODE_ENV;

    static _version = "1.3.20260809";

    static isProduction() {
        return this._env === 'production';
    }

    static isTest() {
        return this._env === 'test';
    }

    static getVersion() {
        if(this.isProduction()) {
            return this._version;
        } else if (this.isTest()) {
            return this._version + "-test";
        } else {
            return this._version + "-dev";
        }
    }

    static async initDb(file) {
        const previous = this.db
        const helper = new DBHelper()
        this.db = helper
        try {
            await helper.init(file)
            this.personalDbName = file && file.name ? file.name : "已导入个人数据库"
            DB_INIT = true
        } catch (error) {
            this.db = previous
            throw error
        }
    }

    static async createDb() {
        const previous = this.db
        const helper = new DBHelper()
        this.db = helper
        try {
            await helper.createDb()
            this.personalDbName = "新建个人数据库（尚未导出）"
            DB_INIT = true
        } catch (error) {
            this.db = previous
            throw error
        }
    }
}

export { App, DB_INIT };
