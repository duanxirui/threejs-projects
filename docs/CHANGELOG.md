# 开发变更日志

本文件记录已执行的变更；未来计划见 [项目规划](THREEJS_COLLECTION_PLAN.md)。

## 2026-10-29 — T05：GitHub Pages 自动部署配置

### 新增

- `.github/workflows/deploy.yml`：推送 `main` 或手动触发，使用 Node.js 22 和 `npm ci` 安装依赖，依次校验案例、统一构建、校验产物、上传 Pages Artifact 并部署。
- 工作流按仓库名称自动计算 Pages 基础路径，支持普通项目仓库以及 `<owner>.github.io` 根站点仓库，自动配置“查看源码”链接。
- 工作流为构建、部署划分任务，配置所需 Pages/OIDC 权限、部署环境与首页 HTTP 检查。
- `scripts/verify-pages.mjs` 和根命令 `npm run site:verify`：检查首页、每个公开案例的页面与封面、HTML 静态资源引用和站点基础路径。
- `docs/DEPLOYMENT.md`：首次发布条件、远程仓库绑定、Pages 来源设置、路径和验收流程。

### 本地验证

- `site:verify` 在已有 `site-dist/` 上通过：正式案例 0 个，静态资源引用 2 个。
- 在隔离副本中通过 `npm ci` 安装 36 个包，并成功执行 `example:validate`、`site:build`、`site:verify`。
- 原工作目录运行 `npm ci` 时遇到 Windows 原生模块文件占用（EPERM）；随后 `npm install` 成功恢复依赖，原目录 `site:build`、`site:verify` 再次通过。

### 待完成

- 当前 Git 仓库没有远程 `origin`；尚未实际推送、启用 Pages 或取得线上部署成功记录。首次上线需要确定目标 GitHub 仓库并验证真实 URL。
- 浏览器桌面/移动端、案例 WebGL 及线上深链接验收仍待实际网站可访问后补做。

## 2026-10-29 — T04：统一构建与静态站点装配

### 新增

- `scripts/build-all.mjs`：校验并构建公开案例，在各案例目录执行独立 `build`，再构建首页并装配到 `site-dist/`。
- 根命令 `npm run site:build`；默认 Pages 基础路径 `/threejs-projects/`，支持 `SITE_BASE_PATH` 配置其他部署路径。
- 将本轮成功构建的公开案例清单传给首页，仅对存在实际静态页面的案例激活在线入口。
- 使用 `site-dist.__next/` 暂存并验证完整产物，成功后替换旧站点，失败时保留上一版。
- 新增 `docs/BUILD.md`，记录构建命令、产物结构、失败保护和真实验收结果。

### 检查结果

- `node --check scripts/build-all.mjs` 通过；无正式案例时一键构建成功。
- 两个临时独立案例的统一构建通过：案例 HTML、JS / CSS、封面及 Pages 子路径均正确。
- 将一个临时案例改为 `visible: false` 后重新构建，旧页面、封面和索引成功清理。
- 人为触发案例构建退出码 23，确认构建失败并保留上一版完整 `site-dist/`，临时装配目录清理成功。
- 两个临时案例已删除，最终统一构建成功，恢复为没有正式案例的真实站点状态。

### 尚未完成

- GitHub Actions 和 GitHub Pages 线上部署属于 T05；T02、T03 遗留的实际浏览器与移动端画面检查也需要后续补验。

## 2026-10-29 — T03：展示首页与自动索引

### 新增

- `apps/gallery/`：Vue 3 + Vite 展示首页，包含响应式深色科技风格、CSS 三维轨道视觉、案例卡片、分类筛选、关键词搜索、案例统计及空状态引导。
- `scripts/generate-gallery.mjs`：扫描案例元数据，复用独立案例规范校验，按 `visible` 过滤，复制公开案例封面，并输出生成索引。
- 展示首页的 `predev` / `prebuild` 自动触发索引生成，开发服务器监听案例元数据与封面变更。
- 根命令 `gallery:generate`、`gallery:dev`、`gallery:build`、`gallery:preview`。
- `docs/GALLERY.md` 展示首页与索引说明；更新根 README、架构说明和开发规范。

