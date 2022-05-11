import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import TestPage from './pages/testPage';

ReactDOM.render(<TestPage />, document.getElementById('root'));

window.onerror = function(message, source, lineNumber, colno, error) {
    alert("Console 查看错误信息：" + message);
};