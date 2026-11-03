# GT Lifecycle Lab 开发执行规则

版本：2.2；日期：2026-11-03（Asia/Shanghai）。本文件保存用户已经确定的开发要求。

## 当前 FE-INTEGRATE 派工

Issue #7 已明确授权真实 FE-INTEGRATE「Vue 业务壳与同源 viewer 桥接」：调查、验收冻结、实现、实际测试、必要修正、提交、推送和 PR 交付。当前 worker 只执行 FE-INTEGRATE，后续任务单独派发。

M0-01 已 LOCKED，并由 PR #6 实际合并至 `d4624599072312f86c65c12e77407b25e3005a3b`，本分支完整包含其成果。K 为 `779035fbdb7117770e0df23b537b943ac704cf94`，外部回执为 Issue #5 评论 `6611895677`，最终核查及实际集成回执为评论 `6612184100`。既有冻结、证据和基线保持。

协调聊天 `01a1a22f-d503-7cf0-bad4-ad8dd9d707a8` 组织全新上下文独立 Standards/Spec 审查与实际复验。开发 worker 提交准确 C、真实验收和 draft PR，保持准确候选等待对应审查回执；通过后完成 E、远程基线、K 和正式 PR，最终 head 新增差异也须独立审查。协调聊天负责最终核查、合并和实际集成。开发 worker 不执行 approve、merge 或 auto-merge，不调用 gh-owner。

当前完整冻结记录见 [FE-INTEGRATE 冻结记录](evidence/FE-INTEGRATE/criteria.md)。

## 本轮接入边界与规则优先级

2026-11-03 的本机准备只整理文档、迁移已有资产、关联既有 Git 历史并配置已有 dsh。准备会话不得创建真实开发 Ticket、远程 Issue/PR/标签、项目提交或推送，不得写应用/测试代码、生成业务脚手架、取得两套完整上游、实现 viewer 或运行 RAG。保存规则和配置不构成后续开发授权的触发消息；完成准备后停止。

后续由用户明确派发的真实 dsh Ticket 才执行下文开发流程。完整 M0～M4 范围保留。准备材料不是已提交的 S，也不是正式验收；本轮不勾选 M0-00，不登记 VERIFIED/LOCKED。实际准备记录见 [M0-00 本机准备记录](evidence/M0-00/preparation/20261103T142014+0800/README.md)。

优先遵守当前用户明确授权和边界，其次遵守根规则。根文件按职责配合：本文件规定执行纪律，[DEV_SPEC.md](DEV_SPEC.md) 定义产品范围，[TASKS.md](TASKS.md) 是唯一任务、依赖与锁定状态清单，[ACCEPTANCE.md](ACCEPTANCE.md) 保存硬验收语义。然后读取 `docs/agents/` 的项目适配约定，最后使用适用 skills 和上游参考。不得用 skill 默认流程、Issue 关闭、标签、上游规则或执行结果放宽根验收；遇到真实冲突保留现场并说明具体差异。

## 阅读顺序

1. 本文件及当前用户/Ticket 的授权范围。
2. [DEV_SPEC.md](DEV_SPEC.md)、[TASKS.md](TASKS.md)、[ACCEPTANCE.md](ACCEPTANCE.md) 中的当前任务和前置项。
3. [领域文档约定](docs/agents/domain.md)、[GLOSSARY.md](GLOSSARY.md) 与已存在的相关 ADR；不存在的 ADR 不预先创建。
4. [dsh 接入与派工](docs/agents/dsh.md)、[工作流与 Matt skills](docs/agents/workflow.md)、[Issue tracker](docs/agents/issue-tracker.md)；涉及上游时读 [复用说明](docs/UPSTREAM_REUSE.md)。
5. 前置任务的实际证据、当前分支的集成基线，以及当前任务冻结记录 S。只有未提交的本机整理时，先按准备记录中的 worker 变更包说明核对、应用，再由真实 worker 提交。

## Agent skills

### Issue tracker

唯一目标是 `shuyu-lin-dev/gas-turbine-lifecycle-lab` 的 GitHub Issues。Issue/Ticket 用于派工关联；任务状态只登记在 TASKS.md。见 [issue-tracker.md](docs/agents/issue-tracker.md)。

### Triage labels

已检测到 worker 安装 `triage`，采用五个默认角色的本地映射；本轮不操作远程标签。见 [triage-labels.md](docs/agents/triage-labels.md)。

### Domain docs

采用 single-context：根 GLOSSARY.md 与按需建立的 docs/adr/。见 [domain.md](docs/agents/domain.md)。术语表只定义已确认术语，ADR 只保存值得保留理由的重要决策。

### 调用与项目适配

