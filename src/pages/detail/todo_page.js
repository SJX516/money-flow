import { Layout, Typography } from "antd";
import React from 'react';

const { Content } = Layout;
const { Text } = Typography;

class TodoPage extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Content className='Content'>
                <Text style={{fontSize: '50px'}}> TODO </Text>
            </Content>
        )
    }
}

export default TodoPage