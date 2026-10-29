# Three.js 独立案例开发规范

> 版本：V1.0
> 阶段：T02（2026-10-29）
> 核心要求：一个案例文件夹就是一个可独立运行、构建、发布的项目。

## 1. 目录结构

每个正式案例创建在 `examples/<slug>/`；基础模板位于 `templates/threejs-basic/`，它本身不是正式展示案例，也不属于根 npm workspaces。

```text
examples/<slug>/
├── index.html                # 独立 HTML 入口
├── src/
│   ├── main.js               # 本案例的 Three.js 代码
│   └── style.css             # 本案例的样式
├── public/
│   ├── preview.svg           # 首页展示封面，可换成其他允许的图片格式
│   ├── models/               # 本案例专属模型
│   └── textures/             # 本案例专属贴图
├── example.json              # 案例展示元数据
├── package.json              # 自身依赖及脚本
├── package-lock.json         # npm 安装后生成的锁文件，建议提交
├── vite.config.js            # 本案例独立构建配置
├── .gitignore                # 独立版本控制时忽略生成文件
└── README.md                 # 安装、运行和资源说明
```

独立运行必需资源必须都在案例目录内；不要引用 `../../packages/shared`、其他案例、仓库根目录的配置、资源、环境变量或构建脚本。依赖必须能通过案例自己的 `package.json` 从公开包源安装，不能采用 `workspace:`、`file:`、`link:` 或跨目录相对路径依赖。

## 2. 创建新案例

在仓库根目录执行：

```bash
npm run example:create -- orbit-lab "轨道实验室"
```

执行后生成 `examples/orbit-lab/`，并自动同步：

- `package.json` 中的 `name`；
- `package-lock.json`（模板已有时）的项目名称；
- `example.json` 中的 `slug`、`name`、描述、分类及标签；
- README 标题及 HTML 页面 `<title>`。

若目标目录已存在，命令将报错，不覆盖现有案例。新案例默认 `visible: false`，应先完善场景、简介、分类、标签、封面和资源来源；确认可公开展示后再改为 `true`。

可直接复制 `templates/threejs-basic/` 建立案例，但复制后需手动同步目录名、`package.json`、锁文件、`example.json` 与说明。

## 3. 案例元数据规范

每个案例目录必须提供 `example.json`。正式结构参考 [example.schema.json](example.schema.json)，示例：

```json
{
  "slug": "orbit-lab",
  "name": "轨道实验室",
  "description": "使用 Three.js 交互查看轨道运动。",
  "category": "宇宙探索",
  "tags": ["Three.js", "轨道", "动画"],
  "cover": "public/preview.svg",
  "visible": true
}
```

| 字段 | 类型 | 约束 |
| --- | --- | --- |
| `slug` | string | 唯一、与案例目录和 `package.json.name` 完全一致；小写英文、数字和中间短横线 |
| `name` | string | 非空展示标题，可用中文 |
| `description` | string | 非空的案例功能简介 |
| `category` | string | 非空分类名称，首页据此筛选 |
| `tags` | string[] | 至少一个非空标签 |
| `cover` | string | 指向本案例 `public/` 内实际存在的 SVG/WebP/PNG/JPEG 文件，例如 `public/preview.svg` |
| `visible` | boolean | `false` 为开发中，`true` 为允许首页展示；后续首页还需考虑构建结果 |

元数据中的封面路径是仓库内的源码路径；T03 已实现的 `scripts/generate-gallery.mjs` 会把它复制到展示首页的生成资源目录，并生成相对网站路径。元数据中不写死 GitHub 用户名、仓库域名或站点绝对路径。

## 4. 必需的独立运行命令

把任意一个案例文件夹单独复制或打包到仓库外的目录，进入该目录执行：

```bash
npm install
npm run dev
npm run build
npm run preview
```

存在已提交且匹配的 `package-lock.json` 时可使用 `npm ci` 复现依赖。安装时需要获取 npm 包的网络环境；独立运行不意味着可以在从未安装过依赖且完全离线的电脑上安装。

`npm run build` 应生成包含所需资源的 `dist/`；这个目录可以独立部署到静态托管平台。安装、运行和构建不应依赖仓库根目录的任何文件。每个案例独立维护其 `README.md`，注明使用方法、第三方资源许可证和必要的外部服务。

## 5. 路径与 GitHub Pages

基础模板的 `vite.config.js` 默认使用：

```js
base: './'
```

因此普通独立构建的 JS、CSS 静态文件引用采用可移植的相对路径。开发案例时，Vite 的普通源码导入和资源 URL 转换应优先于硬编码的站点根路径。若要使用 `public/` 内的资源，运行时代码可采用 `import.meta.env.BASE_URL` 拼接相对于发布根目录的地址。

后续统一 Pages 构建可设置：

```bash
VITE_BASE_PATH=/threejs-projects/examples/orbit-lab/ npm run build
```

以上为 Bash 环境变量写法；Windows PowerShell 需先设置 `$env:VITE_BASE_PATH='/threejs-projects/examples/orbit-lab/'`。实际部署时由统一构建工具为各案例注入对应路径（T04/T05）。

## 6. 案例规范校验

在仓库根目录执行：

```bash
npm run example:validate
```

当前校验器会检查模板和 `examples/` 下已有案例的目录结构、元数据字段、封面存在性、npm 脚本，以及明显的本地路径依赖。可以传入指定目录：

```bash
node scripts/validate-examples.mjs examples/orbit-lab
```

静态校验无法证明浏览器 WebGL 正常渲染，也无法穷尽所有动态资源引用，因此案例完成前还必须进行脱离仓库的真实运行验收。

## 7. T02 实施验收

2026-10-29 已在仓库外的独立副本中确认：

- `npm ci` 成功独立安装 Three.js 与 Vite（15 个包）；
- `npm run build` 成功输出 `dist/`；
- `npm run dev -- --port 5198 --strictPort` 成功启动 Vite 并报告 `ready`；
- 设置 `VITE_BASE_PATH` 后重新构建成功，资源 URL 含正确的 Pages 子路径，封面复制成功；
- 示例生成命令可创建新案例，并且生成的新案例通过元数据与结构校验；
- 生成案例的 `package-lock.json` 顶层名称与根包名称均已正确更新。

**待补充的浏览器级检查**：跨沙箱访问本地开发服务器时发生访问限制和超时，因此尚未取得实际浏览器画面 / WebGL 渲染验收证据。该项需在有浏览器访问能力的环境中补做，不能把服务器 `ready` 等同于画面验收通过。

T03 已实现展示首页与自动索引；T04 已实现构建成功清单过滤和静态站点装配，使用 `npm run site:build` 可生成完整站点；T05 才部署 GitHub Pages。
