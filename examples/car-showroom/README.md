# CAR ATELIER · 3D 名车互动展厅

基于 **Three.js、TypeScript 和 Vite** 的交互式 3D 汽车展厅。以车辆为画面中心，支持自由观车、车型切换、视角预设、车漆与材质调整，以及中英文界面。每个案例均可在 Three.js 项目合集中展示，也可单独安装和运行。

[在线体验](https://duanxirui.github.io/threejs-projects/examples/car-showroom/) · [案例源码](https://github.com/duanxirui/threejs-projects/tree/main/examples/car-showroom) · [项目合集](https://github.com/duanxirui/threejs-projects)

## 功能特色

- **自由观车**：鼠标拖动或触摸旋转车辆，滚轮或双指捏合缩放。
- **视角切换**：提供默认、车头、侧面、车尾机位和视角重置。
- **车型与外观**：切换展车，选择对应的车漆颜色或原生材质变体。
- **统一控制器**：通过“车辆信息 / 视角与车漆 / 车型列表”三个入口展开面板，同一时间只展示一个。
- **沉浸体验**：纯净观车模式、全屏展示、加载进度及失败重试提示。
- **中英文切换**：中文 / English 界面，语言偏好保存在当前浏览器。
- **响应式布局**：桌面控制器位于右下方，手机与横屏布局尽量保留完整车辆展示区域。

## 展示车型

| 车型 | 展示特点 | 外观选项 |
| --- | --- | --- |
| **Car Concept** | 高精度 GLB 概念跑车，包含车身、内饰、玻璃和 PBR 材质 | Carmine Candy（糖果胭脂红）、Pearly Swirly（珍珠银白）、Torched Graphite（石墨深灰）三套原生材质变体 |
| **AURORA S1** | Three.js 程序化生成的原创工程概念车 | 烈焰红、曜石黑、极光银、深海蓝等预设车漆 |

Car Concept 使用 Meshopt 压缩，模型文件约 **9 MB**。本案例展示的是概念车型，不代表任何汽车品牌的官方授权。

## 操作指南

| 操作 | 效果 |
| --- | --- |
| 鼠标拖动 / 手指滑动 | 环绕观察车辆 |
| 滚轮 / 双指捏合 | 调整镜头距离 |
| 选择“视角与车漆” | 切换默认、车头、侧面、车尾视角及外观 |
| 选择“车型列表” | 在 Car Concept 和 AURORA S1 之间切换 |
| 点击展车区域、按 `Esc` 或使用关闭按钮 | 收起展开的控制面板 |
| 顶部“中 / EN” | 切换界面语言 |
| 纯净观车 / 全屏按钮 | 减少界面干扰或全屏浏览 |

## 技术实现

- **Three.js / WebGL2**：实时三维渲染、环境光照、PBR 材质与轨道相机。
- **TypeScript + Vite**：前端开发、类型检查与静态构建。
- **GLTFLoader + MeshoptDecoder**：加载压缩的 Car Concept GLB 和原生材质变体。
- **资源管理**：对模型二进制数据进行有容量上限的缓存，切换车型时回收不再使用的几何体、材质及纹理；车辆静止时减少不必要的绘制。

## 快速开始

建议使用 **Node.js 22.12+**。将 `car-showroom/` 整个目录单独复制到任意位置，在案例目录内运行：

```bash
npm ci
npm run dev
```

访问终端显示的本地地址。检查类型与构建生产版本：

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，包含页面、静态资源和展车模型，可独立部署到静态托管服务。安装依赖需要能够访问 npm 包源。

## 项目结构

```text
car-showroom/
├── src/
│   ├── core/              # 车辆加载、相机、灯光、材质与渲染
│   ├── data/cars.ts       # 车型及外观配置
│   ├── ui/                # 展厅控制界面
│   ├── styles/main.css    # 页面样式
│   └── main.ts            # 应用入口
├── public/
│   ├── models/            # Car Concept GLB 模型
│   └── preview.svg        # 案例封面
├── docs/                  # 开发方案、计划与历史记录
├── example.json           # 合集首页的案例元数据
├── package.json           # 独立依赖和命令
└── vite.config.ts         # Vite 构建与基础路径
```

## 在项目合集中运行与部署

在 [Three.js 项目合集](https://github.com/duanxirui/threejs-projects) 根目录执行：

```bash
npm run gallery:dev
```

首页会列出所有公开案例，点击 **CAR ATELIER · 3D 名车展厅** 的“进入场景”即可预览。

合集生产构建与校验：

```bash
npm run site:build
npm run site:verify
```

合集自动将本案例部署到 [car-showroom 在线页面](https://duanxirui.github.io/threejs-projects/examples/car-showroom/)。独立构建默认使用相对资源路径 `./`；合集构建时通过 `VITE_BASE_PATH` 配置对应的 `/threejs-projects/examples/car-showroom/` 路径。

## 开发文档

- [文档中心](docs/README.md)：开发资料入口。
- [开发方案与模型记录](docs/development-scheme.md)：设计、资源处理和详细素材信息。
- [开发计划](docs/development-plan.md)：功能状态与后续工作。
- [开发日志](docs/plans/2026-10-29.md)：近期实施与验收记录。

## 素材来源与授权

**Car Concept** 模型和贴图来自 [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)，作者为 **Eric Chadwick / Darmstadt Graphics Group GmbH**，按照 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可使用。项目进行了 Meshopt 压缩，并处理了已识别的 Khronos 商标显示内容。素材出处、许可与修改细节见[模型授权说明](docs/development-scheme.md#7-已用模型及授权证据)。

**AURORA S1** 为项目代码生成的原创概念车。展厅不代表保时捷、法拉利或其他汽车制造商的官方合作或授权。
