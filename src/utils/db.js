import initSqlJs from "sql.js";
/* eslint import/no-webpack-loader-syntax: off */
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

class DBHelper {    
    constructor() {
        this.db = null;
    }

    async init(file) {
        let SQL = await initSqlJs({ locateFile: () => sqlWasm });
        let fr = new FileReader();
        fr.readAsArrayBuffer(file);
        fr.onload = () => {
            console.log(fr.result);
            const Uints = new Uint8Array(fr.result);
            this.db = new SQL.Database(Uints);
        }
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

    create(tablename) {
        // this.db.run(`CREATE TABLE ${tablename} (col1, col2);`);
    }

    selectAll(tablename) {
        this.select(tablename, [], [])
    }

    select(tablename, cols, values) {
        let sql = `SELECT * FROM ${tablename}`
        let valueDict = {}
        for (var i = 0; i < cols.length; i++) {
            if(i != 0) {
                sql += " and "
            } else {
                sql += " where "
            }
            sql += " " + cols[i] + " = $" + cols[i]
            valueDict['$' + cols[i]] = values[i]   
        }
        console.log(sql + " " + valueDict)
        let content = this.db.exec(sql, valueDict);
        console.log(JSON.stringify(content));
    }

    insert(tablename, values) {
      let sql = `INSERT INTO ${tablename} VALUES`
      let placearr = Array.from({length:values.length}, (v, k) => "?")
      sql += "(" + placearr.join(",") + ")"
      console.log(sql + " " + values)
      this.db.run(sql, values);
    }

    update(tablename, id, cols, values) {
        let sql = `UPDATE ${tablename} SET`
        let valueDict = {}
        for (var i = 0; i < cols.length; i++) {
            sql += " " + cols[i] + " = $" + cols[i]
            valueDict['$' + cols[i]] = values[i]   
        }
        sql += " where id=$id"
        valueDict['$id'] = id
        console.log(sql + " " + valueDict)
        this.db.run(sql, valueDict);
    }
}

export default DBHelper