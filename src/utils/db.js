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
        console.log(url);
    }

    select(tablename) {
        let content = this.db.exec(`SELECT * FROM ${tablename}`);
        console.log(content);
        /*
        this.db.all(`select * from ${tablename}`, function(e, row) {
            console.log(e);
            console.log(JSON.stringify(row));
        })
        */
    }

    insert(tablename) {
        /*
        this.db.run(`insert into ${tablename}`, function(e, row) {
            console.log(e);
            console.log(JSON.stringify(row));
        })
        */
    }
}

export default DBHelper