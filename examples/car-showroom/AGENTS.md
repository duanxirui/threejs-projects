# CAR ATELIER 仓库开发约束（供 Codex 自动读取）

适用于本仓库所有文件。项目文档始终集中在 `docs/`；这里仅存放执行约束，**唯一完整维护规则**以 [`docs/README.md`](docs/README.md) 和 [`docs/development-plan.md`](docs/development-plan.md) 为准，不要另建重复的变更日志。

每次开始开发或调整文档时，必须遵循以下顺序：

1. **确定任务编号：** 先查看 `docs/development-plan.md` 的 `CAR-XXX` 任务台账。已有任务继续用原编号，新需求按最大编号递增分配；不得重用或随意改旧编号。
2. **实施真实工作：** 按用户授权修改对应代码或文档；设计/架构原则变化时维护 `docs/development-scheme.md`，任务状态或依赖变化时维护 `docs/development-plan.md`。
3. **当天写开发日志：** 使用 `docs/plans/YYYY-MM-DD.md`，同一天只写同一个文件；每项记录任务编号、实际完成功能或修复、主要文件、验证命令/环境与真实结果、限制，以及 Git 状态。尚未完成的工作保留在开发计划中。
4. **关联 Git：** 实际提交时使用包含任务编号的提交信息，例如 `fix(CAR-006): ...`，把真实 commit SHA 回填对应日期日志；若没有提交，必须标为“未提交”。仓库此前没有初始提交，不能杜撰历史哈希。未获得明确提交授权时不擅自创建 Git 提交。
5. **结束前检查：** 代码改动执行适当的实际校验；文档改动必须运行 `node scripts/check-docs.mjs` 检查本地链接、编号、日期索引和真实 Git SHA。更新开发计划的完成状态及日期引用，再向用户报告真实结果与未验证部分。

保持 `docs/` 精简为文档中心、开发方案、开发计划和按日记录；不要重新创建独立 `CHANGELOG.md`、`docs/AGENTS.md` 或重复的工程/素材文档。根目录此 `AGENTS.md` 仅为开发助手的自动规则入口，项目文档仍以 `docs/README.md` 为统一入口。
