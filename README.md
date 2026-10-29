# Three.js 案例集合

一个仓库统一管理和展示多个 Three.js 案例。每个案例放在 `examples/<slug>/` 下，拥有独立源码、依赖和资源，用户可单独复制、运行和构建。

## 当前进度

- **T01：基础项目架构（已完成）**——建立目录、npm workspaces、本地 Git 仓库和文档中心。
- **T02：标准独立案例模板（已完成基础实现）**——建立可复制的 Three.js 模板、案例创建命令、元数据规范和结构校验器，已在仓库外完成安装及构建检查。
- **T03：展示首页与自动索引（已实现）**——Vue 3 + Vite 首页、分类搜索、空状态和自动案例元数据索引。
- **T04：统一静态构建（已完成）**——按公开状态构建独立案例并装配展示首页到 `site-dist/`，已通过多案例、下架及失败回滚检查。
- **T05：GitHub Pages 自动部署（已完成）**——GitHub Actions 构建、产物检查和 Pages 发布成功；线上首页及 JS/CSS 静态资源已通过 HTTP 检查。
- **T06：首个正式案例（已完成并发布）**——[像素奇想游乐园](examples/miniature-amusement-park/README.md)，包含五种动态设施、像素渲染、昼夜切换和移动端界面。
- **T07：更多案例与下载体验（待实施）**——按 [规划文档](docs/THREEJS_COLLECTION_PLAN.md) 后续推进。

当前已提供独立案例模板、展示首页、统一静态构建、自动发布工作流，以及首个已发布的正式案例 `miniature-amusement-park`。案例由 GitHub Actions 部署至 Pages。

## 目录说明

| 路径 | 职责 |
| --- | --- |
| `apps/gallery/` | 已实现的 Vue 案例展示首页 |
| `examples/` | 独立 Three.js 案例，每个子目录必须可单独运行 |
| `packages/` | 可选开发辅助代码；不能作为案例的隐式运行依赖 |
| `scripts/` | 案例生成、规范检查、自动索引与统一构建工具 |
| `.github/workflows/` | 已配置的 GitHub Actions 自动部署工作流 |
| `docs/` | 架构、开发规范、部署、变更和每日实现记录 |
| `templates/threejs-basic/` | 可复制和构建的独立 Three.js 基础模板，不属于正式案例 |

## 创建和校验案例

在仓库根目录使用：

```bash
npm run example:create -- orbit-lab "轨道实验室"
npm run example:validate
```

新案例生成在 `examples/orbit-lab/`，默认 `visible: false`。进入其目录执行 `npm install`、`npm run dev` 或 `npm run build`；即使将该文件夹单独复制到仓库之外，这些命令也应该能够工作。详见 [案例开发规范](docs/CASE_STANDARD.md)。

## 启动案例展示首页

```bash
npm install
npm run gallery:dev
```

浏览器访问开发服务器输出的本地地址。首页自动生成案例索引并读取所有 `visible: true` 的案例信息；没有公开案例时显示创建引导。独立构建首页：

```bash
npm run gallery:build
```

当前独立首页构建目录为 `apps/gallery/dist/`。完整站点需要使用下面的统一构建命令。

## 一键构建完整站点

```bash
npm run site:build
npm run site:verify
```

默认以 GitHub Pages 项目路径 `/threejs-projects/` 构建，输出到 `site-dist/`。构建器会先生成全部公开案例，再构建展示首页，并仅对成功构建的公开案例开放“进入场景”入口。可以通过 `SITE_BASE_PATH` 调整部署子路径。详见 [统一构建说明](docs/BUILD.md)。

推送到 `main` 后，`.github/workflows/deploy.yml` 会自动执行安装、验证、构建和 Pages 发布。目标仓库已绑定，Pages 来源已设为 GitHub Actions，首次线上发布成功。详见 [部署说明](docs/DEPLOYMENT.md)。

## 开发环境

- Node.js 22.12.0 或更新版本
- npm 10（当前 Workspace 基础配置采用 npm 10.9.8）

仓库根目录通过 `package.json` 的 `workspaces` 统一发现后续加入的应用和案例。案例创建后必须允许用户把单个文件夹复制到仓库外，并在该文件夹执行 `npm install`、`npm run dev`、`npm run build`。

## 文档入口

- [项目规划 V1.1](docs/THREEJS_COLLECTION_PLAN.md)
- [架构规范](docs/ARCHITECTURE.md)
- [独立案例开发规范](docs/CASE_STANDARD.md)
- [展示首页与自动索引](docs/GALLERY.md)
- [统一构建与站点装配](docs/BUILD.md)
- [GitHub Pages 自动部署](docs/DEPLOYMENT.md)
- [文档中心](docs/README.md)
- [开发变更日志](docs/CHANGELOG.md)

## GitHub Pages

**已发布网站：** https://duanxirui.github.io/threejs-projects/

**GitHub 仓库：** https://github.com/duanxirui/threejs-projects
正式案例使用 `examples/<slug>/` 子路径。首个案例在线地址：https://duanxirui.github.io/threejs-projects/examples/miniature-amusement-park/
