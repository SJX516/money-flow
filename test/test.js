
class SS {
    t = "SS"
    // constructor() {
        // this.t = "SS"
    // }

    select() {
        console.log(`hello ${this.t}`)
    }
}

class S1 extends SS {
    t = "S2"
    constructor() {
        super()
        // this.t = "S1"
    }
}

var ss = new SS()
var s1 = new S1()

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
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        }
    }
   return fmt; 
}

Date.prototype.timeStr = function() {
    return this.format("yyyy-MM-dd hh:mm:ss")
}

console.log(new Date().format("yyyy-MM-dd hh:mm:ss"))
console.log(new Date().timeStr())
console.log(new Date().getTime())
