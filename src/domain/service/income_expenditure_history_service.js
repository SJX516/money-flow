import { TimeUtil } from "../../utils/utils";
import { IncomeExpenditureService } from "./income_expenditure_service";

function getParentCode(type) {
    return type?.config?.parent_code ?? null
}

function getDescendantCodes(types, rootCode) {
    const children = {}
    types.forEach(type => {
        const parentCode = getParentCode(type)
        if(parentCode == null) return
        if(!children[parentCode]) children[parentCode] = []
        children[parentCode].push(type.code)
    })
    const result = []
    const visit = code => {
        result.push(code)
        ;(children[code] || []).forEach(visit)
    }
    visit(rootCode)
    return result
}

function fillMonthlyData(monthTotals) {
    const existingMonths = Object.keys(monthTotals).sort()
    if(existingMonths.length === 0) return []
    const result = []
    const [startYear, startMonth] = existingMonths[0].split('-').map(Number)
    const [endYear, endMonth] = existingMonths[existingMonths.length - 1].split('-').map(Number)
    let year = startYear
    let month = startMonth
    while(year < endYear || (year === endYear && month <= endMonth)) {
        const key = `${year}-${String(month).padStart(2, '0')}`
        result.push({ month: key, money: monthTotals[key] || 0 })
        month += 1
        if(month > 12) {
            month = 1
            year += 1
        }
    }
    return result
}

function aggregateTypeHistory(details, types, rootCode, selectedCode=null, includeDescendants=true) {
    const typeMap = Object.fromEntries(types.map(type => [type.code, type]))
    const rootCodes = new Set(getDescendantCodes(types, rootCode))
    const scopedDetails = details.filter(detail => rootCodes.has(detail.type?.code))
    const totalMoney = scopedDetails.reduce((sum, detail) => sum + Math.abs(Number(detail.money) || 0), 0)
    const childTotals = {}
    scopedDetails.forEach(detail => {
        const code = detail.type.code
        childTotals[code] = (childTotals[code] || 0) + Math.abs(Number(detail.money) || 0)
    })
    const donutData = Object.keys(childTotals).map(code => ({
        code: Number(code),
        name: typeMap[code]?.name || code,
        money: childTotals[code]
    })).sort((a, b) => b.money - a.money)

    const lineRootCode = selectedCode == null ? rootCode : selectedCode
    const lineCodes = new Set(includeDescendants ? getDescendantCodes(types, lineRootCode) : [lineRootCode])
    const selectedDetails = scopedDetails.filter(detail => lineCodes.has(detail.type?.code))
    const selectedTotalMoney = selectedDetails.reduce((sum, detail) => sum + Math.abs(Number(detail.money) || 0), 0)
    const monthTotals = {}
    const monthlyDetails = {}
    selectedDetails.forEach(detail => {
        const month = TimeUtil.monthStr(detail.happenTime)
        if(!month) return
        const money = Math.abs(Number(detail.money) || 0)
        monthTotals[month] = (monthTotals[month] || 0) + money
        if(!monthlyDetails[month]) monthlyDetails[month] = []
        monthlyDetails[month].push({
            id: detail.id, happenTime: detail.happenTime, typeCode: detail.type?.code, typeName: detail.type?.name || "",
            desc: detail.desc, rawMoney: detail.money, money
        })
    })
    return {
        totalMoney,
        selectedTotalMoney,
        donutData,
        monthlyData: fillMonthlyData(monthTotals),
        monthlyDetails,
        descendantTypes: types.filter(type => type.code !== rootCode && rootCodes.has(type.code)),
        selectedType: selectedCode == null ? typeMap[rootCode] : typeMap[selectedCode]
    }
}

class IncomeExpenditureHistoryService {
    static getTypes(isIncome) {
        return isIncome ? IncomeExpenditureService.getIncomeTypes() : IncomeExpenditureService.getExpenditureTypes()
    }

    static getTopTypes(isIncome) {
        return this.getTypes(isIncome).filter(type => getParentCode(type) == null)
    }

    static query(isIncome, rootCode, selectedCode=null, includeDescendants=true) {
        return aggregateTypeHistory(
            IncomeExpenditureService.queryAll(),
            this.getTypes(isIncome),
            rootCode,
            selectedCode,
            includeDescendants
        )
    }
}

export { IncomeExpenditureHistoryService, aggregateTypeHistory, getDescendantCodes };
