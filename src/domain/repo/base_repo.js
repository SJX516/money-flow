import { App, DB_INIT } from '../..';

class BaseRepo {

    constructor() {
        this.tablename = null
        Date.prototype.format = function(fmt) { 
            var o = { 
               "M+" : this.getMonth()+1,                 //月份 
               "d+" : this.getDate(),                    //日 
               "h+" : this.getHours(),                   //小时 
               "m+" : this.getMinutes(),                 //分 
               "s+" : this.getSeconds(),                 //秒 
               "q+" : Math.floor((this.getMonth()+3)/3), //季度 
               "S"  : this.getMilliseconds()             //毫秒 
           }; 
           if(/(y+)/.test(fmt)) {
                   fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
           }
            for(var k in o) {
               if(new RegExp("("+ k +")").test(fmt)){
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length===1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
                }
            }
           return fmt; 
        }
        Date.prototype.timeStr = function() {
            return this.format("yyyy-MM-dd hh:mm:ss")
        }
    }

    static getDateStr(date, allowNull=false) {
        if(date == null) {
            if(allowNull) {
                return new Date().timeStr()
            } else {
                throw new Error("日期不能为 null")
            }
        } else if(date instanceof Date) {
            return date.timeStr()
        } else {
            throw new Error("日期格式不为 Date")
        }
    }

    get(id) {
        if(!DB_INIT) {
            return null
        }
        if (id != null) {
            return this.convert(App.db.select(this.tablename, ["id"], [id], []))
        } else {
            throw new Error("id 不能为空")
        }
    }

    selectAll() {
        if(!DB_INIT) {
            return []
        }
        return this.convert(App.db.selectAll(this.tablename))
    }

    delete(id) {
        if(!DB_INIT) {
            return
        }
        App.db.delete(this.tablename, ["id"], [id], [])
    }

    deleteAll() {
        if(!DB_INIT) {
            return
        }
        App.db.deleteAll(this.tablename)
    }

    convert(content) {}
}

export {BaseRepo}