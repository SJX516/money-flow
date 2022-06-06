import React from 'react'
import { Modal, Form, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography } from "antd"
import InputWidget from './input_widget'

class CusDialog extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
    }


    render() {
        let title = this.props.title
        let visible = this.props.visible
        let cfgs = this.props.cfgs
        return <Modal title={title} visible={visible}
            footer={null}
            onCancel={() => this.props.onCancel()}>
            <InputWidget key={this.props.key} title="" cfgs={cfgs} onSubmit={(s) => {
                return this.props.onOk(s)
            }} />
        </Modal>
    }
}

export { CusDialog }