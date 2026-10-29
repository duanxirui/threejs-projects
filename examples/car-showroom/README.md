# CAR ATELIER — Three.js 3D 名车互动展厅

本项目已迁入 [Three.js 案例集合](https://github.com/duanxirui/threejs-projects) 的 `examples/car-showroom/`。只复制本文件夹即可独立安装、运行和构建；集合网站会自动收录此案例，统一构建使用子路径 `/threejs-projects/examples/car-showroom/`。原独立仓库 `duanxirui/car-atelier` 的历史保留在原仓库，迁入时的源码修改已包含在本案例。

基于 **Three.js + Vite + TypeScript** 的网页 3D 名车展厅。目前已接入高精度 CC BY 4.0 的 **Car Concept GLB** 作为默认展车，保留程序化 AURORA S1 样车；支持鼠标或触摸旋转、缩放、视角切换、车漆换色与全屏操作。

Car Concept 现在支持其原生 **Carmine Candy / Pearly Swirly / Torched Graphite** 三套车漆及内饰材质变体。模型几何体已使用 Meshopt 无损压缩，GLB 体积从约 11.77 MB 降至 **9.00 MB**。

页面以 **3D 车辆为主视觉**：右下角使用一个统一控制器，集中提供 **车辆信息 / 视角与车漆 / 车型列表** 三个选项。点击某项向上展开，再次点击或使用面板关闭按钮可收起；其他内容自动隐藏。手机端控制器固定在底部，横屏时收窄靠右并限制展开高度。也可点击展车区域或按 `Esc` 关闭面板。顶部保留纯净观车模式和可记住选择的**中文 / English** 切换。

模型二进制数据采用有容量限制的内存缓存；车辆静止时不再持续提交 WebGL 绘制，拖动、镜头过渡、切换车型及配色时正常重绘。

> Car Concept 是独立的高精度概念车型素材，不代表保时捷、法拉利等厂商的官方车型授权。作者、许可、来源、哈希及商标处理见[开发方案中的素材记录](docs/development-scheme.md#7-已用模型及授权证据)。

## 本地启动

环境要求：Node.js 20.19+ 或 22.12+。项目已提供 `package-lock.json`，新环境优先按锁文件安装：

```bash
npm ci
npm run dev
```

打开终端输出的本地地址。生产构建与本地预览：

```bash
npm run build
npm run preview
```

若本机配置的 npm 镜像缺少某个锁定版本，可以指定官方源安装：`npm ci --registry=https://registry.npmjs.org`。只有修改依赖清单时才运行 `npm install` 并同步提交更新的锁文件。

## 静态部署

1. 在 Node.js 环境执行 `npm ci` 和 `npm run build`。
2. 把 `dist/` **目录内的全部文件**部署到网站根目录，包括 `index.html`、`assets/`、`models/car-concept.glb` 和 `favicon.svg`；生产网站无需 Node.js 常驻进程。
3. 使用 HTTPS 打开网站，检查车型加载、材质切换、模型来源链接、中文/英文及控制面板。部署后仍需在真实手机上检查触摸、安全区和性能。

独立构建默认使用相对路径 `./`，可部署到任意静态站点子目录；集合统一构建通过 `VITE_BASE_PATH` 注入案例的 Pages 子路径。模型和前端资源地址随 Vite `BASE_URL` 自动调整，无须为单独复制的案例修改配置。

## 集合内 GitHub Pages 预览

集合仓库：[duanxirui/threejs-projects](https://github.com/duanxirui/threejs-projects)。

本案例在集合中的发布路径：https://duanxirui.github.io/threejs-projects/examples/car-showroom/ 。从集合根目录执行 `npm run site:build` 后，统一构建器会将当前案例与首页一起装配；推送到集合仓库的 `main` 后由集合工作流自动发布。

## 迁移前的独立仓库历史

原独立代码仓库：[duanxirui/car-atelier](https://github.com/duanxirui/car-atelier)。

迁移前使用独立仓库的 `.github/workflows/deploy-pages.yml` 在 `main` 分支执行构建并部署 GitHub Pages，当时地址为：

https://duanxirui.github.io/car-atelier/

2026-10-21 已通过 [GitHub Actions 部署记录](https://github.com/duanxirui/car-atelier/actions/runs/39547914735)确认成功；公网首页及 `models/car-concept.glb` 均已返回 HTTP 200。

以上 `GITHUB_PAGES=true`、`/car-atelier/` 是原仓库的历史配置。本案例现使用 `VITE_BASE_PATH`，适配集合统一构建。

新的集合仓库已有 GitHub Pages 工作流。正式发布后仍需在真实手机上检查触摸、安全区和性能。

## 文档

从[文档中心](docs/README.md)统一进入：[开发方案](docs/development-scheme.md)记录技术设计、工程结构、模型接入与素材授权；[开发计划](docs/development-plan.md)记录阶段状态、待办与车型调查；`docs/plans/` 按日期记录实际完成的功能、修改与验证结果。文档维护规则也在文档中心。
