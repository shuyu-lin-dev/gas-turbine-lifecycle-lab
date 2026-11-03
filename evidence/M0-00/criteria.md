# M0-00 范围与验收冻结

日期：2026-11-03（Asia/Shanghai）。条款版本为 ACCEPTANCE.md 2.0，M0-00-A01～A07 共七条；本记录补齐执行方法，保留原条款语义。完整 M0～M4 的 27 项任务、145 条必要验收及依赖保持不变。状态只登记在 TASKS.md。

## 来源与版本

- 来源：GitHub Issue #1，2026-11-03T07:19:04Z，派工 trigger `43b6da81cc692e348a4e29d1e45cc0c9`。
- Ticket：`910aedd83224919debc9bc9021d86450`；worker session：`worker-910aedd83224919debc9bc9021d86450`。
- 分支：`agent/bootstrap-spec-freeze-910aedd83224`；工作树：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/bootstrap-spec-freeze-910aedd83224`。
- 唯一主仓库：`shuyu-lin-dev/gas-turbine-lifecycle-lab`；主 checkout：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab`。
- 集成基准、比较基准、预期 merge-base：`dad14da1561ac609a5d14076629d1698c53b3627`；无 predecessor。
- 合并授权：shuyu-lin-dev 在 Issue #1 评论 `6597814032`（2026-11-03T07:20:33Z，trigger `9d88e31f73669fd31a07291d2b7e3ab5`）明确由协调会话执行最终合并。协调标识 `01a1a040-ff3b-7f31-977e-71d5bd2d1e61`。必要验收、独立审查、S/C/E/K、远程标签与最终 head 核查全部通过后，协调会话合并并核查实际集成；开发 worker 交付 PR，后续任务单独派发。保留保护与必要检查，不执行 approve 或 auto-merge，不调用 gh-owner。

本文件首次提交为 S；S 的完整 SHA 由其后 C 的 TASKS 登记与外部 Issue 回执引用。S 不记录自身最终 SHA。候选 C 必须包含 S；输出报告的 tested_code_sha 必须等于实测 HEAD。C 包含所有资产、核查脚本及依赖声明，证据不得携带未提交的行为变更。E 只保存证据与必要登记；K 只引用已存在 S/C/E 和核实结果，二者不记录自身最终 SHA。

## 允许变更与边界

允许迁入已核对的根规则、完整规格、任务清单、领域与协作文档、已有模型资产及历史准备证据；补齐当前验收、来源与环境核查工具、报告和版本追溯。代码文件经文件编辑工具迁入；二进制 GLB 保持字节一致。主 checkout 保留当前内容。准备记录保持历史身份。

当前任务核实已有 dsh、身份权限、主仓库/独立 worktree、Windows Docker Desktop Linux 引擎和真实接单/推送。应用开发、业务测试、业务脚手架、完整上游取得、viewer、RAG 与后续任务均属于各自后续派工范围。profile、模型、认证、Policy、保护与无关设置保持；本任务预期无需设置修改。必要修改须重新读取 revision、按当前值保存、回读并记录。中间文件仅使用 `.scratch-runtime/`。

## 固定输入与独立预期

输入以用户派工、准备文件、实际 API 和独立环境为来源，不从核查脚本生成预期。迁入前已只读核对全部 71 个运输路径及当前主 checkout：均与 after_sha256 一致。运输校验与功能验收分别报告。

| 固定输入 | SHA256 / 固定值 |
| --- | --- |
| 准备 payload | `07b1295ac3381974bc857d4106120b1f77932f601346058a6ff7c8a818fea03d` |
| 准备 AGENTS.md | `1f2cb141140a6ffdb87d4b299a47f9bb35ef0a907c5558beebd5eb89021622be` |
| 准备 DEV_SPEC.md | `ff4a63adc625e1e5d608f5eae18f22959bdfbd5029d17b141136dc0577c1ee63` |
| 准备 TASKS.md | `484c5945664a9996f02e687b778d510aa460b73da0b3bf8644d349088734f38a` |
| ACCEPTANCE.md 原文 | `6593f43c6605311bec2375f0455b2e42940052a200ecc38f37da1bc93d382bb1` |
| GLB | 13,479,328 bytes；`f650a3b2c080ea76bb5daa9e0f4c7f37f0f5bf7774f2d323e42ef432a00fa316` |
| prepare 历史正文 | `3688da872189a8c2d773a6bc68ca0ff039d21d586e477b41e75eb02edd885ae4` |
| 环境/设置初始指纹 | 同一 S 内的 `initial-fingerprints.json`；每个设置块与 profile 文件逐项 SHA256 |
| 固定主分支基准 | `dad14da1561ac609a5d14076629d1698c53b3627` |
| agent / 操作者 | `lucy-assistant` / `shuyu-lin-dev` |
| Source / Policy / Executor / Prompts 初始 revision | `2 / 1 / 2 / 4` |

