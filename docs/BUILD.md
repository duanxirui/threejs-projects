# 统一构建与静态站点装配

> 阶段：T04
> 实现日期：2026-10-29
> T05 已完成 GitHub Actions 首次远程发布，详情见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 1. 一键构建

在项目根目录安装依赖并执行：

```bash
npm install
npm run site:build
```

统一构建入口为 `scripts/build-all.mjs`。默认站点路径是 `/threejs-projects/`，输出目录是项目根目录的 `site-dist/`。生成产物已通过 `.gitignore` 忽略，无需提交。

如仓库或部署目录不同，可以设置 `SITE_BASE_PATH`：

```bash
SITE_BASE_PATH=/my-threejs-lab/ npm run site:build
```

PowerShell：

```powershell
$env:SITE_BASE_PATH = '/my-threejs-lab/'
npm run site:build
Remove-Item Env:SITE_BASE_PATH
```

`SITE_BASE_PATH=./` 适合使用相对资源路径的单独静态站点部署，默认值用于 GitHub Pages 项目仓库。路径仅允许 `./` 或以 `/` 开头和结尾的安全目录路径，避免将资源错误指向站点根目录。

## 2. 构建规则

1. 扫描 `examples/` 的一级案例文件夹。
2. 跳过 `example.json` 中 `visible: false` 的开发中案例。公开案例需通过 T02 的完整静态规范校验；不合法则构建停止。
3. 在每个公开案例自身目录执行 `npm run build`，设置该案例对应的 `VITE_BASE_PATH`。案例仍依赖自身 `package.json`、Vite 配置与资源。
4. 将每个案例 `dist/` 复制到暂存站点的 `examples/<slug>/`。
5. 再构建 Vue 展示首页，传入本轮成功构建的案例列表 `GALLERY_BUILDABLE_SLUGS`，自动生成索引、复制封面、激活在线体验入口。
6. 检查首页与全部案例的 `index.html`、封面、索引状态，检查通过后替换旧站点产物。

任何公开案例构建失败都会导致整轮失败，不会把失败案例的入口发布到站点，也不会替换已有 `site-dist/`。

## 3. 目标输出

```text
site-dist/
├── index.html                # 展示首页
├── assets/                  # 首页 JS / CSS
├── covers/                  # 公开案例封面
│   └── <slug>/
│       └── preview.svg
└── examples/
    └── <slug>/
        ├── index.html        # 独立案例页面
        └── assets/          # 案例自身的 JS / CSS 和 Vite 资源
```

案例目录和封面只有在至少一个案例 `visible: true` 且成功构建后才出现。T07 已加入 TypeScript 案例 `car-showroom`，统一构建当前输出 `miniature-amusement-park` 与 `car-showroom` 两个完整页面及独立资源目录；T04 的零案例验收结果保留为历史记录。

在默认 `/threejs-projects/` 路径下：

- 首页：`https://<username>.github.io/threejs-projects/`
- 案例：`https://<username>.github.io/threejs-projects/examples/<slug>/`

项目首页已发布在 `https://duanxirui.github.io/threejs-projects/`。T04 仅负责生成本地静态产物，T05 负责 GitHub Pages 部署。

## 4. 失败与覆盖保护

统一构建使用三个固定、仅归构建器管理的目录：

- `site-dist.__next/`：本轮暂存的静态站点。
- `site-dist/`：最近一次成功的完整构建。
- `site-dist.__previous/`：替换时临时保留上一版的目录。

只在新站点通过检查后才切换目录。构建失败会清理 `site-dist.__next/`，保留上一次完整产物；遇到遗留的暂存或备份目录时会停止并要求先检查，而不擅自覆盖。脚本还检查这些路径为项目根目录下的普通目录，避免误操作外部路径。

发布时应将 `site-dist/` 整体作为静态站点根目录。不要将仓库源码根目录直接设置为 GitHub Pages 发布路径。

## 5. 实际验收记录（2026-10-29）

| 项目 | 结果 |
| --- | --- |
| `node --check scripts/build-all.mjs` | 通过 |
| 无正式案例时一键构建 | 通过；首页构建成功，案例数 0 |
| 两个临时公开案例统一构建 | 通过；2 个案例 + 首页均成功 |
| HTML 中 Pages 子路径、案例资源文件、封面 | 通过；逐项检查两个案例 |
| 一个案例取消公开后重建 | 通过；旧页面、封面和索引均移除 |
| 模拟案例构建失败 | 通过；返回失败，旧 `site-dist/` 保持完整，暂存目录清理 |
| 临时验收案例清理与最终构建 | 通过；恢复 0 个正式案例的站点产物 |

上述测试证明本地构建、目录装配和路径一致性。T05 已确认 GitHub Pages 首页、JS 和 CSS 返回 HTTP 200；真实浏览器桌面/移动端渲染及交互验收仍待补充。

## 6. 下一阶段

T05 已配置并成功运行 GitHub Actions：使用 `npm ci` 安装根 workspace 依赖，执行案例规范检查、`npm run site:build`、`npm run site:verify`，将 `site-dist/` 作为 Pages Artifact 发布。实际部署结果和仍待完成的案例验收见 [DEPLOYMENT.md](DEPLOYMENT.md)。
