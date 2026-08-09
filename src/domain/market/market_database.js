import initSqlJs from "sql.js";
/* eslint import/no-webpack-loader-syntax: off */
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";

const MARKET_DB_VERSION = "2";
const REQUIRED_TABLES = ["market_meta", "market_instrument", "stock_daily", "stock_valuation", "market_daily", "market_target"];

class MarketDatabase {
    constructor(db) {
        this.db = db;
    }

    static async create() {
        const SQL = await initSqlJs({ locateFile: () => sqlWasm });
        const helper = new MarketDatabase(new SQL.Database());
        helper.createSchema();
        return helper;
    }

    static async load(file) {
        const SQL = await initSqlJs({ locateFile: () => sqlWasm });
        const buffer = await file.arrayBuffer();
        const helper = new MarketDatabase(new SQL.Database(new Uint8Array(buffer)));
        helper.migrate();
        helper.validate();
        return helper;
    }

    createSchema() {
        this.db.run("CREATE TABLE market_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
        this.db.run("CREATE TABLE market_instrument (code TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, updated_at TEXT NOT NULL)");
        this.db.run("CREATE TABLE stock_daily (code TEXT NOT NULL, trade_date TEXT NOT NULL, open REAL NOT NULL, close REAL NOT NULL, high REAL NOT NULL, low REAL NOT NULL, volume REAL, amount REAL, ma5 REAL, ma30 REAL, PRIMARY KEY (code, trade_date))");
        this.db.run("CREATE TABLE stock_valuation (code TEXT NOT NULL, report_date TEXT NOT NULL, pe REAL, pb REAL, dividend_yield REAL, pe_filled INTEGER NOT NULL DEFAULT 0, pb_filled INTEGER NOT NULL DEFAULT 0, dividend_filled INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (code, report_date))");
        this.db.run("CREATE TABLE market_daily (trade_date TEXT PRIMARY KEY, turnover_trillion REAL, margin_trillion REAL)");
        this.createTargetTable();
        this.run("INSERT INTO market_meta (key, value) VALUES (?, ?)", ["db_version", MARKET_DB_VERSION]);
        this.run("INSERT INTO market_meta (key, value) VALUES (?, ?)", ["default_start_date", "2015-01-01"]);
        this.run("INSERT INTO market_meta (key, value) VALUES (?, ?)", ["default_end_date", this.today()]);
    }

    createTargetTable() {
        this.db.run("CREATE TABLE market_target (id INTEGER PRIMARY KEY AUTOINCREMENT, scope_code TEXT NOT NULL, metric TEXT NOT NULL, target_value REAL NOT NULL, description TEXT, color TEXT NOT NULL, created_at TEXT NOT NULL)");
        this.db.run("CREATE INDEX idx_market_target_scope ON market_target(scope_code)");
    }

    migrate() {
        const tables = new Set(this.rows("SELECT name FROM sqlite_master WHERE type='table'").map(row => row.name));
        if (!tables.has("market_meta")) return;
        const version = this.getMeta("db_version");
        if (version === "1") {
            this.transaction(() => {
                this.createTargetTable();
                this.setMeta("db_version", MARKET_DB_VERSION);
            });
        }
    }

    validate() {
        const rows = this.rows("SELECT name FROM sqlite_master WHERE type='table'");
        const names = new Set(rows.map(row => row.name));
        const missing = REQUIRED_TABLES.filter(name => !names.has(name));
        if (missing.length) {
            throw new Error("不是有效的行情数据库，缺少表：" + missing.join("、"));
        }
        const version = this.getMeta("db_version");
        if (version !== MARKET_DB_VERSION) {
            throw new Error("不支持的行情数据库版本：" + (version || "未知"));
        }
    }

    today() {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    run(sql, params = []) {
        this.db.run(sql, params);
    }

    rows(sql, params = []) {
        const result = this.db.exec(sql, params);
        if (!result.length) return [];
        const { columns, values } = result[0];
        return values.map(valuesRow => Object.fromEntries(columns.map((column, index) => [column, valuesRow[index]])));
    }

    getMeta(key) {
        const rows = this.rows("SELECT value FROM market_meta WHERE key=?", [key]);
        return rows.length ? rows[0].value : null;
    }

    setMeta(key, value) {
        this.run("INSERT OR REPLACE INTO market_meta (key, value) VALUES (?, ?)", [key, String(value)]);
    }

    getDefaultRange() {
        return [this.getMeta("default_start_date") || "2015-01-01", this.getMeta("default_end_date") || this.today()];
    }

    setDefaultRange(startDate, endDate) {
        this.setMeta("default_start_date", startDate);
        this.setMeta("default_end_date", endDate);
    }

    listInstruments(type = null) {
        const sql = "SELECT * FROM market_instrument" + (type ? " WHERE type=?" : "") + " ORDER BY code";
        return this.rows(sql, type ? [type] : []);
    }

    listStockSummaries() {
        return this.rows("SELECT i.code,i.name,COUNT(d.trade_date) AS row_count,MAX(d.trade_date) AS latest_date FROM market_instrument i LEFT JOIN stock_daily d ON d.code=i.code WHERE i.type='stock' GROUP BY i.code,i.name ORDER BY i.code");
    }

    getMarketSummary() {
        return this.rows("SELECT COUNT(*) AS row_count,MAX(trade_date) AS latest_date FROM market_daily")[0] || { row_count: 0, latest_date: null };
    }

    getInstrument(code) {
        return this.rows("SELECT * FROM market_instrument WHERE code=?", [code])[0] || null;
    }

    saveInstrument(instrument) {
        this.run("INSERT OR REPLACE INTO market_instrument (code,name,type,start_date,end_date,updated_at) VALUES (?,?,?,?,?,?)", [
            instrument.code, instrument.name, instrument.type, instrument.startDate, instrument.endDate, new Date().toISOString()
        ]);
    }

    saveStock(code, name, startDate, endDate, dailyRows, valuationRows, replace = false) {
        this.transaction(() => {
            if (replace) this.removeStock(code);
            this.saveInstrument({ code, name, type: "stock", startDate, endDate });
            dailyRows.forEach(row => this.run("INSERT OR REPLACE INTO stock_daily (code,trade_date,open,close,high,low,volume,amount,ma5,ma30) VALUES (?,?,?,?,?,?,?,?,?,?)", [
                code, row.date, row.open, row.close, row.high, row.low, row.volume, row.amount, row.ma5, row.ma30
            ]));
            valuationRows.forEach(row => this.run("INSERT OR REPLACE INTO stock_valuation (code,report_date,pe,pb,dividend_yield,pe_filled,pb_filled,dividend_filled) VALUES (?,?,?,?,?,?,?,?)", [
                code, row.date, row.pe, row.pb, row.dividendYield, row.peFilled ? 1 : 0, row.pbFilled ? 1 : 0, row.dividendFilled ? 1 : 0
            ]));
        });
    }

    removeStock(code) {
        this.run("DELETE FROM stock_daily WHERE code=?", [code]);
        this.run("DELETE FROM stock_valuation WHERE code=?", [code]);
        this.run("DELETE FROM market_instrument WHERE code=?", [code]);
    }

    getStockLatestDate(code) {
        const row = this.rows("SELECT MAX(trade_date) AS latest_date FROM stock_daily WHERE code=?", [code])[0];
        return row && row.latest_date ? row.latest_date : null;
    }

    getStockDaily(code, startDate, endDate) {
        return this.rows("SELECT * FROM stock_daily WHERE code=? AND trade_date>=? AND trade_date<=? ORDER BY trade_date", [code, startDate, endDate]);
    }

    getStockValuation(code, startDate, endDate) {
        return this.rows("SELECT * FROM stock_valuation WHERE code=? AND report_date>=? AND report_date<=? ORDER BY report_date", [code, startDate, endDate]);
    }

    saveMarket(startDate, endDate, rows, replace = false) {
        this.transaction(() => {
            if (replace) this.run("DELETE FROM market_daily");
            rows.forEach(row => this.run("INSERT OR REPLACE INTO market_daily (trade_date,turnover_trillion,margin_trillion) VALUES (?,?,?)", [
                row.date, row.turnoverTrillion, row.marginTrillion
            ]));
            this.saveInstrument({ code: "MARKET", name: "沪深两市", type: "market", startDate, endDate });
        });
    }

    listTargets(scopeCode) {
        return this.rows("SELECT * FROM market_target WHERE scope_code=? ORDER BY id", [scopeCode]);
    }

    saveTarget(scopeCode, metric, targetValue, description, color) {
        this.run("INSERT INTO market_target (scope_code,metric,target_value,description,color,created_at) VALUES (?,?,?,?,?,?)", [
            scopeCode, metric, targetValue, description || "", color, new Date().toISOString()
        ]);
        return this.rows("SELECT * FROM market_target WHERE id=last_insert_rowid()")[0];
    }

    updateTarget(id, scopeCode, metric, targetValue, description, color) {
        this.run("UPDATE market_target SET metric=?,target_value=?,description=?,color=? WHERE id=? AND scope_code=?", [
            metric, targetValue, description || "", color, id, scopeCode
        ]);
        return this.rows("SELECT * FROM market_target WHERE id=? AND scope_code=?", [id, scopeCode])[0] || null;
    }

    deleteTarget(id) {
        this.run("DELETE FROM market_target WHERE id=?", [id]);
    }

    getMarketDaily(startDate, endDate) {
        return this.rows("SELECT * FROM market_daily WHERE trade_date>=? AND trade_date<=? ORDER BY trade_date", [startDate, endDate]);
    }

    transaction(action) {
        this.db.run("BEGIN");
        try {
            action();
            this.db.run("COMMIT");
        } catch (error) {
            this.db.run("ROLLBACK");
            throw error;
        }
    }

    export(filename = "market-data.db") {
        const blob = new Blob([this.db.export()], { type: "application/x-sqlite3" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(url), 1500);
    }
}

export { MARKET_DB_VERSION };
export default MarketDatabase;