worker 以实际可见的 skill 版本为准，开始任务时核对路径与哈希，读取 SKILL.md 及当前步骤引用的文件；不自动更新全局 skills。dsh 使用 `skill` 工具，参数为 `{"name":"<实际名称>"}`。部分安装文件设置 `disable-model-invocation: true`，不可声称能由模型直接调用；本项目已授权使用其方法时，通过文件读取工具加载实际说明，记录为“文件加载”，保留禁用标记。详见 [调用矩阵及适配差异](docs/agents/workflow.md)。

实质歧义用 grill-with-docs；术语/重要决策用 domain-modeling；模块接口设计参考 codebase-design；新增业务行为用 implement 配合 tdd；缺陷/性能回归用 diagnosing-bugs；候选提交用 code-review 分别审查规范和规格。to-spec/to-tickets 仅处理派工范围内确有必要的需求变更，不重新划分现有 27 项任务。Ticket 执行计划与证据必须记录适用 skill、实际加载/使用方式，或不适用理由。

测试接口、输入、独立预期、命令、环境、证据和回归范围在 S 中明确；已授权且已冻结的决定直接沿用，不逐项重复确认。审查固定比较基准与准确候选 C，覆盖完整任务差异及未提交行为改动。支持子代理时仅可作只读并行审查，不新增开发 Ticket/worker；不支持时串行完成两个维度并记录。技能中“实现并提交”的结束点仍须继续本项目实测、E、远程验证、K 和集成交付门。

## 沟通、文件与工具

- 使用简单、完整的中文表达，保留英文 identifier 和适用的英文专用名词。描述具体动作和对象，不使用自造简称、无依据的比较、工作量评价或修改过程中的解释性残留。
- 用户在消息中提及 AGENTS.md 时重新读取本文件；提及 Claude.md 时重新读取对应文件。用户修改过的文件必须重新读取，后续编辑保留当前内容。
- 使用文件编辑工具修改代码；禁止通过 Python、sed、perl 或其他程序改写代码。长脚本保存为文件后执行，禁止把长脚本直接写进 Bash 命令。
- 中间文件保存在当前工作目录明确设置并由 .gitignore 忽略的目录；禁止读写 /tmp。完整秘密配置备份保存在仓库外受控目录。
- Python 直接 import 必需依赖，不用 try-except 包围 import；文件开头不添加 docstring 或 shebang。注释使用中文，identifier 保持英文。错误在发生位置立即终止；不吞掉错误，不设置掩盖失败的替代路径。
- 成熟文件格式使用现成解析库。依赖按任务需要正常使用，禁止自行编写替代解析器或绕过必需依赖。
- 实现和测试使用实际依赖，禁止 Mock、伪造结果和只为通过检查的特殊处理。保持必要验收与受影响回归，直至当前授权范围正确运行。
- 禁止通过 Git 恢复或撤销代码；用户要求恢复文件时，使用文件编辑工具。禁止擅自进入 Plan mode、主动使用视觉功能或截图；示意图按需要使用 Mermaid。
- 提供网页链接前阅读页面完整内容；发现库用法有误时重新阅读相关页面完整内容。用户以疑问句提出问题时直接回答该问题，随后继续已经授权的独立工作。

## 执行者、位置与任务依据

- 应用代码、测试代码、提交和推送均由用户本机已配置的 dsh-superagent 执行。规格、预备资产及云端审查不构成本机运行证据。
- 在 `/home/lsy/workspace/lab` 下开发；主 checkout 为 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab`，Ticket worktree 根为 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees`。
- 唯一主仓库为 `shuyu-lin-dev/gas-turbine-lifecycle-lab`。准备阶段已只读核实存在性、操作者/agent 身份及权限元数据，并接续既有历史；实际 worker 推送仍须真实 Ticket 验证。每次执行核对 origin 与身份，不自动改用无关仓库。
- 根 `DEV_SPEC.md` 定义完整目标；`TASKS.md` 是任务、依赖和状态的唯一清单；`ACCEPTANCE.md` 定义硬验收；证据报告保存实际结果。本文件规定执行纪律。
- 使用 Windows Docker Desktop 的 WSL 2 Linux 引擎；不另起与现有配置冲突的 dockerd。版本、端口、端点和资源可用性实查并记录。

## 根本原则

