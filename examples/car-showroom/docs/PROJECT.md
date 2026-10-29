# CAR ATELIER · 3D 名车互动展厅

一个以车辆为主角的交互式 3D 展厅。通过自由视角、预设机位和外观材质切换，近距离观察概念车型的车身线条、内饰与灯光细节。界面采用精简的统一控制器，兼容桌面和移动端，并提供中文、英文两种语言。

[在线体验](https://duanxirui.github.io/threejs-projects/examples/car-showroom/) · [项目源码](https://github.com/duanxirui/threejs-projects/tree/main/examples/car-showroom)

## 展示车型

| 车型 | 展示内容 |
| --- | --- |
| **Car Concept** | 高精度 GLB 概念跑车，包含车身、内饰、玻璃和 PBR 材质；支持三套原生外观与内饰材质变体 |
| **AURORA S1** | 由 Three.js 几何体生成的工程概念样车，可使用预设车漆颜色 |

Car Concept 提供 **Carmine Candy（糖果胭脂红）**、**Pearly Swirly（珍珠银白）**、**Torched Graphite（石墨深灰）** 三套原生材质变体。AURORA S1 提供烈焰红、曜石黑、极光银、深海蓝等预设车漆。

## 核心功能

- **自由观车：** 鼠标拖动或触摸旋转车辆，滚轮或双指捏合调整距离。
- **镜头预设：** 默认、车头、侧面、车尾视角，一键恢复默认机位。
- **车型与外观：** 切换两款车型，并根据所选车型显示可用的材质变体或车漆。
- **统一控制器：** “车辆信息”“视角与车漆”“车型列表”三个面板按需展开，同一时间仅展开一个。
- **沉浸式展示：** 纯净观车模式、全屏展示、展台灯光与实时模型加载进度；加载失败时提供反馈和重试入口。
- **中英文界面：** 中文与 English 切换，语言选择会保存在浏览器本地。
- **响应式布局：** 桌面控制器位于右下方，手机和窄屏采用收缩布局，优先保留车辆展示空间。

在展厅右下方打开对应控制面板操作；点击车辆展示区或按 `Esc` 可收起面板。

## 技术实现

- **技术栈：** Three.js、TypeScript、Vite、WebGL2。
- **模型加载：** `GLTFLoader` 搭配 `MeshoptDecoder` 读取压缩 GLB，保留原生材质变体。
- **画面表现：** PBR 材质、环境光照、轨道相机与响应式 Canvas。
- **资源管理：** 模型二进制数据采用有容量上限的缓存；车型切换时释放不再使用的几何体、材质与纹理；车辆静止时减少不必要的绘制。

## 独立运行

建议使用 Node.js 22.12 或更新版本。在本案例目录执行：

```bash
npm ci
npm run dev
```

构建生产页面：

```bash
npm run build
npm run preview
```

构建文件位于 `dist/`，包含运行所需的静态资源和车型模型。本项目可以作为独立文件夹安装、运行和部署；更多细节见 [README](../README.md)。

## 模型来源与授权

**Car Concept** 模型与贴图来自 [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)，作者署名为 **Eric Chadwick / Darmstadt Graphics Group GmbH**，依据 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。项目对模型进行 Meshopt 压缩，并处理了已识别的 Khronos 商标显示内容；素材的原始出处、许可与修改说明见 [开发方案的资源记录](development-scheme.md#7-已用模型及授权证据)。

**AURORA S1** 是项目代码生成的原创概念车。展厅中的概念车型不代表保时捷、法拉利或其他汽车制造商的官方授权或合作。
