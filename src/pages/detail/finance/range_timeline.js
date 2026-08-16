import { Button, Typography } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { dateToDay, dayToDate, presetDateRange } from "./chart_utils";
import EChartView from "./echart_view";

const { Text } = Typography;

function RangeTimeline({ minDate, maxDate, startDate, endDate, disabled, onChange, onCommit }) {
    const min = dateToDay(minDate);
    const max = dateToDay(maxDate);
    const [draft, setDraft] = useState([startDate, endDate]);
    const timer = useRef(null);
    useEffect(() => setDraft([startDate, endDate]), [startDate, endDate]);
    useEffect(() => () => timer.current && clearTimeout(timer.current), []);
    const presets = [{ label: "近3个月", months: 3 }, { label: "近6个月", months: 6 }, { label: "近1年", months: 12 },
        { label: "近3年", months: 36 }, { label: "近5年", months: 60 }, { label: "全部", months: null }];
    const choosePreset = months => {
        const range = presetDateRange(minDate, maxDate, months);
        setDraft(range); onChange(range[0], range[1]); onCommit(range[0], range[1]);
    };
    const start = max === min ? 0 : (dateToDay(draft[0]) - min) / (max - min) * 100;
    const end = max === min ? 100 : (dateToDay(draft[1]) - min) / (max - min) * 100;
    const option = useMemo(() => ({ animation: false, grid: { left: 18, right: 18, top: 5, height: 1 },
        xAxis: { type: "time", min: minDate, max: maxDate, show: false }, yAxis: { type: "value", show: false },
        series: [{ type: "line", data: [[minDate, 0], [maxDate, 0]], showSymbol: false, lineStyle: { color: "#64748b" } }],
        dataZoom: [{ type: "slider", start, end, left: 72, right: 72, bottom: 4, height: 22, brushSelect: false,
            borderColor: "#d9e2ec", backgroundColor: "#f8fafc", fillerColor: "rgba(22,119,255,.16)",
            dataBackground: { lineStyle: { color: "#b6c7dd" }, areaStyle: { color: "#eaf1f8" } },
            selectedDataBackground: { lineStyle: { color: "#69b1ff" }, areaStyle: { color: "#bae0ff" } },
            handleStyle: { color: "#ffffff", borderColor: "#1677ff", borderWidth: 1.5 },
            moveHandleStyle: { color: "#91caff" }, emphasis: { handleStyle: { color: "#e6f4ff", borderColor: "#0958d9" } },
            textStyle: { color: "#64748b" }, labelFormatter: value => dayToDate(Math.round(Number(value) / 86400000)) }]
    }), [minDate, maxDate, start, end]);
    const onEvents = useMemo(() => ({ datazoom: event => {
        if (disabled) return;
        const zoom = event.batch ? event.batch[0] : event;
        if (zoom.start == null || zoom.end == null) return;
        const range = [dayToDate(Math.round(min + (max - min) * zoom.start / 100)),
            dayToDate(Math.round(min + (max - min) * zoom.end / 100))];
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { onChange(range[0], range[1]); onCommit(range[0], range[1]); }, 220);
    } }), [disabled, min, max, onChange, onCommit]);
    return <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflowX: "auto" }}>
        <Text strong style={{ whiteSpace: "nowrap" }}>展示时间轴</Text>
        <Text code style={{ whiteSpace: "nowrap" }}>{draft[0]} 至 {draft[1]}</Text>
        {presets.map(item => { const range = presetDateRange(minDate, maxDate, item.months); const active = range[0] === draft[0] && range[1] === draft[1];
            return <Button key={item.label} size="small" type={active ? "primary" : "default"} disabled={disabled}
                style={{ flex: "0 0 auto" }} onClick={() => choosePreset(item.months)}>{item.label}</Button>; })}
        <div style={{ flex: "1 1 360px", minWidth: 300 }}>
            <EChartView option={option} height={44} ariaLabel="展示时间轴" onEvents={onEvents} />
        </div>
    </div>;
}

export default RangeTimeline;
