# GT Lifecycle Lab｜燃气轮机数字化样机与智能运维实验平台

教学与工程验证项目，围绕负荷变化下的异常分析，连接实时监测、三维部件、运行数据、知识证据、检查建议与检修履历。通用教学结构与合成场景不代表制造商真实 CAD、工业标定或设备控制。

前端采用 Vue 3/TypeScript/ECharts，与同源 `/viewer` iframe 中的完整 turbine-explorer 联动；后端采用独立 Python API，后续增加本地 RAG/MCP Assistant、Kafka 双设备输入、Flink/Spark 同窗对照和正常运行基线。完整 M0～M4 范围按 27 项任务的依赖逐项推进。

## 阅读入口

| 文档 | 用途 |
| --- | --- |
| [AGENTS.md](AGENTS.md) | 当前授权、执行规则、阅读顺序与 skills |
| [DEV_SPEC.md](DEV_SPEC.md) | 完整产品目标、架构、数据和业务要求 |
| [TASKS.md](TASKS.md) | 唯一任务、依赖及状态清单 |
| [ACCEPTANCE.md](ACCEPTANCE.md) | 145 条必要验收、固定夹具和通过条件 |
| [dsh 接入与派工](docs/agents/dsh.md) | Source、Policy、Executor、prepare 与当前派工 |
| [Worker 工作流](docs/agents/workflow.md) | skills、审查与 S→C→E→K |
| [Issue tracker](docs/agents/issue-tracker.md) / [标签映射](docs/agents/triage-labels.md) | GitHub Issues 派工与本地协作 |
| [领域文档约定](docs/agents/domain.md) / [GLOSSARY.md](GLOSSARY.md) | 已确认术语；ADR 按需创建 |
| [上游复用说明](docs/UPSTREAM_REUSE.md) | 固定版本、许可与集成要求 |
| [M0-00 冻结记录](evidence/M0-00/criteria.md) | 当前任务范围、输入、独立预期、命令及证据要求 |
| [历史准备记录](evidence/M0-00/preparation/20261103T142014+0800/README.md) | 准备来源与运输记录 |
| [模型资产](assets/models/README.md) | GLB、导出源码子集、映射与许可 |

## 当前执行

Issue #5 已正式派发 M0-01「Vue 与 Python 前后端独立运行」。Vue页面提供实际后端健康检查，Python API独立构建和运行；本机开发、配置、容器部署与验收命令见 [M0_01.md](docs/M0_01.md)。FE-BASE已通过PR #4实际集成，完整源程序的独立入口见 [FE_BASE.md](docs/FE_BASE.md)。当前进度与准确版本只查 [TASKS.md](TASKS.md)。

协调聊天组织准确候选的全新上下文独立 Standards/Spec 审查与实际复验，通过后完成证据、远程基线、锁定登记和最终head核查，由协调聊天合并并核查实际集成。开发worker只执行M0-01，后续任务单独派发；不执行approve、merge或auto-merge，不调用gh-owner。

模型资产保留已有 GLB 与导出源码子集；完整前端与 RAG 上游分别在 FE-BASE、RAG-BASE 取得并通过 Git subtree 导入。原有 LICENSE 与第三方许可分别适用。依赖、构建、运行数据库、模型权重、秘密和中间日志按 .gitignore 管理，公开模型、锁文件及必要脱敏证据进入版本控制。

## 后续任务

每项任务使用实际工作树内的正式入口，核实前置 LOCKED 与实际分支包含的成果，冻结 S，再形成完整候选 C、审查与实测、证据 E、远程基线和锁定 K。标签或 PR 存在不能替代成果集成。完整目标保留至 M4，后续开发须具有对应任务的明确派工。