独立预期来自 ACCEPTANCE.md 七条原文与用户给定路径、账号、范围。dsh/工具版本读取实际值，准备值作为比较信息；版本变化须说明并重新核实，不伪造预期版本。唯一性、身份、路径、哈希、提交关系和数量要求完全相等；无浮点容差。调用失败、缺少权限、未知配置或无法核实的结果均阻止相应条款通过。服务可用性不以历史准备快照代替。

## 执行接口、命令与逐条判定

环境为当前 WSL Linux、已有 superagent profile、原面板 `http://127.0.0.1:3082`、已认证 worker gh、Git、Python 3.12 与 PyYAML 6.0.1、Windows Docker Desktop。HTTP 仅读取现有面板/API；请求头 `x-orchestrator-request: 1`。本阶段无需视觉工具、截图、浏览器操作或项目服务启动。

统一采集接口为 `python3 scripts/verify_m0_00.py --criteria S --candidate C --output .scratch-runtime/m0-00-C`，其中 S/C 用已存在的完整 SHA 替换。工具通过 subprocess 实际执行下列命令，通过 JSON/YAML 现成库读取输出与配置，只输出脱敏证据，不修改项目代码或宿主配置。每个命令保存 argv、cwd、退出码、stdout/stderr、采集时刻；报告保存每条独立期望、实际结果、输入哈希与证据哈希。失败即时终止并保留已取得的命令证据。

| 条款 | seam / 实际命令或请求 | 独立通过条件与边界 | 证据 |
| --- | --- | --- | --- |
| A01 | `dsh --version`；`GET /orchestrator/api/state`；`GET /orchestrator/api/tickets/<ticket>`；实际 dsh 进程 argv；PyYAML 读取 superagent profile 结构并只输出插件名、stateDir 和哈希 | dsh 可执行；现有面板 runtime ready；profile 与实际进程/状态目录对应；实际 worker session、Ticket 与工作路径相等。版本与 profile 的历史值只供比较 | `commands.json`、`runtime.json`、`profile.json` |
| A02 | `gh api user`；`gh repo view shuyu-lin-dev/gas-turbine-lifecycle-lab --json nameWithOwner,viewerPermission,defaultBranchRef`；`gh api repos/shuyu-lin-dev/gas-turbine-lifecycle-lab`；`GET /orchestrator/api/settings`；`git -C <main> remote -v` | 实际 agent 为 lucy-assistant；远程 owner/repo 精确相等；READ/WRITE 元数据与 pull/push=true；启用的 GitHub Source 与主 origin 均为唯一目标。真实 push 由 A07 单独验证 | `commands.json`、`github.json`、`configuration.json` |
| A03 | 上述 settings、`GET /orchestrator/api/prompts`；对 initial-fingerprints.json 所列 profile/认证包装器文件与设置值进行 SHA256 比较 | shuyu-lin-dev 在已有 GitHub allowed list；配置值/revision 与初始值相等，profile/认证保持；如发生授权配置变更需保存前后 revision、原因与回读结果。凭据与飞书私有标识只在内存使用，公开证据保存哈希 | `configuration.json`、`preservation.json` |
| A04 | `pwd`；`realpath <main> <worktree>`；`git worktree list --porcelain`；`git remote -v`；`git symbolic-ref --short HEAD`；`git rev-parse --show-toplevel`；Ticket 与 settings 请求 | 真实路径在指定 lab 下；主 checkout 的 main 与当前 Ticket worktree 独立；branch 为 agent/bootstrap-spec-freeze-910aedd83224；origin、Ticket、session、Source 绑定完全一致 | `commands.json`、`git.json`、`runtime.json` |
| A05 | `uname -a`；`docker context show`；`docker context inspect`；`docker version --format '{{json .}}'`；`docker info --format '{{json .}}'`；`docker compose version`；`wsl.exe --version`、`wsl.exe --list --verbose`（UTF-16 解码） | WSL 客户端与实际 Server 成功通信，Server OSType=linux、OperatingSystem= Docker Desktop、Name=docker-desktop；版本记录两端；context endpoint 与 WSL 2 docker-desktop 发行版印证；Compose 正常；不启动 dockerd | `commands.json`、`docker.json` |
| A06 | `git show S:ACCEPTANCE.md`；`git show S:evidence/M0-00/criteria.md`；`git merge-base --is-ancestor S C`；`git merge-base <base> C`；`GET /orchestrator/api/prompts`；settings/state/tickets | S 中完整规格/任务/当前验收已提交且先于 C；ACCEPTANCE 字节语义保持；Router 与当前 worker 使用同一 scope/delivery revision 和项目约束，当前派工跟进有效；maxWorkers=1，唯一执行 Ticket 为本项，queued=0。scope/delivery 全文由人工逐项审查，字符串存在检查只作辅助 | `commands.json`、`prompts.json`、`version-check.json`、审查记录 |
| A07 | Ticket 请求；`git show -s --format=fuller C`；`git push -u origin agent/bootstrap-spec-freeze-910aedd83224`；`gh api repos/shuyu-lin-dev/gas-turbine-lifecycle-lab/git/ref/heads/agent/bootstrap-spec-freeze-910aedd83224`；`gh pr view <PR> --repo shuyu-lin-dev/gas-turbine-lifecycle-lab --json number,url,author,headRefName,headRefOid,baseRefName` | 真实请求与 Ticket/worker 对应；S/C author、committer 均为指定代理身份；真实 push 退出 0，远程 branch SHA=C；PR author=lucy-assistant，正确分支/main，head=C。之后 E/K 远程结果分别记录 | `commands.json`、`remote.json`、PR/Issue 回执 |

