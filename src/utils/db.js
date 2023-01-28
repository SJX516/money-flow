import initSqlJs from "sql.js";
/* eslint import/no-webpack-loader-syntax: off */
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";
import { message } from "antd";

class DBHelper {
    constructor() {
        this.db = null;
        this.actionCount = 0
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

    async createDb() {
        let SQL = await initSqlJs({ locateFile: () => sqlWasm });
        this.db = new SQL.Database();
        this.create("CREATE TABLE `data_summary` (\
            `id` INTEGER NOT NULL  ,\
            `gmt_create` datetime NOT NULL  ,\
            `gmt_modified` datetime NOT NULL  ,\
            `type` varchar(64) NOT NULL ,\
            `time` datetime NOT NULL  ,\
            `money` INTEGER,\
            PRIMARY KEY (`id` AUTOINCREMENT)\
           )")
        this.create("CREATE TABLE `income_expenditure_detail` (\
            `id` INTEGER NOT NULL ,\
            `gmt_create` datetime NOT NULL,\
            `gmt_modified` datetime NOT NULL ,\
            `type` int NOT NULL,\
            `desc` varchar(64) NULL,\
            `money` bigint unsigned NOT NULL,\
            `happen_time` datetime NOT NULL,\
            PRIMARY KEY (`id` AUTOINCREMENT)\
        )")
        this.create("CREATE TABLE `investment_detail` (\
            `id` INTEGER NOT NULL  ,\
            `gmt_create` datetime NOT NULL  ,\
            `gmt_modified` datetime NOT NULL  ,\
            `product_id` INTEGER NOT NULL  ,\
            `product_name` varchar(64) NOT NULL  ,\
            `product_type` INTEGER NOT NULL  ,\
            `money` INTEGER NOT NULL  ,\
            `happen_time` datetime NOT NULL  ,\
            `buy_sell_id` INTEGER,\
            `record_type` int NOT NULL , `count` INT,\
            PRIMARY KEY (`id` AUTOINCREMENT)\
           )")
        this.create("CREATE TABLE `investment_product` (\
            `id` INTEGER NOT NULL  ,\
            `gmt_create` datetime NOT NULL  ,\
            `gmt_modified` datetime NOT NULL  ,\
            `name` varchar(64) NOT NULL  ,\
            `type` int NOT NULL  ,\
            `desc` varchar(64) NULL  , fix_vote INT,\
            PRIMARY KEY (`id` AUTOINCREMENT)\
           )")
    }

    export() {
        const data = this.db.export();
        const buffer = Buffer.from(data);
        var blob = new Blob([buffer]);
        var url = window.URL.createObjectURL(blob);
        this.downloadFile(url)
    }

    checkAutoSave() {
        if(++this.actionCount > 20) {
            message.info("自动触发保存")
            this.actionCount = 0
            this.export()
        }
    }

    downloadFile(url) {
        console.log("下载文件：" + url);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.href = url;
        a.download = "data.db";
        a.onclick = () => {
            setTimeout(() => { window.URL.revokeObjectURL(a.href) }, 1500);
        };
        a.click();
    }

    selectAll(tablename) {
        return this.select(tablename, [], [], [])
    }

    select(tablename, cols, values, ops) {
        return this.selectAndOrder(tablename, cols, values, ops, [])
    }

    selectAndOrder(tablename, cols, values, ops, orders) {
        let sql = `SELECT * FROM ${tablename}`
        let data = this.genWhereSql(cols, values, ops)
        let valueDict = data[1]
        sql += data[0]
        if (orders.length > 0) {
            sql += ` order by ${orders.join(',')}`
        }
        // console.log(sql + " " + JSON.stringify(valueDict))
        let content = this.db.exec(sql, valueDict)
        return content
    }

    create(sql) {
        console.log(sql)
        this.db.run(sql)
    }

    insert(tablename, cols, values) {
        let sql = `INSERT INTO ${tablename} (${cols.join(',')}) VALUES (`
        let valueDict = {}
        for (var i = 0; i < cols.length; i++) {
            sql += "$" + cols[i] + i
            if (i < cols.length - 1) {
                sql += ", "
            }
            valueDict['$' + cols[i] + i] = values[i]
        }
        sql += ") returning id"
        console.log(sql + " " + JSON.stringify(valueDict))
        var content = this.db.exec(sql, valueDict);
        this.checkAutoSave()
        return content[0].values[0][0]
    }

    update(tablename, id, cols, values) {
        let sql = `UPDATE ${tablename} SET`
        let data = this.genSubSql(cols, values, [], false)
        let valueDict = data[1]
        sql += data[0]
        sql += " where id=$id"
        valueDict['$id'] = id
        console.log(sql + " " + JSON.stringify(valueDict))
        this.checkAutoSave()
        this.db.run(sql, valueDict);
    }

    deleteAll(tablename) {
        this.delete(tablename, [], [], [])
    }

    delete(tablename, cols, values, ops) {
        let sql = `DELETE FROM ${tablename}`
        let data = this.genWhereSql(cols, values, ops)
        let valueDict = data[1]
        sql += data[0]
        console.log(sql + " " + JSON.stringify(valueDict))
        let content = this.db.exec(sql, valueDict)
        this.checkAutoSave()
        console.log(JSON.stringify(content))
    }

    genWhereSql(cols, values, ops) {
        return this.genSubSql(cols, values, ops, true)
    }

    genSubSql(cols, values, ops, isWhere) {
        let sql = ""
        let valueDict = {}
        for (var i = 0; i < cols.length; i++) {
            if (i !== 0) {
                sql += (isWhere ? " and " : " , ")
            } else {
                sql += (isWhere ? " where " : " ")
            }
            let op = ops[i]
            if (op === undefined) {
                op = "="
            }
            sql += " " + cols[i] + " " + op + " $" + cols[i] + i
            valueDict['$' + cols[i] + i] = values[i]
        }
        return [sql, valueDict]
    }
}

export default DBHelper