import { Modal } from "antd"
import React from 'react'
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
        let extra = this.props.extra
        return <Modal title={title} visible={visible}
            footer={null}
            onCancel={() => this.props.onCancel()}>
            <InputWidget key={this.props.key} title="" cfgs={cfgs} extra={extra} onSubmit={(s) => {
                return this.props.onOk(s)
            }} />
        </Modal>
    }
}

export { CusDialog }