上传前 `gh api user --jq .login` 和 `gh repo view ... --json nameWithOwner` 复核写入身份。PR 创建前查仓库 PR 模板；实际 CI 通过 checks/read API 读取，零条 CI 记录为没有配置，不能称为 CI 通过。推送与 PR 是已授权验收步骤，不再额外设普通审批门。

## 回归、审查与证据

回归包括：原 LICENSE 字节不变；16 个模型文件与许可逐字节哈希一致；历史 preparation 证据与来源一致；全部 27 项任务/145 条验收的编号、映射、依赖保持；全部后续任务仍 PLANNED；根文件的本次有效授权改动单列；无应用/业务测试/脚手架、vendor、嵌套 .git 或秘密文件；`git diff --check` 通过。历史 `migration-*.diff` 是 unified diff，空白上下文行必须保留前导空格；.gitattributes 仅对这些历史格式文件关闭 blank-at-eol/blank-at-eof 检查，其全部字节另以来源 SHA256 核实。

候选固定比较命令：`git diff dad14da1561ac609a5d14076629d1698c53b3627...C`；提交清单用 `git log <base>..C --oneline`。Standards 和 Spec 分别使用只读子代理审查，覆盖全部差异及未提交状态。候选和证据准备后，在 Issue #1 回执 S/C、比较基准/merge-base、分支、worktree、session、七条结果、命令、证据与哈希；由协调会话组织外部独立审查。收到对应候选的独立审查结果前保持候选准确。任何行为或脚本变化形成新 C 并重验受影响条款。

证据先写 `.scratch-runtime/m0-00-C/`，供独立审查读取；独立审查通过且七条全部 PASS 后，复制脱敏证据到 `evidence/M0-00/runs/C/`，形成 E 并登记 VERIFIED。必要 FAIL/BLOCKED/SKIP/NOT_RUN 阻止验收。E 验证后创建全新且不覆盖的 `baseline/M0-00-<C前12位>` 标签，指向 E；推送并核实标签及远程 E 后，以 K 登记 LOCKED。K 推送完整 SHA 在 Issue 外部回执核对。当前任务交付后等待协调会话合并、集成核查及后续单独派工。

## Skills 计划

- dsh-superagent-github：已调用 skill 工具；实际加载路径 `/mnt/e/DSH_SuperAgent/dsh-superagent-prototype/skills/dsh-superagent-github/SKILL.md`，SHA256 `7907778f735550f642b7e3d511007be9ae67d29965aa17ac50119a0eeeb8e54b`；用于来源、身份与 GitHub 回执。
- code-review：候选阶段调用 skill 工具；已核对 `/home/lsy/.dsh/skills/code-review/SKILL.md`，SHA256 `9c921a8d88138a41401d8897ca1bb852088ab1b7b605cdd04edc13e3e8aab6dd`；该说明无本步骤必须加载的相对引用，采用固定比较与 Standards/Spec 只读并行审查。
- 现有领域、术语与初始化配置直接迁入，无新增术语、ADR 或模块接口；domain-modeling、setup、codebase-design 不新增调用。
- 需求、27 项任务与依赖已有明确授权，grill-with-docs、grilling、to-spec、to-tickets、triage 不适用。
- 当前属于来源、Git、环境、配置和资产运输核查；无新增业务或缺陷修复，implement、tdd、diagnosing-bugs 不适用。核查脚本服务于实际验收，预期来自冻结规格与固定哈希。
- 本任务来源为 GitHub，dsh-superagent-feishu 不适用；无飞书发送授权。
