# 开发计划｜Three.js 3D 名车互动展厅

> 最近整理：2026-10-29
> 本文是唯一任务台账，维护**阶段目标、固定任务编号、状态、待办、依赖与候选模型核查**。设计与已用资源见[开发方案](development-scheme.md)；任务的完成内容、修改文件和实际验证只记录在[对应日期的开发日志](README.md#开发日志)。

## 1. 当前基线

以下状态根据截至 2026-10-20 的项目记录整理，**不是新一轮实机验收结论**：

- 工程已采用 Vite、TypeScript 和 Three.js，可进行 TypeScript 检查与 Vite 生产构建。
- 展厅有一辆开放许可的高精度 **Car Concept GLB** 和一辆程序化 **AURORA S1**；Car Concept 使用 Meshopt 压缩，包含 3 套原生外观变体。
- 已具备镜头旋转/缩放、预设视角、车型切换、统一三选项控制器、中英文和全屏/纯净观车等基础交互。
- 车型下载使用有界二进制缓存，模型卸载时回收材质、纹理和图片资源，静止时减少绘制。
- 现有品牌名车模型仍未完成权利核查和正式接入。此前的 Chrome 视口模拟不代表真实 Android/iOS 设备的触摸、帧率、内存或安全区验收。

## 2. 阶段路线图

状态约定：**已完成**＝有实现及相应证据；**部分完成**＝阶段有交付但验收未闭环；**待开始**＝尚无交付；**依赖待解决**＝需要先取得模型、授权或其他条件。

| 阶段 | 交付目标 | 状态 | 关联任务与剩余条件 |
| --- | --- | --- | --- |
| 01. 工程基础 | Vite/TS/Three.js、展台、灯光、轨道相机、构建入口 | 已完成 | `CAR-001`；见[10-19 日志](plans/2026-10-19.md) |
| 02. 高精度样板 | 开放许可 GLB、材质、可追溯模型处理 | 已完成（演示样板） | `CAR-003`、`CAR-004`；见[10-20 日志](plans/2026-10-20.md) |
| 03. 展厅交互 | 视角、外观切换、双语、统一控制器和响应式 | 部分完成 | `CAR-002`、`CAR-006` 已实现；`CAR-008` 实机验收待完成 |
| 04. 正式品牌车型 | 核查权利并接入目标品牌车型 | 依赖待解决 | `CAR-009`；候选在[第 5 节](#5-车型候选与授权调查) |
| 05. 性能与稳定性 | 纹理、体积、缓存、加载与设备表现 | 部分完成 | `CAR-005` 已实现；`CAR-010`、`CAR-011`、`CAR-013` 待完成 |
| 06. 上线与交付 | 依赖可复现、Git 基线、部署与兼容性复核 | 部分完成 | `CAR-012` 已完成公开仓库与 Pages 部署；`CAR-008` 实机兼容性验收仍待完成 |
| 07. 集合迁移 | 迁入 Three.js 案例集合，保持独立运行和素材授权记录 | 已完成本地实现与验收 | `CAR-015`，见[10-29 日志](plans/2026-10-29.md)；线上页面发布单独验证 |

## 3. 任务台账（唯一编号）

编号采用 `CAR-001`、`CAR-002` 顺序递增，**一经分配不得重用或重编号**。同一功能跨多日继续使用原编号；新增需求使用下一个编号。一个日志可以对应多个任务，一个任务也可以关联多个日期。

### 已实现的历史任务

| 编号 | 完成功能 | 状态 | 实际记录 |
| --- | --- | --- | --- |
| `CAR-001` | Vite/TS/Three.js 工程、场景、展台、轨道相机、程序化样车 | 已完成 | [2026-10-19](plans/2026-10-19.md) |
| `CAR-002` | 基础车型交互、SVG 图标、中英文、视角与首版折叠界面 | 已完成（后续布局升级） | [2026-10-19](plans/2026-10-19.md) |
| `CAR-003` | 高精度 Car Concept GLB 接入、已知标识清理与署名 | 已完成（技术样板） | [2026-10-20](plans/2026-10-20.md) |
| `CAR-004` | 三套原生材质变体、Meshopt 无损压缩及资源校验 | 已完成 | [2026-10-20](plans/2026-10-20.md) |
| `CAR-005` | GLB 二进制缓存、材质释放与按需渲染 | 已实现（专项性能数据待测） | [2026-10-20](plans/2026-10-20.md) |
| `CAR-006` | 三选项统一展厅控制器和 PC/手机/横屏布局 | 已实现（浏览器视口已验） | [2026-10-20](plans/2026-10-20.md) |
| `CAR-007` | 方案/计划/日志归档及任务编号、追溯规则 | 已完成 | [2026-10-21](plans/2026-10-21.md) |
| `CAR-012` | 可复现依赖、首次 Git 基线及公开 GitHub Pages 预览 | 已完成（线上可访问） | [2026-10-21](plans/2026-10-21.md)；[Pages 部署记录](https://github.com/duanxirui/car-atelier/actions/runs/39547914735) |
| `CAR-015` | 迁入 Three.js 案例集合 car-showroom、独立构建和多案例预览 | 已完成本地实现与验收 | [2026-10-29](plans/2026-10-29.md) |

### 后续任务

| 编号 | 优先级 | 任务与状态 | 下一步与完成判定 |
| --- | --- | --- | --- |
| `CAR-008` | P0 | 手机与横屏实机验收 · 待开始 | Android/iOS 设备实测手势、换色、切车、滚动、安全区；记录型号、浏览器和结果 |
| `CAR-009` | P0 | 品牌车型素材权利核查 · 依赖待解决 | 核查[候选清单](#5-车型候选与授权调查)中原作者许可、品牌标识及分发条件；留证后才可接入 |
| `CAR-010` | P1 | 首屏/重复加载、帧率和内存测量 · 待开始 | 记录测试设备、场景、耗时、GPU/CPU 内存、持续切车结果 |
| `CAR-011` | P1 | KTX2/Basis 纹理压缩与分辨率档位 · 待开始 | 比较体积、PBR/变体观感与兼容性，记录取舍及验证 |
| `CAR-013` | P1 | JS 分包、首屏资源与缓存策略优化 · 部分完成 | 记录调整前后包体积、真实加载时长及收益 |
| `CAR-014` | P2 | 热点、开门、车灯、内饰及音效等高级互动 · 待开始 | 根据已取得的模型部件和使用许可，逐项实现与验收 |

**Git 基线（2026-10-21）：** 首次本地提交 `5f5e3bbeab8c43dfef498ce86028eb6a48eeab57` 汇总了此前项目的代码、模型和文档；最初创建于 `master`，为 GitHub 公开预览已将本地分支改为 `main`。该提交不代表 2026-10-19、2026-10-20 各任务在当天已有独立 Git 提交；历史日志保留当时事实，后续新工作按任务编号关联实际提交。

## 4. 阶段验收与决策规则

- **方案变更**：修改[开发方案](development-scheme.md)，在当日记录说明变更原因与影响。
- **任务计划变更**：只改本文件的范围、优先级、状态和验收条件；不可将计划写成已完成。
- **实际交付**：按日期记入 `plans/`，包括功能、修改文件、检查命令/范围、结果及未覆盖的边界。
- **追溯链路**：任务编号（本文件）→ [日期日志](README.md#开发日志)中的同编号条目与相关文件 → 实际 Git commit SHA（有提交后填入）；每个环节保留一致的任务编号。
- **Git 提交**：提交时建议使用 `feat(CAR-006): ...`、`fix(CAR-005): ...` 或 `docs(CAR-007): ...`，一项逻辑变更对应一个主任务编号。记录真实完整 SHA 或短 SHA，未提交时明确写“未提交”；不得用暂定 SHA 代替提交。
- **工作顺序**：开始任务先查本文件已有编号；新增任务分配下一个编号。完成修改后更新当天日志的“任务编号、文件、验证、Git 状态”，再修改本文件状态与完成日期。Git 提交实际创建后回填日志中的 SHA；未获授权或尚未执行提交时保持“未提交”。
- **阶段完成**：需要满足对应完成判定及明确证据；未经过的实机验收仍记为未完成。

## 5. 车型候选与授权调查

本节合并原 `licensed-brand-car-models.md`（2026-10-19 调研）。以下是 **Sketchfab 页面当时标注可下载、CC BY 的候选模型**；这些页面标记不能证明上传者拥有所有权利，也不代表车企授权。本项目截至该次调查 **0 款品牌车型获核实授权、0 款下载检查、0 款获准商用发布**。正式采用前必须重新检查页面及使用条件。

| 优先级 | 品牌车型与来源 | 发布者 | 页面所示约三角面数 | 重点核查 |
| --- | --- | --- | --- | --- |
| P0 | [Porsche 911 GT3 RS](https://sketchfab.com/3d-models/porsche-911-gt3-rs-73a595bff7d5498fa1891c4a78787d26) | musiss | 36.9 万 | 外观/内饰来源、商标与材质 |
| P0 | [Ferrari F40](https://sketchfab.com/3d-models/ferrari-f40-52a66c41cfcd4f999fb1b1c49bf24d70) | Black Snow | 24.6 万 | 原创权属资料 |
| P0 | [Lamborghini Aventador LP 700-4](https://sketchfab.com/3d-models/free-lamborghini-aventador-lp-700-4-df69d51ba10146f79c8c765810ca2132) | SDC PERFORMANCE | 150 万 | 面数、内饰/引擎、优化成本 |
| P1 | [McLaren P1](https://sketchfab.com/3d-models/mclaren-p1-wwwvecarzcom-adae2edc721e4ce7b31c1d06a581e30a) | vecarz | 20.3 万 | 原始建模来源 |
| P1 | [Bugatti Chiron](https://sketchfab.com/3d-models/free-bugatti-chiron-374890e62c5a44e9a739ca638b6e0a18) | ALIEEEN | 9.75 万 | 过程资料与素材出处 |
| P1 | [BMW M4 F82](https://sketchfab.com/3d-models/bmw-m4-f82-8e87379f40fd40dcac0a751e22c1a188) | Black Snow | 50.7 万 | 移动端性能 |
| P1 | [Nissan GT-R R35](https://sketchfab.com/3d-models/nissan-gtr-r35-51c912a8310c4e00a82ad7673d84228a) | Ciasny | 56.7 万 | 上游版权与纹理 |
| P1 | [Toyota Supra MK4 LowPoly](https://sketchfab.com/3d-models/toyota-supra-mk4-lowpoly-36e53ad2f8f04e819baf5519dcb1bf7a) | Mike Farrant | 2.81 万 | 4K 贴图压缩 |
| P1 | [Audi R8](https://sketchfab.com/3d-models/audi-r8-e17e438f076f4427a58d93aa779edaed) | wallon | 44.7 万 | 建模与贴图证据 |
| P2 | [Mercedes-Benz AMG GT 2015](https://sketchfab.com/3d-models/mercedes-benz-amg-gt-2015-4d9e0a8cf9a844149bf6630da83eb97b) | MMC Works | 66.2 万 | CC BY、页面 NoAI 标记和附加条款 |
| P2 | [Koenigsegg Jesko 2019](https://sketchfab.com/3d-models/2019-koenigsegg-jesko-408bed6ddca14a1a9c9eeaa5437f62f0) | kevin | 24.5 万 | 许可及网格质量 |
| P2 | [Ford GT 2006 Low Poly](https://sketchfab.com/3d-models/ford-gt-2006-low-poly-43b192a06d504c5c9f5a9066304298bd) | Ajay Gawde | 1.28 万 | 轻量展示画质 |

另有一款轻量替代候选：[Lamborghini Aventador / Arion Digital](https://sketchfab.com/3d-models/lamborghini-aventador-888e37a3641d4f7b94bc1a39396e2441)，页面曾标注 CC BY，约 1.03 万面，尚未下载或检查。三角面数为平台当时的展示数据，不能代表 GLB 大小、内存或帧率。

**暂不用于商业版的候选及原因：** [Aventador / Outlaw Games](https://sketchfab.com/3d-models/lamborghini-aventador-e328d9f5dcfd48bdbe8c73324b52ece3)（CC BY-NC）、[McLaren P1 MSO / bohmerang](https://sketchfab.com/3d-models/free-mclaren-p1-mso-c7687064e08c4be9a0af88e98bcf0a8e)（CC BY-NC-SA）、[Toyota Supra MK4 / temich](https://sketchfab.com/3d-models/toyota-supra-mk4-a80-61d402d6de904374bfe5a98907c85b1d)（CC BY-NC，涉及游戏模型来源）、[Bugatti Chiron Super Sport / Ddiaz Design](https://sketchfab.com/3d-models/2021-bugatti-chiron-super-sport-300-95045eaaf0294dae8ae1d04222575a5c)（CC BY-NC-SA，涉及游戏模型来源）、[Aventador SVJ / SDC](https://sketchfab.com/3d-models/aventador-svj-black-ghosttm-412e5ba4c1264a4fab97660ebc0695a4)（CC BY-NC）。许可参考：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)、[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)、[Sketchfab 指引](https://sketchfab.com/developers/download-api/guidelines)与[平台条款](https://sketchfab.com/terms)。

**每款车型上线前：** 保存页面/作者/许可截图与下载时间；检查原创权属、游戏提取素材和车标/外观使用权；记录原始 SHA-256 与优化文件、署名文本和商用限制；实测模型方向、材质、加载与手机帧率；审核通过才从 `research_candidate` 改为可发布。首批核查顺序保持 **Porsche 911 GT3 RS → Ferrari F40 → Lamborghini Aventador**。

具体实际核查结果只记入完成日期的[开发日志](README.md#开发日志)，任务状态在本文件更新。
