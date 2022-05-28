import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestPage from './pages/test_page';
import MainPage from './pages/main/main_page';
import DBHelper from './utils/db';

ReactDOM.render(<MainPage />, document.getElementById('root'));

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

export {App, DB_INIT}