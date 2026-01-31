# AI Coding Guidelines for Money Flow App

## Architecture Overview
This is a React-based personal finance app using in-browser SQLite (sql.js) for data persistence. It follows a layered architecture:
- **Entity Layer** (`src/domain/entity/`): Data models with active record pattern - entities handle their own persistence via static repo instances
- **Repository Layer** (`src/domain/repo/`): Data access objects extending BaseRepo for CRUD operations
- **Service Layer** (`src/domain/service/`): Business logic and caching, implemented as static method singletons
- **Pages Layer** (`src/pages/`): React components for UI, with MainPage managing navigation

Key integration: App class (`src/app.js`) manages global DB state; DB_INIT flag controls UI flow.

## Key Patterns
- **Active Record Entities**: Entities like `IncomeExpenditureDetail` have static repo and methods (e.g., `query()`, `save()`)
- **Service Singletons**: Services like `IncomeExpenditureService` use static methods and caching (e.g., `getIncomeTypes()`)
- **Date Extensions**: `Date.prototype.format()` and `Date.prototype.timeStr()` for consistent datetime handling
- **Chinese Localization**: UI uses Ant Design zh_CN locale; comments and strings are in Chinese
- **DB Migrations**: Versioned updates in `utils/db.js` with functions like `v0Update()`

## Development Workflows
- **Start Dev Server**: `npm run start_newer` (uses craco for wasm handling)
  - 每次修改完代码后，不用自动执行该指令，因为当前会自动刷新
- **Run Tests**: `npm test` (Jest with wasm mocking in `jest.config.js`)
- **Build**: `npm run build` (craco build; use `build_newer` for Node 17+ with `NODE_OPTIONS=--openssl-legacy-provider`)
- **Deploy**: `npm run deploy` (gh-pages to GitHub Pages)
- **DB Initialization**: Call `App.initDb(file)` or `App.createDb()` before data operations; check `DB_INIT` flag

## File Structure Guide
- `src/app.js`: Global app state and DB management
- `src/utils/db.js`: SQLite wrapper with migrations
- `src/domain/entity/`: Data models (extend `BaseEntity`)
- `src/domain/repo/`: Data access (extend `BaseRepo`, implement `convert()`)
- `src/domain/service/`: Business logic (static methods, caching)
- `src/pages/main/main_page.js`: Navigation hub
- `src/pages/detail/`: Feature pages (e.g., `month_page.js`, `invest_page.js`)

## Examples
- **Query Entity**: `IncomeExpenditureDetail.queryTimeBetwen(start, end)`
- **Save Entity**: `entity.save()` (auto-handles timestamps and validation)
- **Service Usage**: `IncomeExpenditureService.getIncomeTypes()` (caches results)
- **DB Check**: `if (!DB_INIT) { /* show init page */ }`

Follow active record pattern for new entities; use services for complex logic; always check DB_INIT before data access.</content>
<parameter name="filePath">/home/duchen/workspace/money-flow/.github/copilot-instructions.md