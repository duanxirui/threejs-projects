# 像素奇想游乐园 · PIXEL PARK

一座漂浮在云端的微缩 3D 游乐园。五种游乐设施持续运转，游客穿梭在道路与商店之间；可以自由观察、选择设施、控制运行节奏，并体验昼夜变化与复古像素画面。

[在线体验](https://duanxirui.github.io/threejs-projects/examples/miniature-amusement-park/) · [项目源码](https://github.com/duanxirui/threejs-projects/tree/main/examples/miniature-amusement-park)

## 园区场景

| 设施与环境 | 功能与表现 |
| --- | --- |
| 过山车 | 列车沿环岛木质轨道持续行驶 |
| 摩天轮 | 12 个座舱随轮盘旋转并保持直立 |
| 旋转木马 | 木马随转盘旋转并周期性上下起伏 |
| 海盗船 | 船体在支架间往复摆动 |
| 旋转茶杯 | 转盘与茶杯分别转动 |
| 园区环境 | 分层浮空岛、道路、商店、路灯、树木、花朵、云朵及行走的游客 |

点击游乐设施或底部快捷入口，镜头会平滑聚焦；选择“全景”返回整体视角。

## 独立运行

环境：Node.js >= 22.12.0；npm 10 或兼容版本。

把整个 `miniature-amusement-park/` 文件夹复制到任意位置，然后在该文件夹中执行：

```bash
npm install
npm run dev
```

打开终端提示的地址，通常为 http://127.0.0.1:5173/ 。

## 独立构建

```bash
npm run build
npm run preview
```

`dist/` 可直接放到静态托管平台。默认使用相对路径 `base: './'`，适配任意站点子目录。集合仓库的统一构建器会使用 `VITE_BASE_PATH=/threejs-projects/examples/miniature-amusement-park/` 生成 GitHub Pages 专用路径。

## 互动玩法

| 操作 | 功能 |
| --- | --- |
| 拖动鼠标或单指滑动 | 环绕观察浮空岛 |
| 滚轮或双指捏合 | 缩放 |
| 点击设施或底部快捷按钮 | 平滑聚焦对应设施 |
| 空格 | 暂停或继续动画 |
| N | 切换白天与夜晚 |
| R | 恢复全景 |
| H | 展开或收起控制台 |

控制台可调整动画速度（0.25×～2.5×）、游客数量（8～64）、像素渲染精度（25%～100%）、有序抖动和有限色板。移动端默认收起控制台，避免遮挡游乐园。尊重系统的减少动态效果偏好，初始状态会暂停动画。

## 技术说明

- **Three.js / WebGL / OrbitControls**：实现场景绘制、相机环绕与交互。
- **程序化场景**：园区几何体、设施动画和昼夜灯光全部在本地生成，不依赖远程模型或纹理。
- **实例化游客**：使用 `InstancedMesh` 减少重复几何体绘制。
- **像素后处理**：低分辨率 `WebGLRenderTarget`、最近邻放大、颜色量化和 4×4 Bayer 有序抖动。
- **响应式体验**：移动端可收起面板，页面展示实时帧率。

## 主要文件

- `src/world.js`：程序化模型、游乐设施动画、昼夜灯光、游客 InstancedMesh、设施聚焦点。
- `src/main.js`：Three.js 场景、相机、OrbitControls、WebGL 渲染、RenderTarget 像素化与 Bayer 抖动、交互状态。
- `src/style.css`：独立页面和响应式控制台。
- `public/preview.svg`：原创矢量封面。
- `example.json`：集合首页自动索引元数据。
- `vite.config.js`：独立构建与 Pages 子路径配置。

此案例使用 `three` 和 `vite` 的 npm 依赖，不引用仓库其他案例、共享包或外部运行时资源。程序化几何体与封面均在本案例中原创实现。

## 参考与授权

美术方向与功能灵感参考 [cfenghub 的 X 帖子](https://x.com/cfenghub/status/2115336591245987956)，主题为微缩体素游乐园、持续动画、像素后处理和昼夜照明。未复制原帖的视频或图片作为正式项目资产。
