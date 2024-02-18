class LogUtil {
    static logLevel = 1;
    static levelNames = ["debug", "info", "warn", "error"];

    static debug(msg, ...optionalParams) {
        this.log(0, msg, optionalParams)
    }

    static info(msg, ...optionalParams) {
        this.log(1, msg, optionalParams)
    }

    static warn(msg, ...optionalParams) {
        this.log(2, msg, optionalParams)
    }

    static error(msg, ...optionalParams) {
        this.log(3, msg, optionalParams)
    }

    static log(level, msg, ...optionalParams) {
        if(level >= this.logLevel) {
            console.log(`[${this.levelNames[level]}] ${msg}`, optionalParams)
        }
    }
}

class MoneyUtil {
    static noValue(money) {
        return DataUtil.isEmpty(money) || DataUtil.notNumber(money) || money == 0
    }

    static getDetailStr(money) {
        if(this.noValue(money)) {
            return "-"
        }
        let temp = money / 100
        if(temp % 1 === 0) {
            return `￥${temp}`
        } else {
            return `￥${temp.toFixed(2)}`
        }
    }

    static getStr(money, isYuan=false) {
        if(this.noValue(money)) {
            return "-"
        }
        let temp = money / 100
        if(isYuan) {
            temp = money
        }
        return `￥${this.getFixedMoney(temp)}`
    }

    static getMoneyColorType(money) {
        if(this.noValue(money)) {
            return ""
        }
        if(money > 0) {
            return "danger"
        } else if(money < 0) {
            return "success"
        } else {
            return ""
        }
    }

    // 1234567 -> 1,234,567
    static getFixedMoney(money) {
        var negMoney = money < 0
        var str = money.toFixed()
        if(negMoney) {
            str = str.substr(1)
        }
        var l = str.length
        var strArr = []
        for(var i = 0; i < l; ) {
            var count = i == 0 ? l % 3 : 3
            if(count == 0) {
                count = 3
            }
            strArr.push(str.substr(i, count))
            i += count
        }
        if(negMoney) {
            return "-" + strArr.join(",")
        } else {
            return strArr.join(",")
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

    static compareAbs(money1, money2) {
        if(DataUtil.notNumber(money1)) {
            return -1
        } else if (DataUtil.notNumber(money2)) {
            return 1
        }
        return Math.abs(money1) - Math.abs(money2)
    }

    // a / b
    static safeDivision(a, b) {
        if(DataUtil.notNumber(a) || DataUtil.notNumber(b) || b == 0) {
            return null
        } else {
            return a / b
        }
    }

    static getPercentStr(percent) {
        if(DataUtil.notNumber(percent) || Math.abs(percent) <= 0.0001) {
            return "-"
        } else {
            return DataUtil.getPercent(percent)
        }
    }

    static getPercentColorType(percent) {
        if(DataUtil.notNumber(percent) || Math.abs(percent) <= 0.0001) {
            return ""
        }
        if(percent > 0) {
            return "danger"
        } else if(percent < 0) {
            return "success"
        } else {
            return ""
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

    static safeGetNumber(o) {
        if(this.notNumber(o)) {
            return 0
        } else {
            return o
        }
    }

    static getPercent(a) {
        let temp = a * 100
        if(temp % 1 === 0) {
            return `${temp}%`
        } else {
            return `${temp.toFixed(2)}%`
        }
    }

    static compare(a, b) {
        if(DataUtil.notNumber(a)) {
            return -1
        } else if (DataUtil.notNumber(b)) {
            return 1
        }
        return a - b
    }

    static compareAbs(a, b) {
        if(DataUtil.notNumber(a)) {
            return -1
        } else if (DataUtil.notNumber(b)) {
            return 1
        }
        return Math.abs(a) - Math.abs(b)
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

    static nextYearStart(time1) {
        let month = time1.getMonth() + 1;
        let year = time1.getFullYear() + 1;
        return new Date(`${year}-${month}-01 00:00:00`)
    }

    static yearEnd(time1) {
        return new Date(this.nextYearStart(time1) - 1)
    }

    static lastMonthEnd(time1) {
        return new Date(this.monthStart(time1) - 1)
    }

    static inMonth(time1, monthTime) {
        let currentMonthStart = TimeUtil.monthStart(monthTime)
        let currentMonthEnd = TimeUtil.monthEnd(monthTime)
        return this.inTime(time1, currentMonthStart, currentMonthEnd)
    }

    static inTime(time1, startTime, endTime) {
        if (time1 > endTime || time1 < startTime) {
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
        if(DataUtil.isNull(time1)) {
            return ""
        }
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

export { LogUtil, DataUtil, TimeUtil, MoneyUtil }