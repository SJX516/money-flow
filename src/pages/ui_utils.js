import { Col, Row, Tag, Typography } from "antd";
const { Text } = Typography;

class UIUtils {

    static getProductTag(productType) {
        return <Tag color={this._getProductColor(productType)} key={productType.code}>
            {productType.name}
        </Tag>
    }

    static _getProductColor(productType) {
        if (productType.isAsset()) {
            return 'geekblue'
        } else if (productType.isDebt()) {
            return 'green'
        } else if(productType.isStock()) {
            return 'red'
        } else {
            return 'gold'
        }
    }

    static createShowTextRow(title, text, textType = "") {
        return (<Row align='middle' style={{ margin: '0 10px', padding: '4px 0', }} >
            <Col span={12}>
                <Text type={textType} strong>{title}</Text>
            </Col>
            <Col span={12} align='right'>
                <Text type={textType} strong>{text}</Text>
            </Col>
        </Row>
        )
    }
}

export { UIUtils };
