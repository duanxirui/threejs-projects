# 案例展示首页使用说明

> 阶段：T03，2026-10-29

## 已实现功能

首页位于 `apps/gallery/`，使用 Vue 3 + Vite，包含中文深色科技风格、响应式布局、案例封面卡片、分类筛选、关键词搜索、统计、无案例引导和项目架构说明。

首页自动读取 `examples/<slug>/example.json` 生成案例索引。正式案例只需维护自身的元数据与封面，无须在 Vue 组件中手动登记。`templates/threejs-basic/` 不计入正式案例。

## 本地命令

在仓库根目录执行：

```bash
npm install
npm run gallery:generate  # 单独重新生成索引和封面
npm run gallery:dev       # 启动展示首页，默认 http://127.0.0.1:5173/
npm run gallery:build     # 编译到 apps/gallery/dist/
npm run gallery:preview   # 预览上次编译结果
```

`gallery:dev`、`gallery:build` 均会先自动生成索引；开发服务器也会监听案例元数据、封面的变化并尝试重新生成索引。构建前必须在根目录安装依赖。

### 本地直接进入案例

从仓库根目录执行 `npm run gallery:dev` 后，程序会同时启动展示首页和所有 `visible: true` 案例自己的 Vite 开发服务。首页默认使用 `http://127.0.0.1:5173/`，端口占用时自动顺延；每个案例自动分配一个空闲的本地端口。终端会列出实际地址。

打开首页后，找到案例卡片，直接点击 **“进入场景”**，就能运行对应的本地 Three.js 案例。案例的源码和资源改动仍由其独立的 Vite 服务热更新。**无需先执行 `site:build`。**

修改现有案例的介绍或封面时，首页索引会自动更新；如果新建案例，或把隐藏案例改成 `visible: true`，需要重新启动 `gallery:dev`，以便为新增案例启动独立服务。

## 数据筛选规则

1. 扫描 `examples/` 内的一级子目录，并读取各案例的 `example.json`。
2. `visible: false` 的开发中案例不进入索引，也不会因为尚未补齐资源而阻断首页；公开案例必须通过 T02 的 `validateExample` 规范校验，否则生成失败并显示明确错误。元数据无法解析或 `visible` 类型错误时也会报错。
3. 生成 `apps/gallery/src/data/examples.generated.json`，并把公开案例的封面复制到 `apps/gallery/.generated/public/covers/<slug>/`。
4. 索引与封面目录均为生成文件，已加入 `.gitignore`；不需要手动维护或提交。
5. 分类列表根据真实元数据自动生成；搜索同时匹配标题、简介、分类、目录名和标签，不区分大小写。无匹配结果显示清除筛选操作。

**当前现状（T07）**：已有 `miniature-amusement-park` 与 `car-showroom` 两个公开案例。执行 `gallery:dev` 可从首页分别进入独立 Vite 服务；执行 `site:build` 会装配两个案例和各自封面。此前 T03 的零案例检查记录属于当时的真实状态。

## 在线预览与源码链接

首页预览地址根据 Vite `base` 与 `examples/<slug>/` 相对路径组合。发布到项目仓库的 GitHub Pages 时，可在构建阶段设置：

```bash
VITE_BASE_PATH=/threejs-projects/ npm run gallery:build
```

在 Windows PowerShell 中，应先设置 `$env:VITE_BASE_PATH='/threejs-projects/'` 再执行构建命令。普通本地构建默认 `base: './'`，可以在不同静态子路径下部署。

`gallery:dev` 使用本地案例服务地址，直接提供“进入场景”链接。单独执行 `gallery:build` 时，未经过统一装配的案例仍标记为“等待案例服务”，避免生成无法访问的链接。正式站点使用 `npm run site:build`，它会将案例与首页装配到 `site-dist/`，并自动设置 `GALLERY_BUILDABLE_SLUGS`（逗号分隔的成功案例目录名），使构建成功的案例使用 Pages 子路径链接。

例如只有 `orbit-lab` 构建成功时：

```bash
GALLERY_BUILDABLE_SLUGS=orbit-lab npm run gallery:build
```

如构建成功列表为空，显式设置空字符串将生成零个可公开链接的案例。实际环境变量已由 T04 统一构建脚本注入。完整构建和输出路径说明见 [BUILD.md](BUILD.md)。

远程仓库已设置为 `https://github.com/duanxirui/threejs-projects`。自动部署工作流会在构建时配置 `VITE_REPOSITORY_URL`，以便为正式案例显示“查看源码”链接。

T05 自动部署工作流已经成功运行，会根据仓库设置 `VITE_REPOSITORY_URL` 和 `SITE_BASE_PATH`，并验证 `site-dist/`。线上地址为 https://duanxirui.github.io/threejs-projects/ ，详见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 生成器验证与限制

T03 已完成首页 Vite 构建、开发服务器启动和索引隔离检查。隔离检查覆盖公开状态筛选、封面复制、构建结果过滤和过期封面清理。随后在获得本机网络访问许可的环境中，从同一进程启动临时 Vite 服务并请求首页，获得 HTTP 200，页面标题检查通过。

受本地浏览器跨沙箱网络访问限制，内置浏览器打开 `http://127.0.0.1:5197/` 返回超时。HTTP 200 只能证明服务器返回了首页，尚未取得真实页面截图、浏览器搜索交互和移动端渲染的通过证据，需在能够访问本机开发端口的浏览器环境中补验。
