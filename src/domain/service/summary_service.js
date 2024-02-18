import { TimeUtil } from "../../utils/utils"
import { SummaryData, SummaryType } from "../entity/summary"

class SummaryService {

    static addMonth(monthDate) {
        var data = new SummaryData()
        data.type = SummaryType.BY_MONTH_KEY
        data.time = TimeUtil.monthStart(monthDate)
        data.save()
    }

    static queryMonths() {
        var monthDatas = SummaryData.queryAllMonthKey()
        return monthDatas.map(d => {
            return TimeUtil.monthStr(d.time)
        })
    }
}

export { SummaryService }
