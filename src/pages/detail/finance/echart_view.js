import * as echarts from "echarts";
import React, { useEffect, useRef } from "react";

const EMPTY_EVENTS = {};

function EChartView({ option, height = 420, ariaLabel, onEvents = EMPTY_EVENTS, onWheel, onPlotClick, activeDataIndex }) {
    const ref = useRef(null);
    const chartRef = useRef(null);
    const onWheelRef = useRef(onWheel);
    const onPlotClickRef = useRef(onPlotClick);
    useEffect(() => { onWheelRef.current = onWheel; }, [onWheel]);
    useEffect(() => { onPlotClickRef.current = onPlotClick; }, [onPlotClick]);
    useEffect(() => {
        if (!ref.current) return undefined;
        const chart = echarts.init(ref.current, null, { renderer: "canvas" });
        chartRef.current = chart;
        const plotClick = event => onPlotClickRef.current?.({ chart, event });
        chart.getZr().on("click", plotClick);
        const resize = () => chart.resize();
        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
        if (observer) observer.observe(ref.current);
        window.addEventListener("resize", resize);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener("resize", resize);
            if (!chart.isDisposed?.()) chart.getZr().off("click", plotClick);
            chartRef.current = null;
            if (!chart.isDisposed?.()) chart.dispose();
        };
    }, []);
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || chart.isDisposed?.()) return;
        const currentOption = chart.getOption?.() || {};
        const previousLegend = currentOption.legend;
        const previousSelected = previousLegend && previousLegend[0] && previousLegend[0].selected;
        if (previousSelected && option && option.legend && !Array.isArray(option.legend)) {
            chart.setOption({ ...option, legend: { ...option.legend,
                selected: { ...(option.legend.selected || {}), ...previousSelected } } }, true);
            return;
        }
        chart.setOption(option, true);
    }, [option]);
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || chart.isDisposed?.() || activeDataIndex == null || activeDataIndex < 0) return;
        chart.dispatchAction({ type: "updateAxisPointer", xAxisIndex: 0, value: activeDataIndex });
        chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: activeDataIndex });
    }, [option, activeDataIndex]);
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || chart.isDisposed?.()) return undefined;
        Object.entries(onEvents).forEach(([event, handler]) => chart.on(event, handler));
        return () => { if (!chart.isDisposed?.()) Object.entries(onEvents).forEach(([event, handler]) => chart.off(event, handler)); };
    }, [onEvents]);
    useEffect(() => {
        const element = ref.current;
        if (!element || !onWheel) return undefined;
        const wheel = event => {
            if (!event.ctrlKey) return;
            event.preventDefault();
            event.stopPropagation();
            const rect = element.getBoundingClientRect();
            const ratio = rect.width ? Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) : 0.5;
            onWheelRef.current?.({ deltaY: event.deltaY, ratio });
        };
        element.addEventListener("wheel", wheel, { passive: false, capture: true });
        return () => element.removeEventListener("wheel", wheel, { capture: true });
    }, [onWheel]);
    return <div ref={ref} style={{ width: "100%", height }} role="img" aria-label={ariaLabel} />;
}

export default EChartView;