### 检查结果

- Vue 首页本地 Vite 生产构建成功，生成 `apps/gallery/dist/`。
- 使用 `VITE_BASE_PATH=/threejs-projects/` 重新构建成功，产物中的资源地址具有正确的 Pages 子路径。
- 开发服务器启动并报告 ready。
- 在仓库外隔离数据目录验证：公开案例会进入索引，隐藏案例被过滤，封面复制成功；传入构建成功清单后只有对应案例被标记可访问；空清单会清理旧封面。
- 通过本地许可环境临时启动 Vite 服务并请求首页，返回 HTTP 200，页面标题检查通过。
- 当前 `examples/` 无正式案例，索引正常生成空数组，页面提供引导，不展示虚构案例。

### 尚待完成

- 内置浏览器访问本地开发端口超时；虽然 HTTP 首页检查已通过，尚未完成桌面/移动实际渲染和搜索交互的浏览器验收。
- T04 负责所有案例与首页的统一静态构建，T05 负责 GitHub Pages 部署。

## 2026-10-29 — T02：标准独立案例模板与元数据规范

### 新增

- `templates/threejs-basic/`：完整独立的 Three.js + Vite 项目，包括交互式场景、OrbitControls、响应式布局、专属资源目录、封面及使用说明。
- 为模板增加独立的 `.gitignore`，避免复制到其他 Git 仓库时误提交依赖和构建产物。
- 模板自身 `package.json` 和 `package-lock.json`，可脱离集合仓库独立安装与构建。
- `scripts/create-example.mjs`：按英文 slug 和展示名称创建案例副本，自动更新包名、元数据与页面标题；遇到已存在目标目录时不会覆盖。
- `scripts/validate-examples.mjs`：检查模板与正式案例的基本结构、字段、资源路径和依赖声明。
- `docs/CASE_STANDARD.md` 与 `docs/example.schema.json`：规范案例目录、元数据、独立性与 Pages 子路径。
- 根 npm 命令 `example:create`、`example:validate`。

### 验证结果

- 案例模板通过元数据和目录规范校验；两个脚本 `node --check` 通过。
- 仓库外复制的模板运行 `npm ci` 成功，`npm run build` 成功，Vite `npm run dev` 显示 ready。
- Pages 子路径模式构建成功，产物资源引用和封面位置正确。
- 在仓库外模拟案例生成，新案例通过规范校验，包锁文件名称更新正确。

### 尚待验证

- 跨沙箱访问本地 Vite 地址时发生连接限制和超时，尚无浏览器实际 WebGL 渲染截图或画面验收结果。
- 展示首页、统一构建和 GitHub Pages 发布按 T03～T05 继续实施。

## 2026-10-29 — T01：基础项目架构

### 新增

- 建立 `apps/`、`examples/`、`packages/`、`scripts/`、`.github/workflows/` 等基础目录。
- 新增根 `package.json`，配置 npm workspaces 及 Node.js 版本要求。
- 使用 npm 生成根 `package-lock.json`（Lockfile v3）。
- 新增 `.gitignore`、`.editorconfig` 和根目录 `README.md`。
- 建立 `docs/README.md`、`docs/ARCHITECTURE.md`、`docs/CHANGELOG.md` 与每日开发记录。
- 在项目根目录初始化本地 Git 仓库，初始分支为 `main`（尚未建立提交和远程仓库）。

### 检查

- `npm install --package-lock-only --ignore-scripts --offline` 成功，锁文件已生成。
- `npm pkg get name private workspaces engines` 可正常读取配置。
- 检查确认预期的基础目录与文件已存在，Git 当前分支为 `main`。

### 范围

- 此阶段为架构初始化，无 Three.js 案例、展示首页和部署产物。
