# dsh 本机接入与后续派工

本文件由 v2 接入说明适配为正式仓库入口。执行边界与交付纪律以 [AGENTS.md](../../AGENTS.md) 为准；任务/依赖/状态只查 [TASKS.md](../../TASKS.md)，硬验收只查 [ACCEPTANCE.md](../../ACCEPTANCE.md)。[workflow.md](workflow.md) 保存 Matt skills 与 S→C→E→K 适配。

## 当前 FE-INTEGRATE 执行

Issue #7 派发真实 FE-INTEGRATE。Ticket 为 `6ba251e86b41f5c03f50f84a0180213c`，worker session 为 `worker-6ba251e86b41f5c03f50f84a0180213c`，工作树为 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/vue-viewer-bridge-6ba251e86b41`，分支 `agent/vue-viewer-bridge-6ba251e86b41`。本项范围与验收见 [冻结记录](../../evidence/FE-INTEGRATE/criteria.md)。

M0-01 已通过 PR #6 合并至 `d4624599072312f86c65c12e77407b25e3005a3b`；K 为 `779035fbdb7117770e0df23b537b943ac704cf94`，外部回执为 Issue #5 评论 `6611895677`，最终核查及实际集成回执为评论 `6612184100`。本工作分支包含前置成果。当前 worker 完成 FE-INTEGRATE 准确候选、真实验收及 draft PR 后，保持 C 等待协调聊天 `01a1a22f-d503-7cf0-bad4-ad8dd9d707a8` 组织全新上下文独立 Standards/Spec 审查与复验；对应候选通过后继续 E、远程基线和 K，最终 head 新增差异仍须独立审查，再由协调聊天最终核查、合并及确认集成。后续任务单独派发，开发 worker 不执行 approve、merge 或 auto-merge，不调用 gh-owner。

以下准备观察、配置保存正文与 preparation 证据保留其历史含义，实际执行以当前派工和冻结记录为准。

## 准备范围与历史观察

2026-11-03 本轮仅完成本机准备、文档/资产整理和必要配置，不创建或触发真实 Ticket，不创建项目提交、推送、远程 Issue/PR/标签或发送消息，不克隆/subtree 导入上游、不写应用/测试/脚手架、不实现 viewer、不运行 RAG。保存配置的内部通知不是开发指令；准备完成后停止。后续明确派发的真实 Ticket 才开发。完整 M0～M4 目标保留。

原 v2 交接说明曾记载云端连接读取目标仓库返回 404、操作者连接身份 shuyu-lin-dev、主目录和 worktree 路径为预期值，以及尚未在用户机配置或验收。这些是当时观察；404 不能证明仓库不存在，也不能用操作者身份代替 agent 身份。原包归档只用于追溯，正式工作不读取或依赖原包目录。

## 本轮实测事实（Asia/Shanghai）

| 项目 | 本轮事实 |
| --- | --- |
| dsh/profile | 0.2.1-rc.3 / superagent；已有服务保持运行 |
| 管理地址 | http://127.0.0.1:3082/orchestrator/api/ |
| 插件 | dsh-superagent 0.1.0，既有 link 安装；源码 HEAD 6337fc823ce20251c8de8085948165c81aaa701e；已有 scripts/dsh-superagent 用户修改保留 |
| 实际状态目录 | /home/lsy/.dsh/state/gas-turbine-lifecycle-lab |
| 操作者 | 连接账号 shuyu-lin-dev；在 GitHub allowed list 中，仓库元数据权限为 admin |
| Agent | Source CLI /home/lsy/.local/bin/gh-agent-bot；其实际登录 lucy-assistant；元数据 READ/WRITE，push=true；未实际推送 |
| Git author/committer | 本仓库 local 配置为 lucy-assistant / 162398512+lucy-assistant@users.noreply.github.com；worker 环境 git var 已核实；无新提交 |
| 飞书 | 既有机器人 superagent，连接监听正常；未发送测试消息 |
| 主 checkout | /home/lsy/workspace/lab/gas-turbine-lifecycle-lab；main 跟踪 origin/main |
| 唯一 origin | https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git |
| 远程默认分支/既有基准 | main / dad14da1561ac609a5d14076629d1698c53b3627；本轮没有创建该提交 |
| Git 历史接续 | 原目录没有有效 Git 元数据；初始化后 fetch 并安全检出既有历史；HEAD 与 origin/main 相同，ahead/behind=0/0 |
| GitHub Source | 唯一仓库已正确，保持 revision 2，无需改写 |
| Policy / Eval | Policy revision 1、Eval revision 0 保持原值；allowed list、observe、权限与保护不放宽 |
| Executor | revision 1→2；maxWorkers 3→1；directory 从旧 /mnt/e 路径迁至下述 worktree 根；model=null、blockedCommands=[gh-owner] 保留 |
| Team prompts | revision 2→4；保留原 communication、scope、delivery、skills，完整增补下方两段、Matt 项目约定和根规则中的文件操作要求；保存后回读一致 |
| 生效边界 | prompts 返回 effect=next-request，内部配置通知已注入；现有 Router Session 最后使用的仍为 revision 2，revision 4 在下一次模型请求读取。本轮不触发请求探测，也没有 worker 运行证据 |
| 活跃任务 | 修改前 running=0、queued=0、open Tickets=0；修改后仍为空 |

