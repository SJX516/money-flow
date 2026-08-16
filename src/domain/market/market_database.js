import initSqlJs from "sql.js";
/* eslint import/no-webpack-loader-syntax: off */
import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";
import { INDEX_GROUP_NAME } from "./market_constants";

const MARKET_DB_VERSION = "5";
const REQUIRED_TABLES = ["market_meta", "market_instrument", "stock_daily", "stock_valuation", "market_daily",
    "market_target", "stock_group", "stock_watchlist"];

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
        this.db.run("CREATE TABLE stock_daily (code TEXT NOT NULL, trade_date TEXT NOT NULL, open REAL NOT NULL, close REAL NOT NULL, high REAL NOT NULL, low REAL NOT NULL, volume REAL, amount REAL, turnover_rate REAL, ma5 REAL, ma30 REAL, PRIMARY KEY (code, trade_date))");
        this.db.run("CREATE TABLE stock_valuation (code TEXT NOT NULL, report_date TEXT NOT NULL, pe REAL, pb REAL, dividend_yield REAL, pe_filled INTEGER NOT NULL DEFAULT 0, pb_filled INTEGER NOT NULL DEFAULT 0, dividend_filled INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (code, report_date))");
        this.db.run("CREATE TABLE market_daily (trade_date TEXT PRIMARY KEY, turnover_trillion REAL, margin_trillion REAL)");
        this.createTargetTable();
        this.createWatchlistTables();
        this.ensureIndexGroup();
        this.run("INSERT INTO market_meta (key, value) VALUES (?, ?)", ["db_version", MARKET_DB_VERSION]);
        this.run("INSERT INTO market_meta (key, value) VALUES (?, ?)", ["default_start_date", "2015-01-01"]);
        this.run("INSERT INTO market_meta (key, value) VALUES (?, ?)", ["default_end_date", this.today()]);
    }

    createTargetTable() {
        this.db.run("CREATE TABLE market_target (id INTEGER PRIMARY KEY AUTOINCREMENT, scope_code TEXT NOT NULL, metric TEXT NOT NULL, target_value REAL NOT NULL, description TEXT, color TEXT NOT NULL, created_at TEXT NOT NULL)");
        this.db.run("CREATE INDEX idx_market_target_scope ON market_target(scope_code)");
    }

    createWatchlistTables() {
        this.db.run("CREATE TABLE IF NOT EXISTS stock_group (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)");
        this.db.run("CREATE TABLE IF NOT EXISTS stock_watchlist (code TEXT PRIMARY KEY, name TEXT NOT NULL, group_id INTEGER, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, FOREIGN KEY(group_id) REFERENCES stock_group(id) ON DELETE SET NULL)");
        this.db.run("CREATE INDEX IF NOT EXISTS idx_stock_watchlist_group ON stock_watchlist(group_id,sort_order)");
    }

    ensureIndexGroup() {
        const existing = this.rows("SELECT * FROM stock_group WHERE name=?", [INDEX_GROUP_NAME])[0];
        if (existing) return existing;
        this.run("UPDATE stock_group SET sort_order=sort_order+1");
        this.run("INSERT INTO stock_group (name,sort_order,created_at) VALUES (?,?,?)", [
            INDEX_GROUP_NAME, 0, new Date().toISOString()
        ]);
        return this.rows("SELECT * FROM stock_group WHERE name=?", [INDEX_GROUP_NAME])[0];
    }

    migrate() {
        const tables = new Set(this.rows("SELECT name FROM sqlite_master WHERE type='table'").map(row => row.name));
        if (!tables.has("market_meta")) return;
        let version = this.getMeta("db_version");
        if (version === "1") {
            this.transaction(() => {
                this.createTargetTable();
                this.setMeta("db_version", "2");
            });
            version = "2";
        }
        if (version === "2") {
            this.transaction(() => {
                this.createWatchlistTables();
                this.setMeta("db_version", "3");
            });
            version = "3";
        }
        if (version === "3") {
            this.transaction(() => {
                const columns = this.rows("PRAGMA table_info(stock_daily)").map(row => row.name);
                if (!columns.includes("turnover_rate")) this.run("ALTER TABLE stock_daily ADD COLUMN turnover_rate REAL");
                this.setMeta("db_version", "4");
            });
            version = "4";
        }
        if (version === "4") {
            this.transaction(() => {
                this.ensureIndexGroup();
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

    listStockGroups() {
        return this.rows("SELECT g.id,g.name,g.sort_order,COUNT(w.code) AS stock_count FROM stock_group g LEFT JOIN stock_watchlist w ON w.group_id=g.id GROUP BY g.id,g.name,g.sort_order ORDER BY g.sort_order,g.id");
    }

    getStockGroup(id) {
        return this.rows("SELECT * FROM stock_group WHERE id=?", [id])[0] || null;
    }

    saveStockGroup(name) {
        const row = this.rows("SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM stock_group")[0];
        this.run("INSERT INTO stock_group (name,sort_order,created_at) VALUES (?,?,?)", [
            name, row.next_order, new Date().toISOString()
        ]);
        return this.rows("SELECT * FROM stock_group WHERE id=last_insert_rowid()")[0];
    }

    moveStockGroup(id, direction) {
        const groups = this.listStockGroups();
        const index = groups.findIndex(group => group.id === id);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= groups.length) return groups[index] || null;
        const current = groups[index];
        const target = groups[targetIndex];
        this.transaction(() => {
            this.run("UPDATE stock_group SET sort_order=? WHERE id=?", [target.sort_order, current.id]);
            this.run("UPDATE stock_group SET sort_order=? WHERE id=?", [current.sort_order, target.id]);
        });
        return this.getStockGroup(id);
    }

    deleteStockGroup(id) {
        const group = this.getStockGroup(id);
        if (group && group.name === INDEX_GROUP_NAME) throw new Error("指数分组不可删除");
        this.transaction(() => {
            const row = this.rows("SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM stock_watchlist WHERE group_id IS NULL")[0];
            const stocks = this.rows("SELECT code FROM stock_watchlist WHERE group_id=? ORDER BY sort_order,code", [id]);
            stocks.forEach((stock, index) => this.run("UPDATE stock_watchlist SET group_id=NULL,sort_order=? WHERE code=?", [
                row.next_order + index, stock.code
            ]));
            this.run("DELETE FROM stock_group WHERE id=?", [id]);
        });
    }

    listWatchStocks() {
        return this.rows("SELECT w.code,w.name,w.group_id,w.sort_order,g.name AS group_name,g.sort_order AS group_sort_order FROM stock_watchlist w LEFT JOIN stock_group g ON g.id=w.group_id ORDER BY CASE WHEN g.id IS NULL THEN 1 ELSE 0 END,g.sort_order,w.sort_order,w.code");
    }

    getWatchStock(code) {
        return this.rows("SELECT * FROM stock_watchlist WHERE code=?", [code])[0] || null;
    }

    nextWatchOrder(groupId) {
        const row = groupId == null
            ? this.rows("SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM stock_watchlist WHERE group_id IS NULL")[0]
            : this.rows("SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM stock_watchlist WHERE group_id=?", [groupId])[0];
        return row.next_order;
    }

    saveWatchStock(code, name, groupId = null) {
        const order = this.nextWatchOrder(groupId);
        const existing = this.getWatchStock(code);
        if (existing) {
            this.run("UPDATE stock_watchlist SET name=?,group_id=?,sort_order=? WHERE code=?", [name, groupId, order, code]);
        } else {
            this.run("INSERT INTO stock_watchlist (code,name,group_id,sort_order,created_at) VALUES (?,?,?,?,?)", [
                code, name, groupId, order, new Date().toISOString()
            ]);
        }
        return this.getWatchStock(code);
    }

    moveWatchStock(code, groupId) {
        this.run("UPDATE stock_watchlist SET group_id=?,sort_order=? WHERE code=?", [groupId, this.nextWatchOrder(groupId), code]);
        return this.getWatchStock(code);
    }

    removeWatchStock(code) {
        this.run("DELETE FROM stock_watchlist WHERE code=?", [code]);
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
            dailyRows.forEach(row => this.run("INSERT OR REPLACE INTO stock_daily (code,trade_date,open,close,high,low,volume,amount,turnover_rate,ma5,ma30) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [
                code, row.date, row.open, row.close, row.high, row.low, row.volume, row.amount,
                row.turnoverRate == null ? null : row.turnoverRate, row.ma5, row.ma30
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
