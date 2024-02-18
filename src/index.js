import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import ReactDOM from 'react-dom';
import './app';
import './index.css';
import MainPage from './pages/main/main_page';

moment.locale('zh-cn');

ReactDOM.render(<ConfigProvider locale={zhCN}>
    <MainPage key={"mainpage"}/>
</ConfigProvider>, document.getElementById('root'));

// window.onerror = function(message, source, lineNumber, colno, error) {
//     alert("Console 查看错误信息：" + message);
// };