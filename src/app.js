
import DBHelper from './utils/db';

var DB_INIT = false

class App {
    /**
     * @type {DBHelper}
     */
    static db = null;

    static _env = process.env.NODE_ENV;

    static _version = "1.2.20240206";

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
        this.db = new DBHelper()
        await this.db.init(file)
        DB_INIT = true
    }

    static async createDb() {
        this.db = new DBHelper()
        await this.db.createDb()
        DB_INIT = true
    }
}

export { App, DB_INIT };
