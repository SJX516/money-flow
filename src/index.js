import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestPage from './pages/test_page';
import DBHelper from './utils/db';

ReactDOM.render(<TestPage />, document.getElementById('root'));

window.onerror = function(message, source, lineNumber, colno, error) {
    alert("Console 查看错误信息：" + message);
};

class App {
    /**
     * @type {DBHelper}
     */
    static db = null
}

export {App}