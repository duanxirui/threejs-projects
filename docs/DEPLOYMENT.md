# GitHub Pages 自动部署说明

> 阶段：T05
> 配置日期：2026-10-29
> 状态：GitHub Pages 已成功发布；T06 已加入首个正式案例并通过本地构建，新的线上案例深链接待本次发布后验证。

## 1. 现有实现

工作流：`.github/workflows/deploy.yml`。当代码推送到 `main`，或手动触发 `workflow_dispatch` 时，会自动：

1. 检出仓库，安装 Node.js 22 和 npm workspace 依赖（`npm ci`）。
2. 根据 GitHub 仓库名称计算站点基础路径，并配置“查看源码”的仓库地址。
3. 执行 `npm run example:validate`，检查独立案例规范。
4. 执行 `npm run site:build`，将首页及所有公开案例构建至 `site-dist/`。
5. 执行 `npm run site:verify`，检查首页、案例页面、封面和 HTML 中引用的静态资源。
6. 使用 GitHub 官方的 Pages Artifact 操作上传 `site-dist/`。
7. 在 `github-pages` 环境中部署，并用 HTTP 请求检查发布后的首页是否可访问。

工作流使用 `actions/checkout@v6`、`actions/setup-node@v6`、`actions/configure-pages@v5`、`actions/upload-pages-artifact@v4` 和 `actions/deploy-pages@v4`。构建和部署分别运行，部署任务依赖构建成功。并发部署按顺序排队，不取消正在进行的发布。部署任务授予 `pages: write` 与 `id-token: write`，以满足 GitHub Pages 的认证要求。

## 2. 首次发布前的准备

本地项目已绑定目标仓库 `https://github.com/duanxirui/threejs-projects.git`，`main` 分支已成功推送。下方命令仅供其他新仓库首次配置时参考。

假设目标为 `https://github.com/<owner>/threejs-projects`，在项目根目录运行：

```bash
git remote add origin https://github.com/<owner>/threejs-projects.git
git push -u origin main
```

若已设置 `origin`，先执行 `git remote -v` 核对，不应盲目添加或覆盖。推送前确认本地文件已提交、无密钥和无误加入的构建产物；Git 凭据必须具有目标仓库写入权限。

目标仓库已在 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**，并已成功执行部署。若将来迁移仓库，可按此步骤重新配置。

GitHub Free 的公共仓库通常可使用 Pages；私有仓库能否发布取决于账户与组织权限。实际仓库可见性和所有者应由使用者确认。

## 3. 发布路径

工作流自动根据 `GITHUB_REPOSITORY` 计算 `SITE_BASE_PATH`：

| 仓库名 | 自动基础路径 | 预期网址示例 |
| --- | --- | --- |
| `threejs-projects` | `/threejs-projects/` | `https://<owner>.github.io/threejs-projects/` |
| `<owner>.github.io` | `/` | `https://<owner>.github.io/` |

如使用自定义域名、特殊反向代理或不同仓库发布路径，需要调整 `.github/workflows/deploy.yml` 的基础路径设置。仓库名大小写、实际 Pages URL 和自定义域名，以 GitHub Pages 配置页和部署输出为准。

每个成功构建的公开案例会位于：

`https://<owner>.github.io/threejs-projects/examples/<slug>/`

案例 URL 根据 `example.json.slug` 自动生成，不在首页写死仓库所有者。

## 4. 增加新案例后如何发布

```bash
npm run example:create -- solar-system "太阳系探索"
```

在 `examples/solar-system/` 中完成开发，安装案例依赖，并将 `example.json` 的 `visible` 改为 `true`。创建新案例或增改依赖后，在**根目录**再执行：

```bash
npm install
npm run example:validate
npm run site:build
npm run site:verify
```

根目录的 `package-lock.json` 包含 npm workspaces 清单；必须和新案例的 `package.json` 一起提交，否则 GitHub Actions 的 `npm ci` 可能因锁文件不一致而失败。每个案例自己的 `package-lock.json` 也应保留，以保证用户只下载该案例时可以独立安装。

将变更提交并推送到 `main` 后，工作流自动重新发布。`visible: false` 的案例不会包含在最终站点中；一个公开案例构建失败则停止整个发布流程，避免产生不可打开的案例链接。

## 5. 发布后验收

GitHub Actions 的 Build 和 Publish 两个任务均应成功，并在部署任务中显示实际 Pages URL。检查：

1. 首页直接访问应返回 HTTP 200，可显示正确的案例数量及引导状态。
2. 案例卡片的分类、搜索、封面、在线体验和源码链接正常。
3. 在浏览器地址栏直接打开每个案例深链接，JS、CSS、模型、纹理不得出现 404。
4. 桌面与移动端页面布局、Three.js WebGL 渲染和交互符合预期。
5. 新增或取消公开案例再次推送后，线上页面与索引正确变化。

工作流的 HTTP 检查只验证首页可达。案例浏览器行为和移动端布局仍须在真实网站手动或通过浏览器自动化补充验收。

## 6. 常见问题

- **Pages 未启用**：检查仓库 Settings → Pages，Source 是否为 GitHub Actions。
- **`npm ci` 报锁文件不一致**：在根目录执行 `npm install` 并提交更新后的 `package-lock.json`。
- **静态资源 404**：核对仓库实际名称与 `SITE_BASE_PATH`，不要使用不匹配的项目子路径。
- **没有显示案例**：检查 `examples/` 是否存在正式案例，及其 `example.json.visible` 是否为 `true`。
- **部署任务缺少权限**：检查工作流和仓库/组织策略是否允许 `pages: write` 与 `id-token: write`。
- **发布后首页暂时不可访问**：查看 `deploy` 任务输出和 Pages 配置。工作流会进行多次 HTTP 重试，但网络传播或仓库设置仍可能使其失败。

## 7. 本地验证状态

2026-10-29 已在仓库的隔离副本中完成 `npm ci`、`example:validate`、`site:build` 和 `site:verify`；校验结果为首页 1 个、正式案例 0 个、静态引用 2 个。原工作目录依赖恢复后，`site:build` 和 `site:verify` 也成功。详细结果见 [开发记录](plans/2026-10-29.md)。

## 8. GitHub Pages 线上发布验收（2026-10-29）

- **仓库：** https://github.com/duanxirui/threejs-projects
- **Pages 网站：** https://duanxirui.github.io/threejs-projects/
- **初始代码提交：** `715fdec`，已成功推送到 `origin/main`。
- **首次触发的运行：** [40822479268](https://github.com/duanxirui/threejs-projects/actions/runs/40822479268) 因尚未启用 GitHub Pages，`Configure GitHub Pages` 返回 404；用户随后在仓库设置中启用了 Pages。
- **成功的部署运行：** [40823265674](https://github.com/duanxirui/threejs-projects/actions/runs/40823265674)，构建和发布两个任务均为 `success`，包括 `Configure GitHub Pages`、`Upload GitHub Pages artifact`、`Deploy GitHub Pages` 及 `Check published homepage`。
- **线上 HTTP 检查：** 首页返回 200，页面标题包含 `Three.js Lab`；HTML 引用的 JavaScript 和 CSS 资源分别返回 200，路径包含 `/threejs-projects/assets/`。
- **T05 阶段限制：** 当时尚无正式案例，因此无法验收案例深链接和 WebGL。T06 已在本地 Chrome 验证首个案例的桌面与手机画面；线上深链接及画面在正式发布后补验。

后续向 `main` 提交案例或文档变更，会再次自动触发部署流程。
