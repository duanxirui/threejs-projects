# Three.js 案例集合项目规划方案

> 版本：V1.1
> 日期：2026-10-29
> 状态：T01～T04 已完成；T05 自动部署配置及本地验证已完成，远程上线待实施；T06～T07 待实施
> 项目根目录：`D:\AI-Codex-Projects\threejs-projects`

## 1. 项目目标

在一个 GitHub 仓库中集中维护多个 Three.js 案例，每个案例占用一个独立文件夹；通过 GitHub Pages 提供统一的案例展示首页，用户可以在线浏览、进入案例，也可以只下载喜欢的案例源码。

本项目同时满足两种使用方式：

1. **集合模式**：一个仓库统一管理、统一构建和发布，网站首页提供分类、搜索、预览及案例入口。
2. **独立模式**：只复制某个案例目录，无须携带仓库其他文件，即可安装依赖、启动开发服务器、构建并单独发布。

**核心原则：一个案例 = 一个完整、可移植、可独立运行的 Three.js 项目。**

根目录仅承担管理、索引生成与统一发布职责，不能成为单独案例运行的前置条件。

## 2. 推荐技术选型

| 模块 | 选型 | 说明 |
| --- | --- | --- |
| 3D 引擎 | Three.js | 各案例的主要渲染与交互框架 |
| 案例构建 | Vite | 每个案例独立开发与构建 |
| 开发语言 | JavaScript 优先，按需 TypeScript | 避免对简单案例强加技术栈 |
| 首页 | Vue 3 + Vite | 案例卡片、分类和搜索 |
| 仓库管理 | npm workspaces | 从根目录统一安装依赖和调度构建 |
| 案例索引 | `example.json` + 生成脚本 | 自动汇总案例展示信息 |
| 持续部署 | GitHub Actions | 推送主分支后统一构建、部署 |
| 托管 | GitHub Pages | 发布静态首页及各案例 |

说明：npm workspaces 只提供集合管理便利。每个案例的 `package.json` 必须完整声明自身依赖和脚本；独立复制后可直接运行 `npm install`，不依赖根目录的 `package-lock.json`。

## 3. 建议目录结构

```text
threejs-projects/
├── apps/
│   └── gallery/                       # 统一案例展示首页
│       ├── index.html
│       ├── src/
│       │   ├── App.vue                 # T03 页面、分类与搜索
│       │   ├── style.css               # T03 响应式视觉样式
│       │   └── data/                   # 自动生成案例索引
│       ├── .generated/                 # 自动生成封面，已忽略
│       ├── .generated/public/          # T03 封面资源构建输入
│       ├── package.json
│       └── vite.config.js
├── examples/                           # 所有独立 Three.js 案例
│   ├── solar-system/
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.js
│   │   │   ├── style.css
│   │   │   └── components/
│   │   ├── public/
│   │   │   ├── models/
│   │   │   ├── textures/
│   │   │   └── preview.svg
│   │   ├── example.json               # 首页使用的案例信息
│   │   ├── package.json               # 独立依赖与运行脚本
│   │   ├── vite.config.js              # 独立 Vite 配置
│   │   ├── .gitignore                  # 独立 Git 忽略规则
│   │   └── README.md                   # 单案例使用说明
│   ├── earth-globe/
│   ├── car-showroom/
│   └── particle-galaxy/
├── templates/
│   └── threejs-basic/                  # T02 已实现，独立案例基础模板
├── packages/
│   └── shared/                          # 可选：开发辅助库，不得构成案例运行依赖
├── scripts/
│   ├── create-example.mjs              # T02 已实现，新建独立案例
│   ├── validate-examples.mjs           # T02 已实现，校验案例规范
│   ├── generate-gallery.mjs             # T03 已实现，元数据及封面索引
│   ├── build-all.mjs                    # T04 已实现，统一构建全部公开页面
│   ├── verify-pages.mjs                 # T05 已实现，发布前校验站点资源
│   └── package-example.mjs              # 可选：导出单案例 ZIP
├── docs/
│   ├── THREEJS_COLLECTION_PLAN.md       # 本文档
│   ├── ARCHITECTURE.md                  # T01/T02 架构约定
│   ├── CASE_STANDARD.md                 # T02 已实现，独立案例开发规范
│   ├── example.schema.json             # T02 已实现，元数据 Schema
│   ├── GALLERY.md                       # T03 已实现，展示首页与自动索引说明
│   ├── BUILD.md                         # T04 已实现，静态站点构建与装配说明
│   ├── DEPLOYMENT.md                   # T05 已实现，GitHub Pages 部署说明
│   ├── CHANGELOG.md                     # 实际开发变更日志
│   └── plans/
│       └── YYYY-MM-DD.md                # 每日已完成内容及整改记录
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json                         # Workspace 与根目录脚本
├── package-lock.json
├── .gitignore
└── README.md                             # 仓库总说明
```

以上为目标结构，当前并不意味着所有目录、案例和脚本均已存在。实际建设时逐阶段创建。

