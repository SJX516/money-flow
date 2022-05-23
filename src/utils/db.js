import initSqlJs from "sql.js";
/* eslint import/no-webpack-loader-syntax: off */
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

class DBHelper {    
    constructor() {
        this.db = null;
    }

    async init(file) {
        let SQL = await initSqlJs({ locateFile: () => sqlWasm });
        let fileResult = await new Promise((resolve, reject) => {
            let fr = new FileReader();
            fr.readAsArrayBuffer(file);
            fr.onload = () => resolve(fr.result)
        })
        const Uints = new Uint8Array(fileResult);
        this.db = new SQL.Database(Uints);
    }

    export() {
        const data = this.db.export();
        const buffer = Buffer.from(data);
		var blob = new Blob([buffer]);
		var url = window.URL.createObjectURL(blob);
        this.downloadFile(url)
    }

    downloadFile(url) {
        console.log("下载文件：" + url);
        var a = document.createElement("a");
        document.body.appendChild(a);
		a.href = url;
		a.download = "data.db";
		a.onclick = () => {
            setTimeout(()=> {window.URL.revokeObjectURL(a.href)}, 1500);
		};
		a.click();
    }

    selectAll(tablename) {
        return this.select(tablename, [], [], [])
    }

    select(tablename, cols, values, ops) {
        let sql = `SELECT * FROM ${tablename}`
        let data = this.genWhereSql(cols, values, ops)
        let valueDict = data[1]
        sql += data[0]
        console.log(sql + " " + JSON.stringify(valueDict))
        let content = this.db.exec(sql, valueDict)
        return content
    }

    insert(tablename, values) {
      let sql = `INSERT INTO ${tablename} VALUES`
      let placearr = Array.from({length:values.length}, (v, k) => "?")
      sql += "(" + placearr.join(",") + ")"
      console.log(sql + " " + values)
      this.db.run(sql, values);
    }

    update(tablename, cols, values, ops) {
        let sql = `UPDATE ${tablename} SET`
        let data = this.genWhereSql(cols, values, ops)
        let valueDict = data[1]
        sql += data[0]
        console.log(sql + " " + JSON.stringify(valueDict))
        this.db.run(sql, valueDict);
    }

    deleteAll(tablename) {
        this.delete(tablename, [], [])
    }

    delete(tablename, cols, values, ops) {
        let sql = `DELETE FROM ${tablename}`
        let data = this.genWhereSql(cols, values, ops)
        let valueDict = data[1]
        sql += data[0]
        console.log(sql + " " + JSON.stringify(valueDict))
        let content = this.db.exec(sql, valueDict)
        console.log(JSON.stringify(content))
    }

    genWhereSql(cols, values, ops) {
        let sql = ""
        let valueDict = {}
        for (var i = 0; i < cols.length; i++) {
            if(i !== 0) {
                sql += " and "
            } else {
                sql += " where "
            }
            let op = ops[i]
            if(op === undefined){
                op = "="
            }
            sql += " " + cols[i] + " " + op + " $" + cols[i] + i
            valueDict['$' + cols[i] + i] = values[i]   
        }
        return [sql, valueDict]
    }
}

export default DBHelper