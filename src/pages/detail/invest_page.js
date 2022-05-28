import React from 'react'
import { Table, Tag, Button, Layout, Input, Select, Space, Card, InputNumber, Row, Col, Divider, DatePicker, Popover, Typography } from "antd"
import { DataUtil, TimeUtil } from '../../utils/utils';
import InputWidget from './widget/input_widget';
import { InvestmentType } from '../../domain/entity/investment';
import InvestmentService from '../../domain/service/investment_service';

const { Option } = Select;
const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

class InvestPage extends React.Component {

    constructor(props) {
        super(props)
        this.productColumns = [
            {
                title: '类型',
                key: 'type',
                dataIndex: 'entity',
                render: (entity) => {
                    return <Tag key={entity.type.code}>
                        {entity.type.name}
                    </Tag>
                },
            }, {
                title: '名称',
                key: 'name',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.name}</a>
                },
            }, {
                title: '描述',
                key: 'desc',
                dataIndex: 'entity',
                render: (entity) => {
                    return <a>{entity.desc}</a>
                },
            },
            {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                    <Space size="middle">
                        <a onClick={() => {this.deleteProduct(record.entity)}}>删除</a>
                    </Space>
                ),
            },
        ];
    }

    static columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <a>{text}</a>,
        },
        {
            title: 'Age',
            dataIndex: 'age',
            key: 'age',
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
        },
        {
            title: 'Tags',
            key: 'tags',
            dataIndex: 'tags',
            render: (_, { tags }) => (
                <>
                    {tags.map((tag) => {
                        let color = tag.length > 5 ? 'geekblue' : 'green';

                        if (tag === 'loser') {
                            color = 'volcano';
                        }

                        return (
                            <Tag color={color} key={tag}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <a>Invite {record.name}</a>
                    <a>Delete</a>
                </Space>
            ),
        },
    ];

    static data = [
        {
            key: '1',
            name: 'John Brown',
            age: 32,
            address: 'New York No. 1 Lake Park',
            tags: ['nice', 'developer'],
        },
        {
            key: '2',
            name: 'Jim Green',
            age: 42,
            address: 'London No. 1 Lake Park',
            tags: ['loser'],
        },
        {
            key: '3',
            name: 'Joe Black',
            age: 32,
            address: 'Sidney No. 1 Lake Park',
            tags: ['cool', 'teacher'],
        },
    ];

    refreshPage() {
        this.setState({
            updateTime: new Date().getTime()
        })
    }

    addProduct(s) {
        InvestmentService.upsertProduct(s.type, s.name, s.desc)
        this.refreshPage()
    }

    queryProducts() {
        return InvestmentService.queryProducts()
    }

    deleteProduct(entity) {
        InvestmentService.deleteProduct(entity)
        this.refreshPage()
    }

    render() {
        let code2Name = {}
        InvestmentService.getProductTypes().forEach(type => {
            code2Name[type.code] = type.name
        })
        let productData = []
        InvestmentService.queryProducts().forEach(entity => {
            productData.push({ "entity": entity})
        })
        return (
            <Content className='Content'>
                <Table columns={InvestPage.columns} dataSource={InvestPage.data} />
                <Row justify='space-around'>
                    <Col span={6}>
                        <InputWidget title={"新增投资产品"} cfgs={[{
                            name: "type",
                            code2Name: code2Name,
                            required: true
                        }, {
                            name: "name",
                            required: true
                        }, {
                            name: "desc",
                        }
                        ]} onSubmit={(s) => {
                            this.addProduct(s)
                            return true
                        }} />
                    </Col>
                    <Col span={14}>
                        <Table columns={this.productColumns} dataSource={productData} />
                    </Col>
                </Row>

            </Content>
        )
    }
}

export default InvestPage