## 4. 单案例独立性强制规范

### 4.1 必须具备的能力

每一个 `examples/<slug>/` 目录必须满足：

1. 拥有自己的 `index.html`、`src/`、`package.json`、`vite.config.js` 和 `README.md`。
2. `package.json` 完整列出运行和构建所需的依赖与脚本，包括 `dev`、`build`、`preview`。
3. 模型、贴图、字体、音频等必需资源保存在本案例目录中；可额外配置可选远程资源，但离线所需资源不能依赖其他案例目录。
4. 不引用 `../../packages/shared`、其他案例或根目录的源码、配置、构建脚本；不得使用仅适用于仓库内部的 `workspace:*` 依赖。
5. 不需要根目录 `.env`、根目录别名、根目录 Vite 插件配置或统一构建脚本才能启动。
6. 路径兼容本地根路径和 GitHub Pages 子路径；不得把资源地址写死为 `/models/...` 等站点根路径。Vite 的 `base` 应按构建环境处理，代码使用 Vite 资源导入机制或 `import.meta.env.BASE_URL` 等可移植路径。
7. 目录名使用稳定的英文小写短横线命名（例如 `solar-system`）；不可依靠目录前缀编号表达展示顺序。
8. README 说明运行环境、安装、启动、打包、资源来源和主要功能。

### 4.2 单案例复制后的操作

用户只需复制 `examples/solar-system/` 文件夹，在安装 Node.js 的设备上执行：

```bash
cd solar-system
npm install
npm run dev
```

独立构建：

```bash
npm run build
npm run preview
```

`npm run build` 应生成可单独部署的 `dist/`。导出的源码 ZIP 应包含案例源码、配置、资源和 README；不包含 `node_modules/`、`dist/`、缓存或本地密钥。

### 4.3 公共代码与资源策略

`packages/shared/` 仅作为可选开发工具库。为了确保“复制一个目录就能运行”，正式案例禁止直接依赖工作区内的共享包。确实需要复用的模块，应作为案例内源码、副本或正常发布到包注册表的版本化依赖交付；其中私有包、不可公开访问的远程接口不得成为案例的隐含前提。

如果某个案例确实需要服务器、API 密钥或外部付费资源，应在 README 明示，并将该案例标为“需外部服务”；此类案例不能宣称完全离线独立运行。

## 5. 案例元数据与展示首页

每个案例根目录保留 `example.json`，示例：

```json
{
  "slug": "solar-system",
  "name": "太阳系探索",
  "description": "交互式太阳系场景，可查看行星与轨道。",
  "category": "宇宙探索",
  "tags": ["Three.js", "行星", "动画"],
  "cover": "public/preview.webp",
  "visible": true
}
```

索引生成脚本负责检查唯一 `slug`、必需字段和封面文件，汇总为首页可使用的数据。首页计划具备：

- 分类筛选、关键词搜索与响应式案例卡片；
- 案例标题、简介、封面图、技术标签；
- “在线体验”“查看源码”入口，后续可增加“下载单案例 ZIP”；
- 桌面端与移动端适配，深色科技风格；
- 只展示已配置为 `visible: true` 且构建成功的案例。

案例文件夹本身不应反向依赖首页工程；新增案例只需添加文件夹和元数据，首页由脚本自动发现并更新。

## 6. GitHub Pages 网址与构建方案

假设仓库名为 `threejs-projects`，用户登录名以 `<username>` 表示：

| 页面 | URL 路径 |
| --- | --- |
| 展示首页 | `https://<username>.github.io/threejs-projects/` |
| 太阳系 | `https://<username>.github.io/threejs-projects/examples/solar-system/` |
| 3D 地球 | `https://<username>.github.io/threejs-projects/examples/earth-globe/` |
| 汽车展厅 | `https://<username>.github.io/threejs-projects/examples/car-showroom/` |

站点采用静态多页面发布，案例使用各自的 `index.html` 入口。不要依赖 GitHub Pages 提供服务端路由回退。

计划中的总构建产物：

```text
site-dist/
├── index.html
├── assets/                          # 首页资源
├── covers/                          # 案例封面图
└── examples/
    ├── solar-system/
    │   ├── index.html
    │   └── assets/
    ├── earth-globe/
    └── car-showroom/
```

构建脚本逐个调用案例独立的 `build` 命令，将结果归档到对应子目录；首页使用同批次生成的案例清单。GitHub Pages 构建时为各应用配置正确的 Vite `base`，防止 JavaScript、CSS、贴图与模型引用产生 404。单独构建案例时则使用可移植的默认路径，不要求存在 `/threejs-projects/` 前缀。

发布流程规划：

1. 向 GitHub 仓库的 `main` 分支提交代码。
2. GitHub Actions 检出仓库、准备 Node.js、安装依赖。
3. 执行元数据检查、首页生成和统一构建，输出 `site-dist/`。
4. 使用 GitHub Pages 官方部署工作流上传并发布该目录。
5. 从首页点击任一案例，确认独立访问地址及静态资源加载正常。

