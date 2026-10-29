# 开发方案｜Three.js 3D 名车互动展厅

> 初始方案：2026-10-19；文档职责调整：2026-10-21；集合迁移：2026-10-29
> 本文记录**开发方案、技术设计、当前实现索引及已使用素材的来源证据**。阶段进度与待办见[开发计划](development-plan.md)，实际改动与验证按日期见[开发日志](README.md#开发日志)。

迁移到 `threejs-projects/examples/car-showroom/` 后，案例继续使用自身的 Vite、TypeScript、Three.js 和公共资源。独立构建采用相对 `base: './'`；集合发布通过 `VITE_BASE_PATH=/threejs-projects/examples/car-showroom/` 指定路径。原仓库 `duanxirui/car-atelier` 的历史提交和素材许可保持独立可追溯。

## 1. 项目目标与范围

建设一个可以在桌面和移动浏览器访问的 **3D 汽车互动展厅**：在具有真实材质和光照的场景中展示车辆，支持旋转、缩放、视角切换、车型信息和可用的车漆/内饰外观方案。

首版着重于 **清晰的展示效果、可用的交互、稳定加载和可追溯的素材来源**。开门动画、声浪、座舱漫游、复杂配置器等属于后续扩展，不包括驾驶模拟或真实车辆物理系统。

### 目标体验

1. 打开页面即可看到展台与当前车辆；模型加载、失败和重试状态清楚可见。
2. 鼠标拖动或手机触摸旋转，滚轮/双指缩放，可一键恢复默认视角。
3. 通过车型列表切换车辆，更新名称、简介和镜头取景。
4. 提供默认、车头、侧面和车尾等预设视角；座舱视角依模型可用性扩展。
5. 在支持的车型上切换车漆及内饰材质，保留真实 PBR 效果。
6. 页面与主要交互兼容 PC、手机竖屏和小屏横屏，并支持中英文。

### 车型与素材原则

Porsche 911 GT3 RS、Ferrari F40、Lamborghini Aventador 是最初的车型内容候选，**不代表已取得模型使用权或车企授权**。缺少可确认许可时，可使用自制或开放许可概念车验证技术方案；只有权利、署名及标识展示条件符合要求的素材才能正式接入。

每份外部模型应记录作者、来源、许可、商标处理和修改记录。已使用模型的来源、哈希及处理方法见[本文第 7 节](#7-已用模型及授权证据)；品牌候选与核查状态集中在[开发计划](development-plan.md#5-车型候选与授权调查)。

## 2. 视觉与交互方案

**视觉方向：** 暗色展厅、柔和反射地台、低干扰排版、重点突出车漆与玻璃材质，控制装饰和实时阴影的性能开销。

**界面布局：** 车辆占据主画布。顶部保留品牌、中文/English、纯净观车与全屏；一个统一控制器集中管理“车辆信息 / 视角与车漆 / 车型列表”，默认仅显示三个选项，用户选择哪项便展开对应内容，同时自动收起其他内容。

- **桌面与平板：** 控制器位于右下角，内容向上展开，让车辆前部尽量保持可见。
- **手机竖屏：** 控制器贴近底部安全区，展开内容限制高度，内部可以滚动。
- **矮屏横屏：** 控制器紧凑靠右，给左侧车辆留出观赏空间。
- **收起与辅助操作：** 再次点击选中项、关闭按钮、点击场景或按 `Esc` 收起面板；纯净观车隐藏控制器，退出时恢复上次状态。
- **可访问性与国际化：** 按钮具备中英文标签、键盘可操作状态、焦点恢复和 `aria-expanded`/`aria-controls`；尊重减少动态效果偏好。

结构示意：

```text
┌──────────────────────────────────────────────────┐
│ LOGO                              中/EN 纯净 全屏 │
│                                                  │
│                可旋转的 3D 展车                  │
│                                                  │
│                        ┌── 当前选中内容 ───────┐ │
│                        └───────────────────────┘ │
│                        [车辆信息][视角/车漆][车型] │
└──────────────────────────────────────────────────┘
```

## 3. 技术方案

| 领域 | 选型与约定 |
| --- | --- |
| 项目构建 | Vite + TypeScript，输出可部署的静态网页 |
| 3D 场景 | Three.js、WebGL、物理材质、sRGB 和合适的色调映射 |
| 轨道相机 | `OrbitControls`，限制角度和缩放范围，预设镜头依据包围盒框选 |
| 模型格式 | 优先 glTF 2.0 / GLB，由 `GLTFLoader` 读取 |
| 压缩 | 按资源采用 Meshopt、Draco、KTX2，并配套对应解码器与兼容性检查 |
| 界面 | 原生 HTML/CSS + TypeScript；如复杂配置器需求成立，再评估更重的框架 |
| 资源制作 | Blender / glTF 工具链，要求清晰的节点、材质映射及来源记录 |

### 3D 场景与资源生命周期

- 统一采用 Y-up 坐标，模型按实际量级调整朝向、比例与地面高度。
- 使用灯光和环境反射体现车漆、玻璃与金属；移动设备按能力限制像素比、阴影和渲染成本。
- 模型加载后计算包围盒，让不同车体长度、宽度与屏幕比例都获得合理取景。
- 快速切车时只接受最新选择；旧几何体、材质、纹理和图片资源及时释放。
- 保留可复现的模型处理过程；车型信息与渲染逻辑分离，实际配置类型以 `src/types/car.ts` 为准。

### 模型接入规范

1. 先核查模型及贴图来源、许可、署名、商标展示和分发范围。
2. 统一坐标与尺寸，确认车轮落地、法线、玻璃和灯光表现。
3. 清理冗余资源，标记可换色材质和需要交互的独立节点。
4. 依实际文件格式选择压缩和解码方式，检查手机与桌面兼容性。
5. 检查加载速度、展示视角、资源释放和必要的版权说明。

**建议预算：** 首屏车辆 GLB 尽量控制在 8–12 MB 左右；移动端优先较低分辨率贴图，桌面端按实际观感使用更高分辨率。具体数值属于优化目标，需通过实测修订。

## 4. 性能、兼容与降级要求

- 目标参考：桌面主流浏览器接近 60 FPS、中端手机约 30 FPS；这是优化方向，不能替代实测结果。
- 资源按需加载，展示下载进度、失败原因和重试入口；必要时提供静态封面兜底。
- 车辆与镜头静止、页面不可见时减少无用渲染，避免重复创建渲染循环。
- 重点覆盖现代 Chrome、Edge、Safari 和 Android/iOS 浏览器；WebGL 不支持时给出清晰提示。
- 所有必要控件应可被触摸和键盘使用，避免控制面板在窄屏或横屏时超出安全区域。

## 5. 目标验收要求

这些是方案层面的**验收条件**，并非已完成清单；实际完成状态以[开发计划](development-plan.md)和当天验证记录为准。

- 开发与生产构建可在约定环境启动；可以发布静态资源。
- 车辆、地台、灯光、贴图显示正确，无明显悬空、反向或穿模。
- 旋转、缩放、重置、预设视角与车型切换可用，异步加载失败有反馈。
- 换色只影响指定车身/内饰材质；切车和退出时资源能正常回收。
- 桌面、手机竖屏与矮屏横屏均可使用，触控不被面板遮挡。
- 记录加载体积、实际设备帧率、内存与关键兼容性结果。
- 模型、纹理及音效等素材均具备可追溯许可与必要署名。

## 6. 当前工程架构索引

本节合并原 `architecture.md` 中的**现有实现说明**，截至 2026-10-20。后续架构变动在这里维护，具体改动和验证仍写入实际日期的日志。

| 路径 | 职责 |
| --- | --- |
| `src/main.ts` | 入口、事件接线、当前车型与加载状态 |
| `src/core/Showroom.ts` | 场景/Renderer 生命周期、切车与按需绘制 |
| `src/core/CarLoader.ts` | GLB 下载、Meshopt 解码、16 MiB 二进制 LRU 缓存及资源释放 |
| `src/core/MaterialVariants.ts` | 原生 `KHR_materials_variants` 材质映射、切换与额外材质管理 |
| `src/core/CameraController.ts` | OrbitControls、默认/车头/侧面/车尾镜头与过渡 |
| `src/core/Lighting.ts`、`ConceptCar.ts` | 灯光/环境/展台与程序化 AURORA S1 样车 |
| `src/data/cars.ts`、`src/types/car.ts` | 车型配置、素材路径、材质与双语数据类型 |
| `src/ui/ShowroomUI.ts`、`src/ui/icons.ts`、`src/i18n.ts` | 统一三选项控制器、SVG 图标、中英语言与交互 |
| `src/styles/main.css`、`vite.config.ts` | 响应式布局与 Three.js 分包 |
| `scripts/prepare-car-concept.mjs`、`scripts/optimize-car-concept.mjs` | 可复现的模型商标清理与 Meshopt 压缩 |

**加载流程：** `main.ts` → `Showroom.loadCar` → `CarLoader` 读取/缓存压缩二进制 → `GLTFLoader.parseAsync` + Meshopt → 生成独立场景及材质变体 → 按包围盒定位与镜头取景。晚到的旧请求不会覆盖最新选择；卸载旧车型时释放几何体、当前和非当前材质、纹理及 `ImageBitmap`。缓存只保留压缩二进制，容量上限 16 MiB；页面退出时清空。相机或内容静止时跳过多余 WebGL 绘制。

**界面状态：** `showroom-console` 集中切换车辆信息、视角与车漆、车型列表，同一时间最多展开一项。桌面右下、手机底部、小屏横屏靠右，内容受 `dvh` 和安全区限制。`Esc`、点击车身、关闭按钮都可收起；语言偏好保存在 `localStorage` 的 `car-atelier-language`，语言切换无需重新加载模型。

**新增正式模型：** 核查许可及品牌展示条件 → 将 GLB 放在 `public/models/` → 在 `src/data/cars.ts` 添加 `CarConfig`（含 `modelUrl`、`modelKind`、可选 `scale`、`rotationY`、`paintMaterialNames`、`attribution`）→ 检查朝向、取景、材质与性能。标准 GLB 与 Meshopt 已支持；采用 Draco 或 KTX2 的新资源需要对应解码器。

**环境：** 推荐 Node.js 20.19+ 或 22.12+，运行 `npm install`、`npm run dev`、`npm run build`；产物位于 `dist/`。2026-10-19 曾因本地网络代理拒绝使依赖安装不完整，该限制和当时的构建验证记录在[当天日志](plans/2026-10-19.md)。

## 7. 已用模型及授权证据

本节合并原 `model-assets.md`，保留实际使用的第三方素材来源、版本校验与修改方式。

| 项目 | Car Concept（默认展车） |
| --- | --- |
| 发布文件 | `public/models/car-concept.glb`，9,002,828 字节 |
| 原始素材 | [Khronos glTF Sample Assets / CarConcept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)，[原始 GLB](https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb) |
| 作者 | Eric Chadwick / Darmstadt Graphics Group GmbH，© 2024 |
| 许可 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；参见[原始授权说明](https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CarConcept/LICENSE.md) |
| 原始文件 SHA-256 | `c272098089d78c5cd9fd9f24ff50ee8acf8d932c55f2d55fc10adb6c8998966b`（11,778,688 字节） |
| 清理商标后 SHA-256 | `1bf17df84aa9eeb8e30139dcd4f58b755c9d1f47a647d2792849d67996c73ad2`（11,770,824 字节） |
| 当前压缩版 SHA-256 | `17dc599d67328dcbffb0259aabe7da8b19682d46ff43cdc6b9aeb92fa2676efb`（9,002,828 字节） |

原许可允许按 CC BY 4.0 使用模型与贴图，但 **Khronos 徽标及商标不属于该许可授予的权利**。针对当时识别出的商标内容，处理脚本禁用了 `License Plate` 和 `InteriorSteeringEmblem` 两处显示网格，将标识贴图替换为中性像素，并在 GLB `asset.extras` 保留原文件哈希和修改说明。此处理不是对所有第三方权利的保证，不得宣传为 Khronos 或汽车品牌官方合作。

资源处理可复现（输入需是已核验的原始版本）：

```bash
node scripts/prepare-car-concept.mjs path/to/CarConcept.glb path/to/car-concept-clean.glb
node scripts/optimize-car-concept.mjs path/to/car-concept-clean.glb public/models/car-concept.glb
```

两个脚本校验各自的输入 SHA-256。Meshopt 无损压缩了 518 个几何缓冲视图（8,670,498 → 5,820,452 字节），逐视图解码与原数据一致，整体文件比清理后缩小 **23.5%**。运行时使用必需的 `EXT_meshopt_compression`，纹理仍为 PNG。三套原生 `KHR_materials_variants` 外观（Carmine Candy、Pearly Swirly、Torched Graphite）可改变约 25 个车身及内饰网格。

另一辆 **AURORA S1** 由 `src/core/ConceptCar.ts` 程序生成，没有外部 GLB。上述 CC BY 授权不代表保时捷、法拉利或其他任何汽车品牌获得了官方许可；品牌车型仍处于[计划中的授权核查](development-plan.md#5-车型候选与授权调查)阶段。

## 8. 方案沿革与入口

2026-10-19 最初制定《Three.js 3D 名车互动展厅实施方案》（原文件名 `threejs-supercar-showroom-plan.md`）；2026-10-20 实现高精度概念车与统一控制器；2026-10-21 将方案、计划、开发日志分开，随后进一步合并重复说明文档。每次真实改动及验证见[日期索引](README.md#开发日志)。后续计划见[开发计划](development-plan.md)。
