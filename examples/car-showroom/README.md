# CAR ATELIER — Three.js 3D 名车互动展厅

一个以 3D 车辆为视觉中心的互动展厅。可以自由旋转、缩放和切换镜头，探索高精度概念车的外观、内饰与车漆材质，也可以切换到程序化工程样车。页面提供中文和英文界面，适配桌面与移动浏览器。

[在线体验](https://duanxirui.github.io/threejs-projects/examples/car-showroom/) · [项目源码](https://github.com/duanxirui/threejs-projects/tree/main/examples/car-showroom)

## 展示车型

| 车型 | 展示内容与配色 |
| --- | --- |
| **Car Concept** | 高精度 GLB 概念跑车，包含车身、内饰、玻璃及 PBR 材质；支持原生 **Carmine Candy（糖果胭脂红）**、**Pearly Swirly（珍珠银白）**、**Torched Graphite（石墨深灰）** 三套外观与内饰材质变体 |
| **AURORA S1** | 由 Three.js 几何体生成的原创工程概念车，提供烈焰红、曜石黑、极光银、深海蓝等预设车漆 |

Car Concept 使用 Meshopt 无损压缩，GLB 体积由约 11.77 MB 缩减至约 **9.00 MB**。

## 核心功能与操作

- **自由观车**：通过鼠标拖动或单指滑动旋转视角，滚轮或双指捏合进行缩放。
- **镜头预设**：可切换默认、车头、侧面和车尾视角，并一键恢复默认机位。
- **车型与车漆**：切换两辆展车，并根据车型选择原生材质变体或预设颜色。
- **统一控制器**：右下方集中提供“车辆信息 / 视角与车漆 / 车型列表”三个面板；选择一项展开，其余自动收起。点击场景或按 `Esc` 可关闭面板。
- **沉浸式体验**：支持纯净观车和全屏，提供车型加载进度、加载失败反馈与重试。
- **中英文切换**：在顶部切换“中 / EN”，并在浏览器本地保存语言选择。
- **响应式布局**：桌面控制器位于右下方，手机端收缩至底部，横屏时控制展开区域高度，尽量保留车辆的展示空间。

## 技术实现

- **Three.js + TypeScript + Vite + WebGL2**，使用轨道相机、环境光照与 PBR 材质呈现车辆。
- **GLTFLoader + MeshoptDecoder** 加载压缩的 Car Concept GLB，保留原生材质变体。
- **资源管理**：模型二进制数据使用有容量上限的内存缓存；切换车型时回收不再使用的几何体、材质与纹理，静止时减少绘制提交。

## 模型来源与授权

**Car Concept** 模型及贴图来自 [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)，作者为 **Eric Chadwick / Darmstadt Graphics Group GmbH**，依据 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可使用。本项目对模型进行了 Meshopt 压缩，并处理了已识别的 Khronos 商标显示内容；详细出处、原始哈希与修改说明见 [素材授权记录](docs/development-scheme.md#7-已用模型及授权证据)。

**AURORA S1** 是项目代码生成的原创概念车。展厅展示不代表保时捷、法拉利或其他汽车制造商的官方授权与合作。

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

## 文档

本 README 为案例的完整项目介绍。开发设计、规划和历史记录统一收录在[文档中心](docs/README.md)：[开发方案](docs/development-scheme.md)、[开发计划](docs/development-plan.md)、[日期日志](docs/plans/2026-10-29.md)。项目原独立仓库为 [duanxirui/car-atelier](https://github.com/duanxirui/car-atelier)，迁移历史保留在开发日志中。
