import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestPage from './pages/main/test_page';
import MainPage from './pages/main/main_page';
import DBHelper from './utils/db';
import moment from 'moment';
import 'moment/locale/zh-cn';
import zhCN from 'antd/lib/locale/zh_CN';
import { ConfigProvider } from 'antd';

moment.locale('zh-cn');

var DB_INIT = false

class App {
    /**
     * @type {DBHelper}
     */
    static db = null

    static _env = process.env.NODE_ENV

    static _version = "1.0.20220703"

    static isProduction() {
        return this._env === 'production'
    }

    static getVersion() {
        if(this.isProduction()) {
            return this._version
        } else {
            return this._version + "-dev"
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

ReactDOM.render(<ConfigProvider locale={zhCN}>
    <MainPage key={"mainpage"}/>
</ConfigProvider>, document.getElementById('root'));

// window.onerror = function(message, source, lineNumber, colno, error) {
//     alert("Console 查看错误信息：" + message);
// };

export { App, DB_INIT }