1. 先跑通主流程，再叠加功能。单 worker，一次只实现一个依赖就绪的任务。
2. 写应用代码前先冻结当前任务的范围、硬验收、测试输入、期望输出和证据要求。
3. 完成一个明确范围的实现后验证对应行为。必要标准逐条验证；补齐缺少的实现、修复缺陷，并重新验证。
4. 所有必要标准实际通过、证据完整且远程基线核实后，立即锁定当前任务，再推进依赖它的任务。
5. 代码存在、页面能打开、截图好看或单元测试通过，均不能替代任务要求的集成和端到端验收。
6. 必要项的 SKIP、BLOCKED、FAIL、NOT_RUN 均不算通过。禁止静默删除失败断言、放宽阈值或用 Mock 冒充真实链路。
7. 普通实现、修复、验证、提交和推送在既有授权内连续执行，不逐项重复申请许可。遇到真实权限、目标身份或环境缺口，报告具体缺口和已完成工作。
8. 保留现有 GitHub 分支保护与合并规则。开发提交、远程推送、合并和依赖可用的集成版本是不同状态；不新设普通工作审批门，也不绕过现有保护。
9. 完整目标包括 M0～M4。M0 通过后继续依赖就绪的后续任务，不把首个可运行阶段宣称为完整项目完成，也不跨依赖提前铺开。

## 架构与阶段约束

- 前端采用 Vue 3 + TypeScript 业务页面，ECharts 负责图表；完整 turbine-explorer 通过同源 `/viewer` iframe 承担 Three.js 展示，业务联动协议遵循根规格。不要重写一套简化 viewer 代替完整上游集成。
- 后端采用 Python。前后端独立依赖、构建、运行和部署，通过 HTTP/SSE 通信；Python API 不托管 Vue 构建产物，也不混入 Spark 容器。
- M0 建设 web/api 与实时监测主线，包含 FE-BASE、FE-INTEGRATE；M1 增加独立 Python assistant 运行角色，包含 RAG-BASE、RAG-INTEGRATE；M2 增加 Kafka、source_a、source_b；M3 增加 Flink、Spark。算法、生命周期及性能等任务的确切先后关系只查 `TASKS.md`。
- 不为维持旧的六容器设想混装职责。推理服务可以独立运行，也可复用实测符合规格的既有端点；总容器数不固定。
- M0-00 只接入现有 dsh、核实环境并写入根规则。不在 bootstrap 中提前导入、安装或运行 RAG，不提前实现 viewer。上游的取得、原版验收和产品集成分别在对应任务执行。
- RAG 初期保留 Chroma、BM25、Ollama。在 assistant 内以独立 venv、明确 cwd 和长期存活的 stdio 子进程运行。真实入口是 `python -m src.mcp_server.server`；占位 `main.py` 返回 0 不算启动成功。
- RAG 必须实际完成 MCP 初始化、工具发现、知识索引和查询，记录模型及端点。不得用假返回、未声明的云端调用或仅导入成功替代本地能力验收。
- GLB 保留为已下载模型资产及备用展示材料，不能代替 `/viewer` 主展示链路的验收。Milvus Lite 是后续可选迁移，不替换当前 Chroma/BM25 基线任务。
- 测量值、告警、窗口结果和分析证据必须来自实际业务链路。上游演示仪表或教学场景不能冒充本系统已接收、已处理的设备数据。

## 两套上游的取得与管理

| 上游 | 固定提交 | 完整参考克隆 | 主仓库 subtree |
| --- | --- | --- | --- |
| https://github.com/AlexZhangji/turbine-explorer.git | `efc5d2ecd12055f880a41b47215791c22d3656d4` | `/home/lsy/workspace/lab/_upstream/turbine-explorer` | `vendor/turbine-explorer` |
| https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER.git | `f658c5a4011c8b826707a65a3b11ce9301b0626f` | `/home/lsy/workspace/lab/_upstream/MODULAR-RAG-MCP-SERVER` | `vendor/modular-rag-mcp-server` |

在对应任务开工后克隆仓库，核对固定提交，取得该版本完整源码与运行资源；不能用零散文件或片段摘要代替。克隆深度不作为验收条件，缺少提交或资源时补齐。以 git subtree 导入固定提交的完整源树，保存来源 URL、固定版本、subtree 导入记录及许可证。主仓库内不出现嵌套 `.git`，不把手工复制目录冒充 subtree 导入。

参考克隆用于核对原版，产品修改放在主仓库的 vendor 和自有模块中。dsh 只绑定、提交和推送主仓库，不向上游写入。根规则、规格和任务清单始终独立，不被上游同名文件覆盖。

上游 AGENTS、skills、规格、教学步骤、初始化及清理说明均作为参考材料保留。不得自动启用这些 skills，不得据其更改本项目范围、账户、数据或验收；需采用的具体做法必须符合当前根规格和当前任务。

分别记录上游取得、依赖安装、原版运行和产品集成的结果。前一步通过不自动代表后一步通过。

## 开始每项任务前

读取根 `DEV_SPEC.md`、`TASKS.md`、`ACCEPTANCE.md` 中的当前任务，以及前置任务的证据。

