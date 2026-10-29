# Three.js 基础案例模板

[**项目介绍文档**](docs/PROJECT.md)：创建独立案例后，请按照已实现内容完善功能、交互、技术及素材说明。

本目录是一个**可以独立运行、构建和部署**的 Three.js 项目，包含交互式 3D 场景、OrbitControls、响应式布局与独立的 Vite 配置。整个文件夹复制到仓库外也可以使用。

## 环境

- Node.js >= 22.12.0
- npm 10 或兼容版本

## 安装与运行

在本目录执行：

```bash
npm install
npm run dev
```

访问终端给出的本地地址（默认 `http://127.0.0.1:5173/`）。鼠标拖动旋转视角，滚轮缩放，使用按钮暂停动画或重置视角。

## 独立构建

```bash
npm run build
npm run preview
```

`dist/` 是可独立部署的静态站点，默认 `base: './'`，能适配多级静态路径。

统一 GitHub Pages 构建时可选用环境变量覆盖根路径，例如 Bash：

```bash
VITE_BASE_PATH=/threejs-projects/examples/threejs-basic/ npm run build
```

如在 PowerShell 中，先执行 `$env:VITE_BASE_PATH='/threejs-projects/examples/threejs-basic/'` 再执行 `npm run build`；无需覆盖时删除该环境变量。实际案例名称更改后应同步更新对应 URL。

## 项目文件

| 文件 | 作用 |
| --- | --- |
| `src/main.js` | Three.js 场景、相机、光照、动画及交互 |
| `src/style.css` | 独立页面样式 |
| `public/models/` | 本案例的 3D 模型 |
| `public/textures/` | 本案例的纹理资源 |
| `public/preview.svg` | 案例列表封面 |
| `example.json` | 集合首页读取的案例元数据 |
| `vite.config.js` | 独立打包和路径设置 |
| `.gitignore` | 单独使用此文件夹时忽略依赖、构建产物和本地配置 |

本模板使用 npm 注册表上的公开 `three` 与 `vite` 依赖，无根目录代码依赖或后端服务。初始几何体通过代码生成，其他模型和纹理可按项目需要补充到 `public/`。

如果是在案例集合仓库中通过 `npm run example:create` 创建案例，将自动生成独立副本。请按需求修改案例名称、描述、资源与交互。只有案例可公开展示时才将 `example.json` 的 `visible` 设为 `true`。
