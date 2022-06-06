class MoneyUtil {
    static getStr(money) {
        if(DataUtil.isEmpty(money) || DataUtil.notNumber(money) || money == 0) {
            return "-"
        }
        let temp = money / 100
        if(temp % 1 === 0) {
            return `￥${temp}`
        } else {
            return `￥${temp.toFixed(2)}`
        }
    }

    static compare(money1, money2) {
        if(DataUtil.notNumber(money1)) {
            return -1
        } else if (DataUtil.notNumber(money2)) {
            return 1
        }
        return money1 - money2
    }

    // a / b
    static safeDivision(a, b) {
        if(DataUtil.notNumber(a) || DataUtil.notNumber(b) || b == 0) {
            return null
        } else {
            return a / b
        }
    }
}

class DataUtil {
    static isEmpty(str) {
        return str === undefined || str === null || str === ""
    }

    static isNull(o) {
        return o === undefined || o === null
    }

    static notNumber(o) {
        return this.isNull(o) || isNaN(o)
    }

    static getPercent(a) {
        let temp = a * 100
        if(temp % 1 === 0) {
            return `${temp}%`
        } else {
            return `${temp.toFixed(2)}%`
        }
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

    static lastMonthEnd(time1) {
        return new Date(this.monthStart(time1) - 1)
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
        if(DataUtil.isNull(time1)) {
            return ""
        }
        return time1.timeStr().substring(0, 10)
    }

    static monthStr(time1) {
        return time1.timeStr().substring(0, 7)
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

export { DataUtil, TimeUtil, MoneyUtil }