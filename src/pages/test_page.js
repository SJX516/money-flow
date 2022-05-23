import React from 'react'
import './test_page.css'
import { Upload, Button, DatePicker, version } from "antd"
import { Typography, Divider } from 'antd'
import { IncomeExpenditureService } from '../domain/service/income_expenditure_service'
import { App } from '..'
import { IncomeExpenditureType } from '../domain/entity/income_expenditure'

const { Title, Paragraph, Text, Link } = Typography

class TestPage extends React.Component {

    constructor(props) {
        super(props)
        this.count = 1
    }

    initdb(files) {
        console.log(files)
        App.initDb(files[0])
    }

    quickclick() {
        IncomeExpenditureService.upsert(1234, IncomeExpenditureType.Incomme.salary, new Date(), "测试薪水")
    }

    quickclick2() {
        console.log(IncomeExpenditureService.queryAll())
    }

    quickclick3() {
    }

    quickclick4() {
        App.db.export()
    }

    render() {
        const props = {
            name: 'file',
            action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
            headers: {
                authorization: 'authorization-text',
            },
            onChange(info) {
                if (info.file.status !== 'uploading') {
                    console.log(info.file, info.fileList)
                }
                if (info.file.status === 'done') {
                    console.log(`${info.file.name} file uploaded successfully`)
                } else if (info.file.status === 'error') {
                    console.log(`${info.file.name} file upload failed.`)
                }
            },
        }

        return (
            <div className="test-page1">
                <h1>antd version: {version}</h1>
                <div className='btns' >
                    <input type='file' id='dbfile' onChange={(e) => this.initdb(e.target.files)} />
                    <Button type="primary" onClick={() => this.quickclick()}>
                        Click 1
                    </Button>
                    <Button onClick={() => this.quickclick2()}>Click 2</Button>
                    <Button type="dashed" onClick={() => this.quickclick3()}>Click 3</Button>
                    <Button type="text" onClick={() => this.quickclick4()}>保存</Button>
                    <Button type="link">Link Button</Button>
                    <Upload {...props}>
                        <Button>Click to Upload</Button>
                    </Upload>
                </div>
                <div className="pickers">
                    <DatePicker />
                </div>
            </div>
        )
    }
}

export default TestPage