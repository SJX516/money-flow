class DataUtil {
    static isEmpty(str) {
        return str === undefined || str === null || str === ""
    }

    static isNull(o) {
        return o === undefined || o === null
    }
}

class TimeUtil {
    static nextMonthStart(time1) {
        let month = time1.getMonth() + 1;
        let year = time1.getFullYear();
        if (month === 12) {
            year += 1;
            month = '01';
        } else {
            month += 1;
            month = (month < 10) ? '0' + month : month;
        }
        return new Date(`${year}-${month}-01 00:00:00`)
    }

    static monthEnd(time1) {
        return new Date(this.nextMonthStart(time1) - 1)
    }

    static monthStart(time1) {
        let month = time1.getMonth() + 1;
        let year = time1.getFullYear();
        return new Date(`${year}-${month}-01 00:00:00`)
    }

    static inMonth(time1, monthTime) {
        let currentMonthStart = TimeUtil.monthStart(monthTime)
        let currentMonthEnd = TimeUtil.monthEnd(monthTime)
        if (time1 > currentMonthEnd || time1 < currentMonthStart) {
            return false
        } else {
            return true
        }
    }

    static dayStr(time1) {
        return time1.timeStr().substring(0, 10)
    }

    static weekDayStr(time1) {
        let i = time1.getDay()
        switch (i) {
            case 0:
                return "周日"
            case 1:
                return "周一"
            case 2:
                return "周二"
            case 3:
                return "周三"
            case 4:
                return "周四"
            case 5:
                return "周五"
            case 6:
                return "周六"
        }
    }
}

export { DataUtil, TimeUtil }