上述是准备观察，不是 M0-00-A01…A07 的正式 PASS，不填 VERIFIED/LOCKED。详细命令、退出码、配置前后及哈希见 [本次准备记录](../../evidence/M0-00/preparation/20261103T142014+0800/README.md)。

## Prepare 与独立工作树

Ticket worktree 根固定为 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees`。完整保存内容见 [prepare.sh](../../evidence/M0-00/preparation/20261103T142014+0800/prepare.sh)，其 SHA256 为 `3688da872189a8c2d773a6bc68ca0ff039d21d586e477b41e75eb02edd885ae4`，与 Executor 回读逐字一致。命令用 sh 执行，已作语法检查；本轮没有用伪造 Ticket 变量运行它。

prepare 校验唯一仓库、agent、真实路径和 origin，拒绝已有目标目录；从 origin 的 main 或框架提供的 refs/pull/<n>/head fetch 到当前 Ticket 专用引用，核实是 commit 且包含本轮已知既有基准，再以 `agent/$DSH_SUPERAGENT_NAME` 创建独立 Git worktree。它不复用主 checkout、不创建提交、不覆盖已有分支/引用历史、不主动复制未提交文件。任务 ID 另记入任务、提交信息和证据，不能替换框架分支名最后一段。

实际安装版在新 Ticket 目录不存在时，在执行根用 sh 运行 prepare 一次；失败保留输出，需由真实 Ticket 正常恢复。不得为“重试干净”强删目录、覆盖已有分支或取消无关任务。该版并发配置控制普通 worker 槽，同时为人的消息/状态请求保留特殊槽；团队规则仍要求一次一个开发任务，不能借此增加开发 worker。

本轮文档/资产尚未提交，独立 worktree 不会自动获得它们。后续真实 M0-00 worker 先只读主 checkout 的 [TRANSFER.md](../../evidence/M0-00/preparation/20261103T142014+0800/TRANSFER.md)，核对基准、完整清单和 SHA256，将变更包应用到自己的 worktree；确认根规则后再补齐并提交 S。正式文件提交并集成后，直接使用各工作树的仓库入口，不再需要此一次性变更包或原包归档。

## 配置保存方法

以实际安装的 lib 与本机 API/schema 为准：请求头 `x-orchestrator-request: 1`；GET state/settings/prompts 和 GET tickets 用于检查。修改设置用 PUT settings/<block>，正文为完整 `value` 与刚读取的 `revision`；提示词用 PUT prompts，正文为完整 `config` 与当前 `baseRevision`。不要把界面摘要当完整配置块，也不要修改无关键。

先检查活跃 Ticket、队列与运行状态，再备份配置；若会影响任务，保全现场并待安全空闲，不取消 Ticket、不终止 worker、不重置实例。发生 409 时重读并比较，不能盲目覆盖；返回 restarting 时等待 ready，再重读当前 settings/prompts/revision 后继续，不连续发送旧版更新。保存后回读 Source、Policy、Executor 和 prompts，核对所有改动和保留项。本轮只修改 Executor 与 prompts，其余正确配置保持原 revision。

完整设置、提示词、profile 和一致性数据库备份留在仓库外权限受控的 private 目录。仓库只保留脱敏快照与差异，不带认证令牌或飞书个人/群标识。

## Team Ticket scope 增补正文

下面是原 v2 的完整正文；与后续 Matt 约定一起增补到原 scope，原有效要求保留：

Work on one dependency-ready GT Lifecycle Lab task at a time with a single worker. The root AGENTS.md and DEV_SPEC.md govern execution; TASKS.md is the sole task and dependency ledger, and ACCEPTANCE.md defines the gates. Commit and freeze the current task's scope, inputs, expected results and required acceptance steps before application code. M0-00 only bootstraps the existing dsh binding and root rules; do not import or run RAG or implement the viewer during bootstrap. Execute FE-BASE and FE-INTEGRATE in M0, and RAG-BASE and RAG-INTEGRATE in M1, following the exact dependencies in TASKS.md. Fully clone the pinned upstreams and import their complete trees through git subtree only in the corresponding task. Preserve provenance and licenses; do not enable upstream skills or overwrite root rules. Use the Vue shell with the same-origin /viewer iframe and the actual RAG MCP entry python -m src.mcp_server.server. Finish, verify and lock each task before expanding scope. Preserve and continue the complete M0–M4 goal when dependencies are ready. Repair missing functionality and failures, report actual blockers, and continue within the user's existing authorization.

## Team Delivery requirements 增补正文

下面是原 v2 的完整正文；原中文沟通、提交身份、披露与人工合并要求保留：

For every task, report the task ID, criteria commit S, tested code SHA C, commands, exit codes, per-criterion results, evidence hashes, remote branch and baseline. Required SKIP, BLOCKED, FAIL or NOT_RUN results block acceptance. Do not weaken assertions or substitute mocks for required integration paths. Separate candidate code commit C from evidence-only commit E: E records VERIFIED, references C, and must not alter implementation, tests, dependencies, behavior-changing configuration or acceptance semantics. After remotely verifying E and its baseline tag, which must not be overwritten, use a bookkeeping commit K to record LOCKED and reference the known ancestor SHAs. Push K and confirm its remote SHA in the external Ticket receipt; do not try to embed a commit's own final SHA in itself. Mark a task checked only after all required criteria pass and the exact evidence and baseline are remotely verifiable. Before starting a dependent task, verify its prerequisite baseline is included in the actual working branch; a tag or open PR alone does not prove integration. Reopen or create a change task before modifying locked behavior, preserve old baselines and rerun affected regressions. Use the configured agent commit identity. Preserve existing repository merge and protection rules; do not add an approval gate for routine implementation or push operations, and do not bypass an existing one.

## 团队 Matt 与本轮边界增补

以下正文与上面两段一并保存到团队要求；[workflow.md](workflow.md) 保存便于 worker 阅读的细则：

GT Lifecycle Lab 项目适配（本轮仅保存规则和完成接入准备）：
当前准备请求不是真实开发 Ticket。保存配置、提示词或迁移文档产生的通知不是派工，不得据此创建或触发 Ticket、远程 Issue/PR/标签、提交、推送、上游克隆或应用开发；准备完成后停止。仅在后续用户明确派发真实 Ticket 后执行下文开发约定。保留完整 M0～M4 目标及依赖顺序。
唯一目标 shuyu-lin-dev/gas-turbine-lifecycle-lab；主 checkout /home/lsy/workspace/lab/gas-turbine-lifecycle-lab；Ticket worktree 根 /home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees。maxWorkers=1，一次一个开发任务；不通过额外 Ticket/worker 绕过并发。prepare 分支最后一段保持 DSH_SUPERAGENT_NAME，任务 ID 写入记录与提交信息。
未提交的主 checkout 规则/资产不会自动进入独立 worktree。后续真实 M0-00 worker 在正式规则尚未提交时，先只读主 checkout 的 evidence/M0-00/preparation/20261103T142014+0800/TRANSFER.md，核对基准和清单、应用变更包到自己的独立 worktree，再按根 AGENTS.md 完成范围冻结与真实提交。规则提交并集成后直接读取工作树内正式入口，不依赖原交接包或原包归档。

Matt skills 后续调用约定：
先读根 AGENTS.md、当前 DEV_SPEC/TASKS/ACCEPTANCE、GLOSSARY 与相关已有 ADR、前置证据；确认前置 LOCKED 且实际分支包含成果。GitHub Issues 仅派工关联，TASKS.md 是唯一任务/依赖/锁定状态清单；Issue 关闭/标签不能代替验收。领域文档为 single-context（根 GLOSSARY.md、按需 docs/adr/），triage 使用 docs/agents/triage-labels.md 本地映射。
每个 Ticket 执行计划明确适用 skills。实质歧义用 grill-with-docs（grilling+domain-modeling），已确定要求直接沿用；术语/必要决策用 domain-modeling；模块接口设计参考 codebase-design；新增业务行为用 implement+tdd；缺陷/性能回归用 diagnosing-bugs；候选提交用 code-review。to-spec/to-tickets 只处理授权范围内确需变更的需求，不重新划分现有 27 项任务，不另建完成状态，实质调整保留记录和依赖映射。
以实际 worker 解析到的 skill 文件和版本为准，记录路径/哈希及相对引用文件；不更新全局 skills。实际 dsh 工具为 skill({"name":"名称"})；部分 skill 禁止模型直接调用，授权使用其方法时以文件读取加载实际说明并如实记录，不改禁用标记或假记工具调用。已安装不等于实际调用。详读 docs/agents/workflow.md；每项记录实际采用/文件加载或不适用理由。skills 通用默认服从本项目范围、验收、提交和人工合并要求。

Matt 测试、审查与交付适配：
在 S 冻结测试接口、输入、独立预期、命令、环境、证据与回归范围；既有授权和冻结决定直接沿用，不重复访谈或增设普通开发审批门。新增业务采用失败测试→最小实现→验证的小步 TDD；预期来自冻结规格或独立答案，不照抄实现。上游/文档/环境任务采用合适的来源、构建或实际运行验证，不写形式测试。浏览器、MCP、本地模型、Kafka、流引擎和持久化按阶段真实验证，Mock/上游测试不得替代硬验收。保留既有主动视觉/截图限制，具体必要浏览器操作按冻结范围核实，不以截图替代断言。
缺陷/性能回归先建立能捕捉原始症状的反馈循环，保留失败、原因、修复和回归。code-review 记录固定比较基准、merge-base 与候选 SHA C，覆盖当前任务完整差异，不遗漏未提交改动；规范和规格分别审查。支持子代理时仅作只读并行审查，不新增开发 Ticket/worker；不支持时串行完成两个维度并如实记录。审查/实测后若改应用、测试、依赖或行为配置，形成新 C 并重验受影响条款。
后续每项严格读取前置基线→提交冻结 S→按适用 skills 实现→候选 C→审查和必要实测→失败修复形成新 C 重验→证据 E→远程 E 和不可覆盖的基线标签→状态 K 登记 LOCKED→推送 K 并在外部 Ticket 回执核实 SHA→交付 PR 由用户手动审核合并→确认实际分支包含前置成果再推进。E 只含证据与必要登记，不夹带实现/测试/依赖/行为配置/验收语义变化；E 不填自身最终 SHA，K 不填自身最终 SHA；标签指向 E，旧标签不覆盖，K 仅引用已知祖先及已核实结果。FAIL/BLOCKED/SKIP/NOT_RUN 均阻止验收，TASKS 勾选只表示 LOCKED。改锁定行为先建变更任务或显式 REOPEN，保留旧基线并回归。标签/PR 不证明集成，需要合并时等待用户；Matt 的实现完成并提交后仍必须完成本项目实测、证据、远程验证和集成。skills 更新不得改变已冻结内容。
保留中文沟通、代理 author/committer、披露行、gh-owner 禁令、用户手动审核合并及既有保护，不扩展账号或 Policy 权限。本轮 preparation 不是已提交 S，不勾选 M0-00，不登记 VERIFIED/LOCKED，不虚构 Ticket、SHA、推送或远程验收。

根规则的“沟通、文件与工具”一节也已完整增补至团队 scope。实现和测试使用实际依赖，禁止 Mock；代码使用文件编辑工具修改，成熟格式使用现成解析库，中间文件保存在当前工作目录明确忽略的位置。完整保存正文见本次准备记录中的 dsh-prompts-after.json。


## 后续派工与阶段边界

后续由 allowed 的 shuyu-lin-dev 在唯一目标仓库的新 Issue 或新评论中提及实际 agent lucy-assistant 派工；这里只说明方法，本轮不发布消息。仅编辑旧正文增加 @ 不能视为触发成功。Issue/Ticket 关联仓库任务 ID、当前允许范围和适用 skills，实际新 Ticket、工作树、分支、提交、推送、远程 SHA 与 PR 由真实 worker 留证。飞书只沿用已有连接与当次授权的来源对话，不额外发测试消息。

真实 Ticket 按明确授权范围推进，当前只执行 FE-INTEGRATE；后续任务单独派发，每项分别完成 S→C→E→K，maxWorkers=1。主 checkout 的未提交文档不能作为可继承基线，前置成果必须进入实际工作分支。标签存在、Issue 关闭或 PR 已创建均不能替代合并和回归；当前授权由协调会话执行最终合并与实际集成核查。

FE-BASE/FE-INTEGRATE 在 M0 执行；RAG-BASE/RAG-INTEGRATE 在 M1 执行。仅在对应任务完整取得固定上游并 subtree 导入，保留完整源树、版本、许可证和补丁关系，不启用上游 skills。Vue 同源 /viewer iframe 和真实 RAG 入口 `python -m src.mcp_server.server` 的细则见 [DEV_SPEC.md](../../DEV_SPEC.md) 与 [UPSTREAM_REUSE.md](../UPSTREAM_REUSE.md)。assets/models/source 只是模型导出所需子集；既有 GLB 不能代替完整 viewer、浏览器或业务验收。部署按阶段增加必要角色，API 与前端独立，M0 不运行 RAG。完整 M0～M4 与硬验收全部保留。
