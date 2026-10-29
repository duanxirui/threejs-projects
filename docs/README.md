# 文档中心

本目录集中管理仓库级开发文档。案例自身的安装使用说明保存在各案例目录的 `README.md` 中。

| 文件 | 用途 | 现状 |
| --- | --- | --- |
| [THREEJS_COLLECTION_PLAN.md](THREEJS_COLLECTION_PLAN.md) | 集合整体规划、T01～T07 实施路线及验收 | 已创建 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 工程目录职责和案例隔离原则 | T01 已创建 |
| [CHANGELOG.md](CHANGELOG.md) | 按实际完成内容记录变更 | T01 已创建 |
| [plans/2026-10-29.md](plans/2026-10-29.md) | 当天实际实施及检查记录 | T01 已创建 |
| [CASE_STANDARD.md](CASE_STANDARD.md) | 单案例模板、元数据与独立运行验收规范 | T02 已创建 |
| [example.schema.json](example.schema.json) | 案例元数据的 JSON Schema | T02 已创建 |
| [GALLERY.md](GALLERY.md) | 展示首页、索引生成、搜索及路径配置说明 | T03 已创建 |
| [BUILD.md](BUILD.md) | T04 统一构建命令、输出结构、失败保护和本地验收 | T04 已创建 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | GitHub Actions 工作流、Pages 首次启用和线上验收 | T05 已创建，待远程发布 |

文档维护规则：

1. 新增或修改功能后更新 `CHANGELOG.md`，说明实际变化和影响。
2. 按日期在 `plans/YYYY-MM-DD.md` 记录当日已执行内容、检查结果和遗留问题；目标与实际结果分开描述。
3. 根目录 `README.md` 作为项目入口，不堆放详细实施记录。
4. 未实现的功能应明确标为“规划”或“待实施”，避免将计划当作完成成果。
