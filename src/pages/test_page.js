import React from 'react'
import './test_page.css'
import { Upload, Button, DatePicker, version } from "antd"
import { Typography, Divider } from 'antd'
import DBHelper from '../utils/db'
import { IncomeExpenditureDetail, IncomeExpenditureTypes } from '../domain/entity/income_expenditure'
import { App } from '..'

const { Title, Paragraph, Text, Link } = Typography
const blockContent = `AntV 是蚂蚁金服全新一代数据可视化解决方案, 致力于提供一套简单方便、专业可靠、不限可能的数据可视化最佳实践。得益于丰富的业务场景和用户需求挑战，AntV 经历多年积累与不断打磨，已支撑整个阿里集团内外 20000+ 业务系统，通过了日均千万级 UV 产品的严苛考验。
我们正在基础图表，图分析，图编辑，地理空间可视化，智能可视化等各个可视化的领域耕耘，欢迎同路人一起前行。`

class TestPage extends React.Component {

  constructor(props) {
    super(props)
    this.count = 1
  }

  initdb(files) {
    console.log(files)
    let db = new DBHelper()
    db.init(files[0])
    App.db = db
  }

  quickclick() {
    IncomeExpenditureDetail.repo.selectAll()
  }

  quickclick2() {
    var detail = new IncomeExpenditureDetail()
    detail.type = IncomeExpenditureTypes.Income_salary
    detail.money = 2091000
    detail.happenTime = new Date().timeStr()
    detail.save()
  }

  quickclick3() {
    IncomeExpenditureDetail.load(1)
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
          <input type='file' id='dbfile' onChange={(e) => this.initdb(e.target.files)}/>
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
        <div className='txts'>
          <Typography>

            <Title>介绍</Title>
            <Paragraph>
              蚂蚁的企业级产品是一个庞大且复杂的体系。这类产品不仅量级巨大且功能复杂，而且变动和并发频繁，常常需要设计与开发能够快速的做出响应。同时这类产品中有存在很多类似的页面以及组件，可以通过抽象得到一些稳定且高复用性的内容。
            </Paragraph>
            <Paragraph>
              随着商业化的趋势，越来越多的企业级产品对更好的用户体验有了进一步的要求。带着这样的一个终极目标，我们（蚂蚁金服体验技术部）经过大量的项目实践和总结，逐步打磨出一个服务于企业级产品的设计体系
              Ant Design。基于<Text mark>『确定』和『自然』</Text>
              的设计价值观，通过模块化的解决方案，降低冗余的生产成本，让设计者专注于
              <Text strong>更好的用户体验</Text>。
            </Paragraph>
            <Title level={2}>设计资源</Title>
            <Paragraph>
              我们提供完善的设计原则、最佳实践和设计资源文件（<Text code>Sketch</Text> 和
              <Text code>Axure</Text>），来帮助业务快速设计出高质量的产品原型。
            </Paragraph>

            <Paragraph>
              <ul>
                <li>
                  <Link href="/docs/spec/proximity-cn">设计原则</Link>
                </li>
                <li>
                  <Link href="/docs/spec/overview-cn">设计模式</Link>
                </li>
                <li>
                  <Link href="/docs/resources-cn">设计资源</Link>
                </li>
              </ul>
            </Paragraph>

            <Paragraph>
              <blockquote>{blockContent}</blockquote>
              <pre>{blockContent}</pre>
            </Paragraph>

            <Paragraph>
              按<Text keyboard>Esc</Text>键退出阅读……
            </Paragraph>

            <Divider />
          </Typography>
        </div>
      </div>
    )
  }
}

export default TestPage