import { Button, Divider, Empty, Input, Modal, Popconfirm, Select, Space, Spin, Tag, Typography } from "antd";
import React, { useEffect, useState } from "react";

const { Text } = Typography;

function StockListManager({ visible, disabled, groups, stocks, onClose, onAddStock, onAddGroup,
    onDeleteGroup, onMoveGroup, onMoveStock, onRemoveStock, mode = "stock", fixedGroupId = null }) {
    const indexMode = mode === "index";
    const [code, setCode] = useState("");
    const [groupId, setGroupId] = useState(null);
    const [groupName, setGroupName] = useState("");
    const [adding, setAdding] = useState(false);
    const watchedStocks = stocks.filter(stock => stock.isWatched && (!indexMode || stock.groupId === fixedGroupId));

    useEffect(() => {
        if (groupId != null && !groups.some(group => group.id === groupId)) setGroupId(null);
    }, [groupId, groups]);

    const addStock = async () => {
        if (disabled || code.length !== 6) return;
        setAdding(true);
        try {
            if (await onAddStock(code, indexMode ? fixedGroupId : groupId)) setCode("");
        } finally {
            setAdding(false);
        }
    };

    const addGroup = () => {
        if (disabled || !groupName.trim()) return;
        if (onAddGroup(groupName)) setGroupName("");
    };

    const dropToGroup = (event, targetGroupId) => {
        event.preventDefault();
        if (disabled) return;
        const stockCode = event.dataTransfer.getData("text/plain");
        if (stockCode) onMoveStock(stockCode, targetGroupId);
    };

    const buckets = indexMode ? groups.filter(group => group.id === fixedGroupId)
        : [...groups, { id: null, name: "未分组" }];
    return <Modal title={indexMode ? "指数列表管理" : "股票列表管理"} visible={visible} width={920} onCancel={onClose}
        footer={<Button onClick={onClose}>关闭</Button>} destroyOnClose={false}>
        <Text strong>{indexMode ? "新增指数" : "新增观察股票"}</Text>
        <Space wrap style={{ display: "flex", marginTop: 10 }}>
            <Input value={code} inputMode={indexMode ? "text" : "numeric"} maxLength={6} placeholder={indexMode ? "6 位指数代码" : "6 位股票代码"} style={{ width: 180 }}
                disabled={disabled || adding}
                onPressEnter={addStock}
                onChange={event => setCode((indexMode
                    ? event.target.value.replace(/[^0-9a-z]/gi, "").toUpperCase()
                    : event.target.value.replace(/\D/g, "")).slice(0, 6))} />
            {!indexMode && <Select value={groupId} style={{ width: 180 }} disabled={disabled || adding} onChange={setGroupId}>
                <Select.Option value={null}>未分组</Select.Option>
                {groups.map(group => <Select.Option key={group.id} value={group.id}>{group.name}</Select.Option>)}
            </Select>}
            <Button type="primary" loading={adding} disabled={disabled || code.length !== 6} onClick={addStock}>
                {indexMode ? "添加指数" : "添加股票"}
            </Button>
            {adding && <Text type="secondary"><Spin size="small" /> 正在查询{indexMode ? "指数" : "股票"}信息…</Text>}
        </Space>

        {!indexMode && <><Divider style={{ margin: "18px 0 14px" }} />
        <Space wrap style={{ display: "flex", marginBottom: 14 }}>
            <Input value={groupName} maxLength={20} placeholder="新分组名称" style={{ width: 220 }}
                disabled={disabled} onPressEnter={addGroup} onChange={event => setGroupName(event.target.value)} />
            <Button disabled={disabled || !groupName.trim()} onClick={addGroup}>添加分组</Button>
        </Space></>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12,
            maxHeight: "55vh", overflowY: "auto", alignItems: "start", marginTop: indexMode ? 18 : 0 }}>
            {buckets.map((group, index) => {
                const groupStocks = watchedStocks.filter(stock => (stock.groupId == null ? null : stock.groupId) === group.id);
                return <div key={group.id == null ? "ungrouped" : group.id}
                    onDragOver={event => event.preventDefault()} onDrop={event => dropToGroup(event, group.id)}
                    style={{ minHeight: 150, border: "1px solid #d9d9d9", borderRadius: 4, background: "#fafafa", padding: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                        <Space size={6}><Text strong>{group.name}</Text><Tag>{groupStocks.length}</Tag></Space>
                        {!indexMode && group.id != null && <Space size={0}>
                            <Button type="link" size="small" disabled={disabled || index === 0}
                                onClick={() => onMoveGroup(group.id, "before")}>前移</Button>
                            <Button type="link" size="small" disabled={disabled || index === groups.length - 1}
                                onClick={() => onMoveGroup(group.id, "after")}>后移</Button>
                            <Popconfirm title="删除分组后，其中股票将移到未分组，确认继续？"
                                onConfirm={() => onDeleteGroup(group.id)}>
                                <Button type="link" danger size="small" disabled={disabled || group.isSystem}>删除</Button>
                            </Popconfirm>
                        </Space>}
                    </div>
                    {!groupStocks.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={indexMode ? "暂无指数" : "暂无股票"} />
                        : groupStocks.map(stock => <div key={stock.code} draggable={!disabled && !indexMode}
                            onDragStart={event => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", stock.code);
                            }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                                background: "#fff", border: "1px solid #f0f0f0", borderRadius: 4, padding: "8px 9px",
                                marginBottom: 7, cursor: disabled || indexMode ? "default" : "grab" }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stock.name}</div>
                                <Text type="secondary" style={{ fontSize: 12 }}>{stock.code}</Text>
                            </div>
                            {!indexMode && group.id != null ? <Popconfirm title="确认移到未分组？"
                                onConfirm={() => onMoveStock(stock.code, null)}>
                                <Button type="link" size="small" disabled={disabled}>移出分组</Button>
                            </Popconfirm> : <Popconfirm title={"确认从" + (indexMode ? "指数" : "观察") + "列表移除？已构建行情和个人财务记录不会删除。"}
                                onConfirm={() => onRemoveStock(stock.code)}>
                                <Button type="link" danger size="small" disabled={disabled}>移除</Button>
                            </Popconfirm>}
                        </div>)}
                </div>;
            })}
        </div>
    </Modal>;
}

export default StockListManager;
