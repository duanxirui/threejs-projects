# 项目基础架构约定

> 阶段：T01～T05（基础结构、独立模板、展示首页、统一构建和线上部署）
> 2026-10-29

## 1. 核心原则

一个 `examples/<slug>/` 目录对应一个完整独立的 Three.js 案例。根目录可统一管理和发布，但不得成为案例在其他仓库或电脑独立安装、运行、构建的前提。

## 2. 各目录职责

- `apps/gallery/`（T03 已实现）：Vue 3 + Vite 集合展示首页，仅读取生成后的案例索引，不反向注入运行时依赖到案例。
- `examples/<slug>/`（T02 及后续）：案例源码、独立 `package.json`、Vite 配置、资源、元数据与 README。案例名为稳定的英文小写短横线字符串。
- `templates/threejs-basic/`（T02 已实现）：可直接复制的独立 Three.js 基础模板，不在根目录的 npm workspace 列表中。
- `packages/`：可选开发工具代码。案例不得直接导入根目录中的私有共享包；确需复用应将必要源码纳入案例或使用可公开安装的版本化依赖。
- `scripts/`：T02 已实现案例创建和静态规范校验；T03 已实现案例索引与封面生成；T04 已实现统一构建；可选源码 ZIP 导出仍为后续计划。
- `.github/workflows/deploy.yml`（T05 已启用）：GitHub Actions 在 `main` 分支推送时安装依赖、验证、构建并发布 Pages Artifact；线上部署已成功。
- `docs/`：规划、规范、变更、每日实施记录。

## 3. Workspace 策略

根 `package.json` 声明 `apps/*`、`examples/*`、`packages/*` 作为 npm workspaces。每个真正加入的 Workspace 子工程必须具有独立 `package.json`；空目录使用 `.gitkeep` 占位，不视为已实现的子工程。

根目录现已提供 `npm run site:build` 一键构建命令，但案例的 `dev`、`build`、`preview` 命令仍必须直接在自己的文件夹中工作。独立使用者不需要复制根 `package-lock.json`、根 `scripts/` 或任何其他 Workspace。

## 4. 静态发布路径

目标项目仓库发布根路径为 `/threejs-projects/`，案例路由为 `/threejs-projects/examples/<slug>/`。Vite 发布构建需要适配仓库子路径；独立构建时采用适合案例自身部署的路径规则，静态资源路径不能硬编码为站点根目录。

目标构建输出为：

```text
site-dist/
├── index.html
├── assets/
└── examples/
    └── <slug>/
        ├── index.html
        └── assets/
```

以上目录装配方案已在 T04 实现，T05 完成部署工作流，T06 已加入正式案例 `examples/miniature-amusement-park/`。独立基础模板仍位于 `templates/threejs-basic/`；模板和首个案例的默认 Vite `base` 为 `./`，可通过 `VITE_BASE_PATH` 设置部署子路径。

展示首页的案例元数据和封面由 `scripts/generate-gallery.mjs` 生成，保存于 `apps/gallery/src/data/` 和 `apps/gallery/.generated/public/`，并由 Vite 引入。T04 的 `scripts/build-all.mjs` 传入成功构建案例清单，仅对实际装配完成的案例激活入口，失败则保留上一版 `site-dist/`。参见 [BUILD.md](BUILD.md)。

T05 新增 `scripts/verify-pages.mjs`，在 GitHub Actions 上传 Pages Artifact 前校验首页、案例、封面和本地静态资源引用；工作流在部署后检查首页 HTTP 可达性。仓库、Pages 来源与首次线上部署均已验证；实际案例深链接与浏览器交互仍待补验，详见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 5. T01 边界

T01 负责创建目录、根 npm 配置、Git 本地仓库和文档中心；不在此阶段声明任一案例已可运行，也不提前完成 T02～T07 的实现成果。
