# M0-00 独立审查前回执

日期：2026-11-03（Asia/Shanghai）。本报告供协调会话组织独立审查；当前准确候选完成七条功能核查与 Standards/Spec 自查。任务状态仍为 TASKS.md 中的 VERIFYING；独立审查、E、远程基线标签与 K 尚待完成。

## 固定版本与来源

- 来源：Issue #1，trigger `43b6da81cc692e348a4e29d1e45cc0c9`；后续合并授权评论 `6597814032`，trigger `9d88e31f73669fd31a07291d2b7e3ab5`。
- Ticket：`910aedd83224919debc9bc9021d86450`；worker session：`worker-910aedd83224919debc9bc9021d86450`。
- worktree：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/bootstrap-spec-freeze-910aedd83224`。
- remote branch：`agent/bootstrap-spec-freeze-910aedd83224`；origin：`https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git`。
- 集成基准、比较基准、实际 merge-base：`dad14da1561ac609a5d14076629d1698c53b3627`；无 predecessor。
- S：`3980867902a9c102f18894e9acf65b8c72051b19`。
- 最终候选 C / 当前远程 head：`b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61`。
- draft PR：#2，`https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab/pull/2`。
- root AGENTS 2.1；ACCEPTANCE 2.0 原文 SHA256 `6593f43c6605311bec2375f0455b2e42940052a200ecc38f37da1bc93d382bb1`。criteria.md SHA256 `50d7288f78db414505c1245145d794171b2d126cad33294552b163f707f7ba48`；initial-fingerprints.json SHA256 `21ec5e43c425ed9bad792db5f114cab002f1a34b1a5a2b00f9bdc90fb855df59`。

## 实际命令与原始证据

以下命令已经执行，工作目录均为上述 worktree：

```sh
python3 scripts/check_m0_00_failures.py
python3 scripts/verify_m0_00.py --criteria 3980867902a9c102f18894e9acf65b8c72051b19 --candidate b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61 --output .scratch-runtime/m0-00-b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61
git push origin agent/bootstrap-spec-freeze-910aedd83224
gh pr view 2 --repo shuyu-lin-dev/gas-turbine-lifecycle-lab --json number,url,title,body,author,headRefName,headRefOid,baseRefName,isDraft,reviewDecision,statusCheckRollup
```

四个外层命令退出码均为 0。完整采集记录包含 43 个实际子命令，退出码均为 0，逐个保存 argv、cwd、时间、退出码、输出或脱敏投影、输出哈希。采集目录为 `.scratch-runtime/m0-00-b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/`；`commands.json` SHA256 `c41a39d9927df25454c12fd96075144936a1ce3556b1d5e82d42a3f15f4333bf`；`evidence-hashes.json` SHA256 `8716d8a492710b859a81b3b00495602fe2c224b9b2aef47467c466fa90e65432`。哈希清单列出其余 11 份采集证据。

失败路径回归目录为 `.scratch-runtime/failure-probes-b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/`。四条真实检查：缺少可执行文件，记录 FileNotFoundError / exit_code=null；现有 API 的 HTTP 404，curl exit=22；真实 Docker Compose 文本按 JSON 读取时记录 JSONDecodeError / 子命令 exit=0；传入 criteria=C，采集程序 exit=1 并明确拒绝。四项预期错误均被捕捉，核查结果 PASS。未使用 Mock。

## 七条必要验收

各条固定输入为 S、原 ACCEPTANCE、实际只读 CLI/API 和指定目标。输入身份/路径/哈希/数量/提交关系完全相等，无浮点容差。下表引用上述采集目录内证据，具体 argv 与退出码见 commands.json。

| 条款 | 独立期望 | 实际结果 | 结论与证据 |
| --- | --- | --- | --- |
| M0-00-A01 | 读取本机实际 dsh/profile/面板/运行状态，记录真实 worker | dsh 0.2.1-rc.3；实际 Node 进程使用 superagent profile；状态目录 /home/lsy/.dsh/state/gas-turbine-lifecycle-lab；runtime ready；API Ticket/session/worktree 与派工一致 | PASS；runtime.json、profile.json；hash 分别 `783b7f3e43f2f7d290fbaec71983216507d4c40e8b88b5f4b649f24239850cad`、`08e44f56e691f6cc44a854b34fe4804fa347ee8605fdb6ded522377b33dcc69e` |
| M0-00-A02 | 唯一仓库、实际 agent、读取/push 权限，Source/origin 一致 | gh 登录 lucy-assistant；目标 owner/repo 精确一致；viewerPermission=WRITE，REST pull/push=true；GitHub Source 与主 origin 一致；真实推送见 A07 | PASS；github.json、configuration.json；hash `41fc922a8606c2bdea32bdc5ecae1e1c3e173e3b8dd8d03879fc7621cbe51126`、`ea2dfdd5596b0077b6ac9cd01d222a2e6349389117dde399ff942da4997b47e4` |
| M0-00-A03 | 操作者在既有 allowed list；profile/认证/无关设置保持；必要修改需 revision 与回读 | shuyu-lin-dev 在 allowed list；六个配置/认证文件哈希均与 S 指纹相同；Source、Policy、Eval、Executor 和 prompts 值/ revision 保持；本任务没有修改设置 | PASS；preservation.json、configuration.json；preservation hash `69b0d7ad8523dbc5b86d0f2490a970ba9e9eb396cc633a191662cf2d6a464689` |
| M0-00-A04 | 主 checkout 与真实独立 worktree 位于指定 lab，分支/origin/Ticket 正确，Source 唯一 | realpath、pwd、common Git dir 与 worktree list 互相印证；主分支 main，Ticket 分支 agent/bootstrap-spec-freeze-910aedd83224；实际 Ticket/session/path 和目标相等 | PASS；git.json、runtime.json；git hash `6d2f5d02ad84c75380e83af191dcf681dfe412eeb275613b61182534e3eee3fd` |
| M0-00-A05 | WSL Docker 客户端实际连接 Windows Docker Desktop Linux，引擎两端版本与 Compose 可用 | client/server=29.5.3；Desktop 4.78.0 (229452)，OSType linux，Name docker-desktop；默认 socket unix:///var/run/docker.sock；WSL 2.7.8.0，ubuntu 和 docker-desktop 均 Running、VERSION 2；Compose v5.1.4 | PASS；docker.json；hash `617169f0404d36623a12f315e7ce08614e78dbe67eac52b3e922152e33b41ae3` |
| M0-00-A06 | 规格/任务/当前验收先提交 S；Worker/Router scope/delivery 一致；单 worker 生效 | S 包含根规格/任务/七条完整冻结；S 为 C 的严格祖先；ACCEPTANCE/criteria 与 S 相同；Router 和 worker 实际均 revision=4；人工逐项核对共享项目约束与当前派工；running=1、queued=0、maxWorkers=1，唯一 Ticket 为本项 | PASS；version-check.json、prompts.json、人工语义核对记录；hash `22466b6f0129cd7ebe6d7f4984f577fb5317b03638c8fa6ce7c5ce767e343d3a`、`e4db8013e840f68b635a2fe5d074e97efccebf05d0387d55317fedbbb958efc9` |
| M0-00-A07 | 真实请求形成 Ticket，由真实 agent 提交并推送正确仓库，可核对分支/PR | API 真实 Ticket 的来源/actor/session/path 正确；S/C author 和 committer 均为指定 lucy-assistant 身份；真实 push exit=0；远程分支及 PR #2 head 均为准确 C，author lucy-assistant，base main | PASS；remote.json、git.json、push-C.log、push-C3.log；remote hash `e0df34183e094972e483a4e88ed7936183bc4ac0058471a353dc1cc6f81cca47` |

功能条款计数：required=7、PASS=7、FAIL=0、BLOCKED=0、SKIP=0、NOT_RUN=0。本表为准确 C 的功能核查结果；独立审查与远程锁定交付尚待完成，TASKS 继续 VERIFYING。

Bash 工具进程的 DSH_SUPERAGENT_TICKET/NAME/DIR 实际均为 null，原始事实保存在 runtime.json；身份由 dsh 的真实 Ticket、session、directory、Git worktree/branch 与实际 gh 账号核实。没有手动伪造环境变量。

## 人工语义核对与回归

读取共享 scope/delivery 全文，确认双方实际 revision=4，执行约束包括唯一目标、maxWorkers=1、一次一个任务、TASKS 唯一状态、冻结先行、S→C→E→K、真实依赖与验收、保留旧基线、代理身份与 gh-owner 禁令。原始正式派工只授权 M0-00，评论 6597814032 指定协调会话负责最终合并；这些当前来源要求由实际 Ticket 继续接收，根有效说明与冻结记录已保存。worker 保持 PR 交付职责，协调会话在全部必要条件通过后合并；本任务没有修改共享配置。

对照来源与候选：71 个原始路径全部核对；64 个保持字节相同，7 份当前执行文档按正式授权更新。16 个模型文件与来源哈希一致；根 LICENSE 保持原字节；全部历史 preparation 字节保持。原 ACCEPTANCE 固定哈希保证 145 条必要验收未改变；原任务映射登记 27 项，原 TASKS 到 S 只改变 M0-00 状态/记录，S 到 C 也只改变该行，其余26项仍 PLANNED，全部依赖保持。根 GLOSSARY/领域约定与原值相同，无相关既有 ADR。没有应用/业务测试/脚手架、完整上游取得、vendor 或服务启动；源码迁入只保留已有资产子集。完整比较及工作树 `git diff --check` 通过；唯一格式声明针对历史 unified diff 的上下文空行，历史字节由哈希核实。

## Standards

只读 reviewer `75b78ce9-696a-47b9-b582-be654b5a962b`。完整基准到准确 C 的78文件复核通过，无必要修正。原候选的失败响应脱敏、异常调用记录两项缺口已在新 C 修正，四条真实错误路径回归验证。一个 possible Duplicated Code 属于维护建议：单次 ps 采集过滤与结果使用保持同一表达式；无正确性影响，当前保留。

## Spec

只读 reviewer `2bebcbe5-da9f-433e-92b2-465482366802`。完整基准到准确 C 复核通过。原候选允许错误 criteria 参数的问题已固定准确 S、拒绝 S=C 并比较冻结正文，真实拒绝回归通过；无确定遗漏或越界业务。该结论不代替协调会话独立审查。

## 失败、修正与实际 skills

- 冻结前格式检查曾 exit=2：历史 unified diff 的上下文空行被当作尾随空格。保留原字节，并在 S 中明确该格式的属性和 SHA256 核查方法；随后格式检查 exit=0。
- 材料回执初次核对在 .gitignore 模式上终止：文件编辑工具创建模式为600，运输声明为644。调整本工作树公开文件模式并重新核对71项，结果通过；主 checkout 保留。
- 原 C=106bc2590f4a987fa48e7daea47b1d5de03742cb 的自查发现脱敏/失败记录/criteria校验缺口。整改形成4d2b3595138539956645475dbf88b75062ee5660；真实失败路径核查 exit=1，反馈定位到工具进程未提供 DSH_*。保留 `.scratch-runtime/failure-probes-4d2b3595138539956645475dbf88b75062ee5660/commands.json` 与诊断命令输出。当前 C 改为核实真实 API 身份并保存环境事实；四条回归与完整43命令采集均通过。
- dsh-superagent-github 与 code-review 实际通过 skill 工具加载，路径/哈希见 S。两名子代理只作只读审查，没有新增开发 Ticket/worker。
- diagnosing-bugs 在真实环境断言失败后实际通过 skill 工具加载，路径 `/home/lsy/.dsh/skills/diagnosing-bugs/SKILL.md`，SHA256 `849198df88cdb65fd0d97236604c1fca7ff2f22d2f705f9724a800d0266b118d`。采用实际失败命令→最小复现→核实缺失变量→修正→原路径与完整回归；明确的 KeyError 与工具进程 env 读取已直接确定原因，省去多假说和额外插桩。未改变冻结验收语义，未采用 Mock。无新增相关领域概念或 ADR，领域文档已读取。其余计划不适用理由沿用 S。

## CI、保护与剩余交付

GitHub 当前 C 的 statusCheckRollup=[]，check-runs.total_count=0，combined status 为 pending 且 statuses=[]/total_count=0；记录为没有上报 CI 检查，不能称 CI 已通过。main 当前仍为原基准，protected=false；本任务没有更改保护或规则。PR 当前 isDraft=true，尚无 reviewDecision。

待协调会话组织独立审查并返回对应 C 的结果。通过后形成仅证据与必要登记的 E、不可覆盖的 baseline/M0-00-b4ae8e35d782 标签、远程核实、K 与其外部推送回执，再完成 PR 正式交付。当前不创建 E/标签/K，不登记 VERIFIED/LOCKED，不推进后续任务。
