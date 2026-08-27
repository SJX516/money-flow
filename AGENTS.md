# Money Flow — Agent 开发规范

> 本文件是 AI Agent 在本仓库中的工作准则。修改代码前先阅读本文件，并以现有实现、`package.json` 和测试结果为准；文档与代码冲突时，先核实代码，不要沿用过时说明。

## 1. 项目定位与技术栈

- 这是一个纯前端个人财务应用，基于 React 18、Create React App、CRACO、Ant Design 4 和 `sql.js`。
- 数据库运行在浏览器内存中。用户通过本地 SQLite 文件导入数据，并通过导出文件持久化；没有后端服务。
- 源码使用 JavaScript/JSX，不要在单次普通改动中擅自迁移到 TypeScript、函数组件或新的状态管理方案。
- 生产站点通过 GitHub Pages 发布，`package.json#homepage` 和 `build/`/`gh-pages` 流程不可随意改变。

## 2. 核心原则

- **保护用户数据优先**：数据库结构、迁移、金额计算、导入和导出相关改动必须保持向后兼容，并补充测试。
- **最小范围修改**：仓库包含较多历史代码。不要顺手格式化、重命名或重构与任务无关的文件，也不要覆盖用户已有改动。
- **遵循现有架构**：新功能沿用 entity → repo → service → page 的调用方向，页面不得直接拼 SQL。
- **控制文件规模**：新增源文件原则上不超过 300 行，接近 250 行时考虑拆分。现有超长文件属于历史遗留；修改它们时只做局部变更，新增成块逻辑优先提取到组件、service 或 utils，不为满足行数限制进行无关重构。
- 不修改生成物或依赖目录：`build/`、`node_modules/`。除非任务明确涉及依赖升级，否则不要手工编辑 `package-lock.json`。

## 3. 目录与职责

- `src/app.js`：应用级环境、版本号和全局数据库实例；`DB_INIT` 控制数据库就绪状态。
- `src/utils/db.js`：`sql.js` 初始化、数据库建表、版本迁移、CRUD 和导出。
- `src/domain/entity/`：领域实体与 Active Record 风格入口，负责字段映射、校验和实体级读写。
- `src/domain/repo/`：数据访问层。Repo 继承 `BaseRepo`，封装表名、查询条件和数据库结果转换。
- `src/domain/service/`：业务计算、跨实体编排和缓存；当前 service 以静态方法为主。
- `src/pages/`：React 页面和 UI 组件；`pages/main/main_page.js` 负责导航，`pages/detail/` 放功能页面。
- `src/__tests__/`：Jest 测试；WASM 通过 `src/__mocks__/file_mock.js` 和 `jest.config.js` 处理。
- `public/`：CRA 静态资源；`res/`、`test/` 中可能包含测试数据库或辅助 SQL/脚本。

依赖方向应保持为：

```text
pages → services → entities → repositories → App.db/DBHelper
```

- 页面负责展示、交互和调用 service，不直接访问 `App.db`（数据库初始化页面除外）。
- 业务规则放 service；可复用的展示模型转换放 `view_model_service.js` 或合适的独立模块。
- SQL 和表字段知识集中在 `DBHelper`/repo，避免散落到 service 与页面。
- 新实体应沿用现有 Active Record 约定：静态 repo、`save/query/delete` 等入口，以及 repo 的 `convert()` 映射。

## 4. 数据库与迁移规范

- 任何数据操作前必须确保数据库已经通过 `App.initDb(file)` 或 `App.createDb()` 初始化；沿用现有 `DB_INIT` 防护。
- 修改 schema 时：
  1. 递增 `src/utils/db.js` 中的 `LatestDbVersion`；
  2. 新增独立的 `vNUpdate(helper)`；
  3. 将迁移注册到 `updateFuncs`；
  4. 保证旧版本数据库可按顺序升级到最新版；
  5. 为“旧库升级”和“新建库结果”补充测试。
- 迁移必须可预测，避免删除表、丢列或清空用户数据。确需破坏性迁移时先说明风险并获得用户确认。
- 值参数必须通过 `sql.js` 绑定参数传入，不把用户输入直接拼进 SQL。表名、列名和排序字段只能来自代码内可信白名单。
- 金额和数量计算要明确单位、舍入方式与空值行为；不要用隐式 truthy/falsy 判断把合法的 `0` 当作缺失值。
- 修改写入逻辑时检查自动导出计数 `checkAutoSave()` 的行为，避免一次用户操作被重复计数或漏计。
- 不把真实个人财务数据、导出的数据库文件或调试日志提交到仓库。测试夹具只使用虚构数据。

## 5. React 与 JavaScript 约定

- 保持当前代码风格和组件形态；修改 class component 时不要为了偏好改写成 hooks。
- UI 文案、注释和错误提示优先使用中文，与现有 Ant Design `zh_CN` 界面一致。
- 页面必须正确处理数据库未初始化、空数据、无效输入和异步失败状态。
- 不直接修改 state；使用 `setState`。事件回调中避免重复查询数据库和重复计算大数据集，必要时在 service 层缓存并在写入后正确失效。
- 日期统一使用现有 `Date.prototype.format()` / `timeStr()` 与 `TimeUtil` 约定；不要混用未说明时区的字符串格式。
- 新增共享常量时使用有意义的名称，避免魔法数字；领域枚举遵循现有 entity 文件中的组织方式。
- 新依赖必须有明确必要性。优先使用 React、Ant Design 和仓库已有工具，不引入功能重叠的大型库。

## 6. 测试与验证

按改动范围执行最小但充分的验证：

```bash
npm test -- --runInBand   # 非交互运行 Jest 测试
npm run start             # Windows/cmd 环境的快速启动
npm run start:mac         # macOS/Linux shell 的快速启动
```

- 当前 `start`/`build` 脚本使用 Windows `set NODE_OPTIONS=...`；在 macOS/Linux/WSL 中使用 `start:mac`/`build:mac`。
- 开发服务器：Windows 使用 `npm start`，macOS/Linux/WSL 使用 `npm run start:mac`。
- 不要自动执行 `npm run deploy`；部署会修改远端状态，只有用户明确要求时才执行。
- entity/repo/service、金额计算、日期边界或数据库迁移有变化时，必须新增或更新 Jest 测试。
- UI 改动除测试外至少执行一次生产构建；涉及关键交互时说明需要人工检查的路径。
- 不要为了让测试通过而降低断言、跳过测试或吞掉异常。若仓库原有失败与本次改动无关，要明确记录。

## 7. 工作流程

1. 开始前查看 `git status`，识别并保留用户已有改动。
2. 阅读目标模块及其直接上下游（page/service/entity/repo），确认数据流后再修改。
3. 优先做小而完整的改动；若必须拆分历史大文件，保证行为不变并单独验证。
4. 完成后检查 diff，确认没有改动 `build/`、`node_modules/` 或真实数据文件。
5. 执行与改动匹配的测试和构建，并如实汇报结果与未验证项。

## 8. Git 与发布

- 未经用户明确要求，不创建提交、不推送、不部署。
- commit message 使用中文 Conventional Commits：`feat:`、`fix:`、`refactor:`、`test:`、`docs:`、`perf:`、`chore:`、`revert:`。
- 一个提交只解决一个清晰问题；不要混入生成物、个人数据库或无关格式化。
- 发布版本时同步核对 `package.json#version`、`src/app.js` 中的 `_version` 和 `ChangeLog.md`，不要只更新其中一处。