仓库需要在 Settings → Pages 中选用 GitHub Actions 作为发布源。T05 已配置工作流、分支与权限，首次真实发布仍需连接 GitHub 远程仓库。

## 7. 代码与资源管理约定

- 仅仓库根目录初始化一个 Git 仓库，案例目录不再独立初始化 `.git`。
- 根目录统一忽略 `node_modules/`、`dist/`、`site-dist/`、缓存和本地环境密钥。
- 案例用英文目录名与 URL，首页可显示中文或其他语言名称。
- 优先使用经过压缩的 GLB/GLTF、纹理和封面资源；大型模型、贴图以及第三方资源的许可与出处须可追踪。
- 案例加载失败时提供明确提示；不允许单个案例影响首页或其他案例的使用。
- 各案例可独立升级 Three.js 及插件版本，统一构建需兼容这些差异。
- 首版优先保持工程简单，后续根据案例数量和构建时间再考虑增量构建与缓存。

## 8. 分阶段实施计划

| 阶段 | 主要工作 | 阶段验收标准 |
| --- | --- | --- |
| T01 | 建立根目录架构、Workspace、基础配置与文档中心 | 根目录管理结构清晰，目录职责明确 |
| T02 | 制作单案例模板、元数据规范、独立性约束 | 将模板复制到仓库外可独立安装、启动与构建 |
| T03 | 开发展示首页和自动索引 | 能展示分类、搜索、卡片与链接，新增案例无需手工改首页 |
| T04 | 编写统一构建与资源汇总脚本 | 多案例一次构建，输出正确的 `site-dist/` 层级 |
| T05 | 接入 GitHub Actions 和 GitHub Pages | 首页和案例可在线访问，子路径资源无 404 |
| T06 | 创建或迁入首个正式 Three.js 案例 | 完成从独立开发、集合展示到单案例复制运行的闭环 |
| T07 | 增加更多案例、优化资源与下载体验 | 多案例稳定展示，单案例可独立导出与运行 |

阶段文档只记录经确认的实际完成内容与验证结果，不提前将目标写成“已完成”。实施时在 `docs/CHANGELOG.md` 记录变更，并按日期在 `docs/plans/YYYY-MM-DD.md` 记录当日实际完成的功能、问题与整改。

## 9. 关键验收清单

**案例独立性（每个案例均需验收）**：

- [ ] 将案例文件夹复制到仓库之外的新目录。
- [ ] 在复制目录执行 `npm install` 成功。
- [ ] 在复制目录执行 `npm run dev` 并打开 Three.js 场景成功。
- [ ] 在复制目录执行 `npm run build` 成功，`dist/` 可部署。
- [ ] 浏览器无跨目录依赖和资源路径 404。
- [ ] README、模型、贴图、依赖声明完整。

**集合与发布验收**：

- [ ] 首页自动发现可展示的案例并生成卡片。
- [ ] 搜索、分类与移动端布局正常。
- [ ] 统一构建后各案例输出目录相互独立。
- [ ] GitHub Pages 首页与案例深链接均可直接访问。
- [ ] 案例使用的静态资源在 Pages 子路径下正常加载。
- [ ] 下载或复制的单案例在仓库外仍可独立使用。

## 10. 当前阶段与下一步

**T01 已完成（2026-10-29）**：建立基础目录、根 npm workspaces 配置、锁文件、Git `main` 分支和文档中心；配置读取和目录检查正常，详见 [当天实施记录](plans/2026-10-29.md)。

**T02 已完成基础实现（2026-10-29）**：建立独立 Three.js 模板、案例创建及校验命令、JSON Schema 和 [案例开发规范](CASE_STANDARD.md)；仓库外的独立副本通过依赖安装、构建及子路径打包检查。开发服务器启动成功，浏览器 WebGL 画面仍待人工验收。

**T03 已完成基础实现（2026-10-29）**：创建 Vue 3 + Vite 响应式首页、案例卡片、分类搜索、空状态和自动索引生成器；首页 Vite 构建成功，隔离索引验证通过。内置浏览器因访问本机端口超时，仍缺实际浏览器画面验收；详见 [首页说明](GALLERY.md)。

**T04 已完成（2026-10-29）**：新增统一构建命令 `npm run site:build`，构建全部公开案例、生成带正确 Pages 子路径的首页和资源，并汇总到 `site-dist/`；双案例装配、案例下架清理、失败保留旧站点等检查通过，详见 [统一构建说明](BUILD.md)。

**T05 自动部署配置已完成（2026-10-29）**：新增 GitHub Actions 构建与 Pages 部署工作流、`site:verify` 产物校验和 [部署说明](DEPLOYMENT.md)；干净隔离副本通过 npm CI 安装、案例校验、整站构建和产物校验。当前本地仓库未绑定 GitHub `origin`，尚无线上部署记录，因此 T05 的首次发布与线上验收仍待完成。

目前没有正式案例，T06～T07 继续按阶段实施。GitHub Pages 首次上线需要确定目标仓库、推送项目并启用 Pages。
