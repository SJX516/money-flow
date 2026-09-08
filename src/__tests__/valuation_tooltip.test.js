import { valuationTooltip } from "../pages/detail/finance/valuation_tooltip";

const metrics = [
    { key: "pe", field: "pe", name: "PE（TTM）", color: "#1677ff" },
    { key: "pb", field: "pb", name: "PB", color: "#722ed1" },
    { key: "dividend", field: "dividend_yield", name: "股息率（TTM）", color: "#13c2c2" }
];
const row = { report_date: "2025-06-02", source_report_date: "2025-03-31", pe: 10, pb: 2, dividend_yield: 3.25 };
const params = names => names.map(seriesName => ({ seriesName, dataIndex: 0 }));

test("日期详情跟随图例显示股息率和 PB，并隐藏取消勾选的指标", () => {
    const initial = valuationTooltip(params(["PE（TTM）"]), [row], metrics);
    expect(initial).not.toContain("股息率");
    expect(initial).not.toContain("PB");
    const selected = valuationTooltip(params(["PB", "股息率（TTM）"]), [row], metrics);
    expect(selected).toContain("股息率（TTM）：3.25%");
    expect(selected).toContain("PB：2.00");
    expect(selected).not.toContain("PE（TTM）");
    expect(selected).toContain("2025-06-02");
});

test("零股息率与缺失数据分别展示，空日期不报错", () => {
    const selected = params(["股息率（TTM）"]);
    expect(valuationTooltip(selected, [{ ...row, dividend_yield: 0 }], metrics)).toContain("：0.00%");
    expect(valuationTooltip(selected, [{ ...row, dividend_yield: null }], metrics)).toContain("：-");
    expect(valuationTooltip([], [row], metrics)).toBe("");
});
