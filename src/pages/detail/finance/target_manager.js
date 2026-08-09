import { Button, Card, Input, InputNumber, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { TARGET_COLORS, targetMetricName, targetMetrics } from "../../../domain/market/market_target";

const { Text } = Typography;

function TargetManager({ scopeCode, title, targets, disabled, onAdd, onUpdate, onDelete }) {
    const metrics = targetMetrics(scopeCode);
    const [metric, setMetric] = useState(metrics[0].key);
    const [value, setValue] = useState(null);
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(TARGET_COLORS[0].value);
    const [editingId, setEditingId] = useState(null);
    useEffect(() => {
        const next = targetMetrics(scopeCode);
        setMetric(next[0].key);
        setValue(null);
        setDescription("");
        setEditingId(null);
    }, [scopeCode]);
    const resetForm = () => {
        setValue(null);
        setDescription("");
        setEditingId(null);
    };
    const save = () => {
        const saved = editingId == null ? onAdd(metric, value, description, color)
            : onUpdate(editingId, metric, value, description, color);
        if (saved) resetForm();
    };
    const edit = target => {
        setEditingId(target.id);
        setMetric(target.metric);
        setValue(target.target_value);
        setDescription(target.description || "");
        setColor(target.color);
    };
    const columns = [
        { title: "指标", dataIndex: "metric", width: 170, render: item => targetMetricName(scopeCode, item) },
        { title: "目标值", dataIndex: "target_value", width: 120, render: item => Number(item).toLocaleString("zh-CN") },
        { title: "描述", dataIndex: "description", render: item => item || <Text type="secondary">未填写</Text> },
        { title: "颜色", dataIndex: "color", width: 110, render: item => <Tag color={item}>{TARGET_COLORS.find(color => color.value === item)?.name || item}</Tag> },
        { title: "操作", width: 140, render: (_, target) => <Space size={0}>
            <Button type="link" size="small" onClick={() => edit(target)}>编辑</Button>
            <Popconfirm title="确认删除这条目标线？" onConfirm={() => { if (editingId === target.id) resetForm(); onDelete(target.id); }}>
                <Button type="link" danger size="small">删除</Button></Popconfirm></Space> }
    ];
    return <Card title={title} style={{ marginTop: 16 }}>
        <Space wrap style={{ marginBottom: 14 }}>
            <Select value={metric} style={{ width: 190 }} onChange={setMetric} disabled={disabled}>
                {metrics.map(item => <Select.Option key={item.key} value={item.key}>{item.name}</Select.Option>)}
            </Select>
            <InputNumber value={value} onChange={setValue} placeholder="目标值" style={{ width: 140 }} disabled={disabled} />
            <Input value={description} onChange={event => setDescription(event.target.value)} placeholder="描述，例如：可以买入"
                maxLength={80} style={{ width: 260 }} disabled={disabled} />
            <Select value={color} style={{ width: 120 }} onChange={setColor} disabled={disabled}>
                {TARGET_COLORS.map(item => <Select.Option key={item.value} value={item.value}>
                    <span style={{ color: item.value }}>━</span> {item.name}</Select.Option>)}
            </Select>
            <Button type="primary" onClick={save} disabled={disabled || value == null}>{editingId == null ? "添加目标" : "保存修改"}</Button>
            {editingId != null && <Button onClick={resetForm} disabled={disabled}>取消编辑</Button>}
        </Space>
        <Table size="small" pagination={false} rowKey="id" columns={columns} dataSource={targets} locale={{ emptyText: "暂未设置目标指标" }} />
    </Card>;
}

export default TargetManager;
