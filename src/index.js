import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestPage from './pages/test_page';
import MainPage from './pages/main/main_page';
import DBHelper from './utils/db';
import moment from 'moment';
import 'moment/locale/zh-cn';
import zhCN from 'antd/lib/locale/zh_CN';
import { ConfigProvider } from 'antd';

moment.locale('zh-cn');

ReactDOM.render(<ConfigProvider locale={zhCN}>
    <MainPage key={"mainpage"}/>
</ConfigProvider>, document.getElementById('root'));

// window.onerror = function(message, source, lineNumber, colno, error) {
//     alert("Console 查看错误信息：" + message);
// };

var DB_INIT = false

class App {
    /**
     * @type {DBHelper}
     */
    static db = null

    static async initDb(file) {
        this.db = new DBHelper()
        await this.db.init(file)
        DB_INIT = true
    }
}

export { App, DB_INIT }