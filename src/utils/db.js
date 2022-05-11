import initSqlJs from "sql.js";
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

class DBHelper {    
    constructor() {
        this.db = null;
    }

    async init(file) {
        console.log("11");
        console.log(sqlWasm);
        let SQL = await initSqlJs({ locateFile: () => sqlWasm });
        console.log("22");
        let fr = new FileReader();
        fr.readAsArrayBuffer(file);
        console.log("33");
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
        let content = this.db.run(`SELECT * FROM ${tablename}`);
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