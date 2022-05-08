import sqlite3 from "sqlite3";

class DBHelper {
    constructor(path) {
        this.db = new sqlite3.Database(path);
    }

    select(tablename) {
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