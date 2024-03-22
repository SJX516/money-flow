import { Button, Col, Divider, Layout, Row, Typography, message } from "antd";
import React from 'react';
import { App, DB_INIT } from '../../app.js';

const { Content } = Layout;
const { Text } = Typography;

class InitPage extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
        this.testViewVisibility = 'hidden'
        if(!App.isProduction()) {
            this.testViewVisibility = 'visible'
        }
    }

    async refreshDB(files) {
        await App.initDb(files[0])
        this.props.onDbReady()
    }

    async create() {
        await App.createDb()
        this.props.onDbReady()
    }

    export() {
        if (!DB_INIT) {
            message.error("请先加载DB文件")
            return
        }
        App.db?.export()
    }

    click1() {
    }

    click2() {
    }

    render() {
        return (
            <Content className='Content'>
                <Divider orientation="center">版本：{App.getVersion()}</Divider>
                <Row style={{ padding: '10px 50px 50px', backgroundColor: "#fff" }}>
                    <Col span={8} align='center'>
                        <Divider orientation="center">新建DB文件</Divider>
                        <Button onClick={() => this.create()}>新建</Button>
                    </Col>
                    <Col span={8} align='center'>
                        <Divider orientation="center">加载DB文件</Divider>
                        <Text>{this.state.fileName}</Text>
                        <input type='file' id='dbfile' accept=".db" onChange={(e) => this.refreshDB(e.target.files)} />
                    </Col>
                    <Col span={8} align='center'>
                        <Divider orientation="center">导出DB文件</Divider>
                        <Button onClick={() => this.export()}>保存</Button>
                    </Col>
                </Row>
                <Row style={{ padding: '10px 50px 50px', backgroundColor: "#fff", margin: "10px 0", visibility: this.testViewVisibility }}>
                    <Divider orientation="center">测试按钮</Divider>
                    <Button onClick={() => this.click1()}>click1</Button>
                    <Button onClick={() => this.click2()}>click2</Button>
                </Row>
            </Content>
        )
    }
}

export default InitPage