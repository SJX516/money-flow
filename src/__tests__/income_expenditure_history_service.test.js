import { aggregateTypeHistory } from "../domain/service/income_expenditure_history_service";

function type(code, name, parentCode=null) {
    return { code, name, config: { parent_code: parentCode } }
}

describe("单项收支历史统计", () => {
    const root = type(10, "工资收入")
    const salary = type(11, "基本工资", 10)
    const bonus = type(12, "奖金", 10)
    const types = [root, salary, bonus]
    const details = [
        { id: 1, desc: "一月工资", type: salary, money: 100000, happenTime: new Date("2024-01-15 00:00:00") },
        { type: salary, money: 120000, happenTime: new Date("2024-03-15 00:00:00") },
        { type: bonus, money: 30000, happenTime: new Date("2024-03-20 00:00:00") }
    ]

    test("选择父类型时包含全部子类型并按子类型汇总", () => {
        const result = aggregateTypeHistory(details, types, root.code)
        expect(result.totalMoney).toBe(250000)
        expect(result.donutData).toEqual([
            { code: 11, name: "基本工资", money: 220000 },
            { code: 12, name: "奖金", money: 30000 }
        ])
        expect(result.monthlyData).toEqual([
            { month: "2024-01", money: 100000 },
            { month: "2024-02", money: 0 },
            { month: "2024-03", money: 150000 }
        ])
        expect(result.monthlyDetails["2024-01"]).toEqual([{
            id: 1, happenTime: details[0].happenTime, typeCode: 11, typeName: "基本工资", desc: "一月工资", rawMoney: 100000, money: 100000
        }])
    })

    test("父类型自身的直接数据也进入圆环统计", () => {
        const result = aggregateTypeHistory([
            { type: root, money: 40000, happenTime: new Date("2024-02-01 00:00:00") }
        ], types, root.code)
        expect(result.donutData).toEqual([{ code: 10, name: "工资收入", money: 40000 }])
    })

    test("选中子类型后折线只统计该类型", () => {
        const result = aggregateTypeHistory(details, types, root.code, salary.code)
        expect(result.totalMoney).toBe(250000)
        expect(result.selectedTotalMoney).toBe(220000)
        expect(result.monthlyData).toEqual([
            { month: "2024-01", money: 100000 },
            { month: "2024-02", money: 0 },
            { month: "2024-03", money: 120000 }
        ])
    })

    test("仅当前类型时不包含子类型数据", () => {
        const directDetail = { type: root, money: 40000, happenTime: new Date("2024-02-01 00:00:00") }
        const result = aggregateTypeHistory([...details, directDetail], types, root.code, root.code, false)
        expect(result.selectedTotalMoney).toBe(40000)
        expect(result.monthlyData).toEqual([{ month: "2024-02", money: 40000 }])
        expect(result.monthlyDetails["2024-02"][0].typeCode).toBe(root.code)
    })

    test("支出负数按金额绝对值展示", () => {
        const expenseRoot = type(-10, "生活支出")
        const food = type(-11, "餐饮", -10)
        const result = aggregateTypeHistory([
            { type: food, money: -5600, happenTime: new Date("2024-06-01 00:00:00") }
        ], [expenseRoot, food], expenseRoot.code)
        expect(result.totalMoney).toBe(5600)
        expect(result.monthlyData[0].money).toBe(5600)
    })
})
