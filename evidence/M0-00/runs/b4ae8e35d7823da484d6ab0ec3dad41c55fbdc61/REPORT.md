# M0-00 验收报告

日期：2026-11-03（Asia/Shanghai）。功能验收及独立审查结果为 VERIFIED；任务的当前状态统一登记于根 [TASKS.md](../../../../TASKS.md)。

## 版本与执行来源

- task_id：M0-00。
- dsh_ticket：`910aedd83224919debc9bc9021d86450`。
- actual_worker：`worker-910aedd83224919debc9bc9021d86450`。
- worktree：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/bootstrap-spec-freeze-910aedd83224`。
- repository：`shuyu-lin-dev/gas-turbine-lifecycle-lab`；remote branch：`agent/bootstrap-spec-freeze-910aedd83224`。
- integrated_base_sha / comparison_base / merge_base：`dad14da1561ac609a5d14076629d1698c53b3627`；无前置任务。
- criteria_commit_S：`3980867902a9c102f18894e9acf65b8c72051b19`。
- tested_code_sha_C：`b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61`。
- 原始派工：Issue #1 / trigger `43b6da81cc692e348a4e29d1e45cc0c9`。
- 协调合并授权：Issue #1 评论 `6597814032` / trigger `9d88e31f73669fd31a07291d2b7e3ab5`。
- 独立审查通过与继续交付：Issue #1 评论 `6598597519` / trigger `14db4841aa518b7346c064dbf9fccb31`。
- PR：#2；开发 worker 交付 PR，协调会话负责最终审查、合并与实际集成核查。

规格采用 S 内完整根规则、DEV_SPEC、TASKS 与 ACCEPTANCE 2.0；完整 M0～M4、27 项任务、145 条必要验收及依赖保留。冻结记录见 [criteria.md](../../criteria.md)，SHA256 `50d7288f78db414505c1245145d794171b2d126cad33294552b163f707f7ba48`；初始环境指纹见 [initial-fingerprints.json](../../initial-fingerprints.json)，SHA256 `21ec5e43c425ed9bad792db5f114cab002f1a34b1a5a2b00f9bdc90fb855df59`。

## 已完成内容

核实既有 dsh、profile、运行状态、操作者与代理身份、唯一仓库、独立 worktree、Windows Docker Desktop Linux 引擎、真实提交与推送；迁入已有规则、领域与协作文档、模型资产及历史准备证据。71 个来源路径逐项核对，其中64个保持字节一致，7份当前执行文档保存正式授权与交付方式；16个模型文件与原 LICENSE 保持来源字节。完整模型哈希及迁入处理见 [迁入回执](../../migration-verification.json)。

范围保持 M0-00；没有实施后续应用、viewer、RAG 或完整上游取得。S 先于候选；当前 E 仅保存原始证据、报告与必要登记。实现、核查脚本、依赖、配置和验收语义保持准确 C。

## 实际命令与环境

Worker 在准确 HEAD=C、干净工作树运行：

```sh
python3 scripts/check_m0_00_failures.py
python3 scripts/verify_m0_00.py --criteria 3980867902a9c102f18894e9acf65b8c72051b19 --candidate b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61 --output .scratch-runtime/m0-00-b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61
```

两个外层命令退出码均为0。完整采集包含43个真实子命令，退出码均为0；[commands.json](commands.json) 保存各命令 argv、cwd、采集时刻、退出码、stdout/stderr 或脱敏投影及输出哈希。其 SHA256 为 `c41a39d9927df25454c12fd96075144936a1ce3556b1d5e82d42a3f15f4333bf`。

协调会话在同一准确候选上独立运行已冻结的 verify_m0_00.py 命令，输出目录使用 `.scratch-runtime/independent-b4ae8e35d782-root/`；外层退出0，43个子命令全部退出0。其原始 [commands.json](independent/commands.json) SHA256 为 `8bd15bad3fead75260ee9884e8e3a8dcd6a3256ecc56c1b5c36ba439a22959ca`。

环境事实：dsh 0.2.1-rc.3 / superagent；实际进程为既有 Node dsh，面板 runtime ready；Python 3.12.3 / PyYAML 6.0.1；GitHub 实际账号 lucy-assistant；Docker client/server 29.5.3、Docker Desktop 4.78.0、Linux、Compose v5.1.4；WSL 2.7.8.0，ubuntu 与 docker-desktop 均 Running、VERSION 2。具体版本、endpoint 与命令分别保存在 [profile.json](profile.json)、[runtime.json](runtime.json)、[docker.json](docker.json)。

## 必要条款与独立结果

固定输入、独立期望、边界与命令接口由 S 冻结；身份、路径、哈希、数量和提交关系要求完全相等，无浮点容差。原 ACCEPTANCE SHA256 为 `6593f43c6605311bec2375f0455b2e42940052a200ecc38f37da1bc93d382bb1`。

| 条款 | 冻结的独立期望 | 实际结果与原始证据 | Worker / 独立复验 |
| --- | --- | --- | --- |
| M0-00-A01 | 读取实际 dsh/profile/面板/状态并记录实际 worker | dsh 版本、superagent 进程与 stateDir、runtime ready、真实 Ticket/session/worktree 一致；runtime.json、profile.json | PASS / PASS |
| M0-00-A02 | 唯一目标、实际 agent 与读写权限，Source/origin 一致 | 实际 lucy-assistant；viewerPermission=WRITE，REST pull/push=true；GitHub Source 与主 origin 均为唯一目标；github.json、configuration.json；真实 push 另见 A07 | PASS / PASS |
| M0-00-A03 | 操作者在既有 allowed list；保留配置与认证 | shuyu-lin-dev 在 allowed list；六个文件及全部 Source/Policy/Eval/Executor/prompts 指纹与 S 相同；未修改设置；preservation.json、configuration.json | PASS / PASS |
| M0-00-A04 | 指定主 checkout 和真实独立 worktree，分支/origin/Ticket 正确 | realpath、Git common dir、worktree list、branch、Ticket/session/directory 相互印证；git.json、runtime.json | PASS / PASS |
| M0-00-A05 | WSL 客户端真实连接 Windows Docker Desktop Linux，两端与 Compose 可用 | 两端29.5.3；Desktop Linux、Name=docker-desktop；默认 socket、WSL2 两发行版与 Compose v5.1.4 均核实；docker.json | PASS / PASS |
| M0-00-A06 | S 先行冻结，Worker/Router scope/delivery 一致，单 worker 生效 | S 严格先于 C，ACCEPTANCE/criteria 与 S 相同；双方实际 prompt revision4；共享约束与当前派工语义一致；running1/queued0/maxWorkers1，唯一 Ticket 为本项；version-check.json、prompts.json、独立 REVIEW.md | PASS / PASS |
| M0-00-A07 | 真实请求、Ticket、代理提交与推送，可远程核对分支和 PR | API 实际来源/actor/session/path 一致；S/C author、committer 为指定代理；真实 push exit0；远程分支及 PR2 head=C；git.json、remote.json、push-C.json、push-C3.json | PASS / PASS |

两套结果均为 required=7、PASS=7、FAIL=0、BLOCKED=0、SKIP=0、NOT_RUN=0。每条具体命令、输入哈希、实际输出、证据 SHA256 与人工语义核对详见 [候选回执](pre-review-report.md)；该回执保留独立审查前的历史身份，当前独立结果以本报告和原始独立记录为准。

Worker 的 [evidence-hashes.json](evidence-hashes.json) SHA256 为 `8716d8a492710b859a81b3b00495602fe2c224b9b2aef47467c466fa90e65432`；独立 [evidence-hashes.json](independent/evidence-hashes.json) SHA256 为 `29f1588eb90f480afce6e208d7f78114c3bba3eb9e2e7083cd0fd7f262e857b8`。两套各12份数据证据均已按清单逐项验证。

Bash 工具进程未提供 DSH_SUPERAGENT_TICKET/NAME/DIR；原事实保存在 runtime.json。身份通过实际 dsh API、进程、Git、路径和现有 gh 包装器核实，未人工设置身份变量。

## Standards 与 Spec 审查

Worker 两个维度均按固定 base→准确 C 完整78文件进行只读审查。Standards reviewer 为 `75b78ce9-696a-47b9-b582-be654b5a962b`，Spec reviewer 为 `2bebcbe5-da9f-433e-92b2-465482366802`。整改后两者均通过，无必要修正；过程与不阻止通过的维护建议保存在候选回执。

协调会话 `01a1a040-ff3b-7f31-977e-71d5bd2d1e61` 另行组织两个全新上下文的独立只读会话：Standards `/root/m000_standards_review`、Spec `/root/m000_spec_review`；结论均 PASS，无阻止通过的问题。完整独立 [REVIEW.md](independent/REVIEW.md) 保留原字节，SHA256 `17957b536a354e7eacbe823183565518a5733f2e0101db507b06b0fd0ed4188e`。该记录包含比较范围、版本、独立运行命令、七条结果与 CI 说明，已与正式继续授权评论核对。

## 失败、修正与回归

原候选 `106bc2590f4a987fa48e7daea47b1d5de03742cb` 的自查发现失败调用记录、失败响应脱敏及 criteria 参数约束问题；修正提交 `4d2b3595138539956645475dbf88b75062ee5660` 保留历史。该候选的真实错误路径回归退出1，原始子命令证据保存于 [previous-failure/commands.json](previous-failure/commands.json)；当前准确 C 修正对工具进程环境的假设，通过真实 API 身份核查并保留环境事实。

当前 C 的 [failure-probes/results.json](failure-probes/results.json) 记录四项 PASS：真实缺少可执行文件、现有 API HTTP404、真实 Docker Compose 文本的 JSON 解析错误、criteria=C 拒绝。预期错误退出分别为 null、22、0（解析阶段异常）、1；外层回归核查退出0。原始命令、失败类型、输出哈希及拒绝错误均保留，无 Mock。既有来源模式和 unified diff 格式检查的修正经过保存在候选回执，历史材料字节保持。

## Skills 与范围审计

实际通过 skill 工具加载 dsh-superagent-github、code-review、diagnosing-bugs，解析路径、哈希、采用方法及其他不适用理由见 criteria.md 和候选回执。diagnosing-bugs 在真实反馈失败后采用原命令复现、环境核实、修正与回归；没有改变冻结语义。协调独立审查采用其实际 code-review 文件加载版本，路径与哈希在原独立记录中保存。子代理只读，没有增加开发 Ticket/worker。

## CI、远程交付与集成

当前 C 的 GitHub check-runs=0、commit statuses=0，combined state 为 pending 且总数0；没有上报 CI 检查，不记作 CI 通过。原始响应为 [ci-check-runs.json](ci-check-runs.json)、[ci-status.json](ci-status.json)。本任务冻结范围没有额外 CI 条款。main 在核实时仍指向原基准，protected=false，原始响应见 [main-protection.json](main-protection.json)；未修改保护规则。

本证据提交登记 VERIFIED。后续使用全新 `baseline/M0-00-b4ae8e35d782` 标签指向证据提交，远程核实后由 K 记录已存在 S/C/E 和标签并登记 LOCKED；K 的最终推送 SHA 通过外部 Issue 回执核实。E 与 K 均不记录各自的最终 SHA。集成状态仍为待协调会话最终审查、合并与实际分支核查；后续 FE-BASE 须单独派发。