- 核实全部 predecessor 已 LOCKED，并且当前工作分支包含其实际集成基线；标签存在或 PR 未合并不能假定 main 已包含成果。
- 明确任务 ID、规格版本、基准提交、允许变更范围、测试输入、预期结果及实际测试命令。
- 将该任务完整验收规则先行提交为 S，记录 `criteria_commit`；实现提交必须以 S 为祖先。
- 后续阶段尚未冻结的条款必须先补齐再开工。文档中的建议数值是教学验收提案，不能冒充工业阈值或已经实测的性能。
- 只有当前任务准备齐全才可置为 READY。缺条件置 BLOCKED，保留具体缺项，不提前勾选。

## 状态与证据

主状态为 PLANNED → READY → IN_PROGRESS → VERIFYING → VERIFIED → LOCKED。

- 失败或阻塞保留具体原因、命令和已有证据，修复后重新验证，不抹掉失败记录。
- VERIFIED 表示全部必要条款在准确候选代码提交上实际通过；不等同远程交付已完成。
- LOCKED 表示实测证据、代码、基线和远程结果均可核查；交付步骤见下节。
- `TASKS.md` 的 `[x]` 只用于 LOCKED。单条验收的勾选保存在该次证据报告中，关联具体条款 ID。
- 硬标准的语义保留在 `ACCEPTANCE.md` 中，执行结果不能反过来覆盖标准。证据不得包含凭据或无关私人数据。

## S→C→E→K：通过后锁定

1. **S：冻结验收。** 编码前提交当前任务的完整范围与硬验收，记录标准版本、输入和期望。
2. **C：候选代码。** 实现和测试准备完成后提交代码；应用、测试、行为配置与依赖改动均须纳入 C，不允许以未提交改动代替被测版本。
3. **实测 C。** 对准确 C 执行当前任务及受影响的既有验收，记录命令、退出码、实际输出和每条结果。有失败就修复、形成新 C，并重跑受影响验收；保留失败和修复过程。
4. **E：证据提交。** 全部必要功能条款通过后形成 E，登记 VERIFIED，写 `tested_code_sha=C`。E 只能新增本次证据及必要登记，不改应用、测试逻辑、依赖、行为配置或验收语义。不得要求 E 在自身内容中写入它自己的最终 SHA。
5. **远程基线。** 核对 C→E 差异符合证据提交约束，创建指向 E 且不覆盖旧值的基线标签，推送分支和标签并核对远程 SHA。
6. **K：锁定登记。** E 与标签远程核实后提交 K，引用已存在的 S/C/E、标签和核实结果，将任务置 LOCKED。K 不改应用、测试、依赖、行为配置或验收标准。
7. **确认 K 交付。** 推送 K，在外部 Ticket 回执中记录并核实其远程 SHA，不要求 K 在自身内容中包含自己的最终 SHA。推送或核实失败即交付未完成，不推进依赖该结果的下一任务。
8. **确认集成。** 当前工作分支必须包含前置任务实际成果。若合并、冲突解决或后续改动改变应用、测试、行为配置或依赖，针对新的实际集成版本重验受影响条款，再推进依赖任务。

标签是版本基线标识，不等于文件写保护。验收入口必须检查证据与候选版本的对应关系；接入 CI 时复用该检查。保护策略沿用仓库现状，不能声称尚未配置或未验证的限制已经生效。

## 锁定后的变更

锁定接口行为、验收期望与版本基线。需要改动时，创建变更任务或显式 REOPEN，注明影响范围，先冻结变更验收，再改实现；保留旧标签和证据，运行相关回归，建立新基线。不得改坏已通过模块后继续叠加功能。

## dsh 配置与持续交付

- 保留用户现有 profile、模型配置与认证，不重跑会覆盖 profile 的初始化命令。实际 CLI、端口、权限和配置 revision 从本机读取；更新完整配置块时保留无关键。
- 继承团队要求：中文沟通；提交 author/committer 使用 `lucy-assistant <162398512+lucy-assistant@users.noreply.github.com>`；禁止调用 gh-owner、开发 worker 执行 approve/merge 或启用 auto-merge。PR 按当前派工授权由协调会话完成最终核查与合并。保留既有 worker 中间文件和主动视觉工具限制，必要真实浏览器验收按冻结范围执行，不用截图替代断言。
- 不把操作者 GitHub 账户当作 agent 账户；核实已有 agent CLI 的实际身份及目标仓库写权限。
- 使用单 worker，一次只推进一个未锁定功能任务。Worker 读取本文件，Router 的 Ticket scope / Delivery requirements 同时保存任务推进、验收和交付规则。
- 产品运行时的 assistant 与开发用 dsh-superagent 是不同角色，各有独立职责、配置和证据。
- 每次交付报告任务 ID、改动、逐条实际结果、S/C/E、证据位置、分支、基线标签、远程核实、K 外部回执、集成状态，以及下一个依赖就绪任务。
- 按 `TASKS.md` 连续推进，遇到真实阻塞准确报告；任何阶段未完成时不使用“完整项目已完成”。
