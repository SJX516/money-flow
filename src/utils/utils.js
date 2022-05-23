class DataUtil {
    static isEmpty(str) {
        return str === undefined || str === null || str === ""
    }
}

class TimeUtil {
    static nextMonthStart(time1) {
        let month = time1.getMonth() + 1;
        let year  = time1.getFullYear();
        if ( month === 12 ) {
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
        let year  = time1.getFullYear();
        return new Date(`${year}-${month}-01 00:00:00`)
    }

    /**
     * 
     * @param {String} "2022-05"
     * @returns {Date}
     */
    static monthStartOfStr(str) {
        return this.monthStart(new Date(str))
    }
}

export {DataUtil, TimeUtil}