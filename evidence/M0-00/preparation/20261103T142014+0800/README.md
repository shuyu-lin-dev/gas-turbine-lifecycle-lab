# M0-00 本机接入准备记录

记录标识：20261103T142014+0800。日期：2026-11-03；人类可读时间使用 Asia/Shanghai（UTC+08:00），API 原始带 Z 时间保留 UTC 标记。本文是准备记录，不是正式 worker 验收报告，不是已提交的冻结 S，也不构成 VERIFIED/LOCKED。规范任务状态只查 [TASKS.md](../../../../TASKS.md)。

## 实际工作与身份

本轮整理文档、迁移已有资产、安全接续远程历史、配置已有 dsh 并准备一次性 worker 变更包。没有创建/触发真实 Ticket，没有编写应用或测试代码、生成业务骨架、取得两套完整上游、实现 viewer、导入/运行 RAG；没有项目提交、推送、远程 Issue/PR/标签或外部消息。

| 项目 | 观察与结果 |
| --- | --- |
| 操作者身份 | 连接 GitHub 账号 shuyu-lin-dev，目标仓库 permissions.admin=true；在已有 GitHub allowed list 中 |
| Agent 身份 | 现有 Source CLI 为 /home/lsy/.local/bin/gh-agent-bot；通过其 worker shim 实际读取账号 lucy-assistant |
| 读取/写入元数据 | worker gh repo view 为 WRITE，REST pull=true、push=true；这不等于实际 push 成功 |
| Git 身份 | 本仓库 local user.name/email/useConfigOnly 已设置；隔离 worker Git 环境的 author/committer IDENT 均为 lucy-assistant / 162398512+lucy-assistant@users.noreply.github.com；本轮没有新提交 |
| 普通 gh | 宿主裸 gh 未登录（退出 4）；未切换/新增认证，实际 worker 使用已认证 shim；操作者身份由连接单独核实 |
| 飞书 | 既有 bot superagent，Source 监听 ready，未发送测试消息；个人/群标识在公开快照中散列脱敏 |
| 主目录/真实路径 | /home/lsy/workspace/lab/gas-turbine-lifecycle-lab |
| Git 初始现场 | 只有未跟踪的原交接包，没有有效 Git 历史、暂存区或本地提交；先记录全清单并备份 |
| 既有远程 | https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git，默认 main；基准 dad14da1561ac609a5d14076629d1698c53b3627 |
| 安全接续 | 当前目录 git init 后 fetch 并安全 switch 到既有 main，跟踪 origin/main；既有 README 适配为正式入口，LICENSE 字节不变；未创建孤立提交、覆盖 .git、强制推送或清理用户文件 |
| 本地/远程差异 | HEAD 与 origin/main 相同，0/0；原仓库只有 README.md 与 LICENSE，已保存其原字节哈希及只读历史证据 |
| 远程保护观察 | main 的 protected=false，当前 branch rules 读取为空列表；未修改任何保护或权限，项目仍要求人工审核合并 |
| 用户内容保全 | 原包 25 个文件完整归档；原 SHA 清单以外无额外用户文件；没有另行混入既有用户变更 |

身份与远程元数据见 [identities.json](identities.json)；真实命令、输出、退出码和连接检查见 [commands.json](commands.json)。无法启动进程的命令保留 exit_code=null 和实际 ENOENT。

## dsh 安装、保存与回读

保留已有 dsh 0.2.1-rc.3、superagent profile、模型、认证、中文沟通、代理提交身份、人工合并和 gh-owner 禁令。既有插件为 link 安装 dsh-superagent 0.1.0，源码 HEAD `6337fc823ce20251c8de8085948165c81aaa701e`；已有 `scripts/dsh-superagent` 用户修改未触碰。安装产物/实际 API 实现的哈希见 [installed-components.json](installed-components.json)。

| 配置 | 修改前 | 保存回读 |
| --- | --- | --- |
| GitHub Source | revision 2，唯一目标仓库已正确 | 值与 revision 2 均保持 |
| Policy | revision 1，现有 allowed/admission/rules | 值与 revision 1 均保持；不放宽 |
| Eval | revision 0，observe | 值与 revision 0 均保持 |
| Executor | revision 1，maxWorkers=3，旧 /mnt/e directory/prepare | revision 2，maxWorkers=1，新 WSL worktree 根和 prepare；model=null 与 blockedCommands=[gh-owner] 保持 |
| Prompts | revision 2，现有中文 scope/delivery 等 | revision 4，保留原内容，完整增补两段交接正文、Matt 约定及根规则中的文件操作要求；communication 与 skills 原值保持 |

实际管理地址为 http://127.0.0.1:3082/orchestrator/api/，请求头 x-orchestrator-request: 1。每次修改先 GET 最新配置与 revision，PUT 完整块/config，再回读比较。未发生 409 或 restarting，不曾连发旧 revision。修改前 open/running/queued 均为 0；保存后仍为空。没有取消 Ticket、终止 worker、暂停/重置实例或变更 Source 认证。

prompts 返回 effect=next-request、context_delivery=injected；这是内部配置通知。回读时现有 Router Session 最后使用 revision 2，新 revision 4 在下一次模型请求使用。没有真实 worker，因此不声称 worker 已读取规则、Router 已用新版本完成推理或正式接入验收通过。

完整 prepare 见 [prepare.sh](prepare.sh)，SHA256 `3688da872189a8c2d773a6bc68ca0ff039d21d586e477b41e75eb02edd885ae4`，与 API 回读逐字一致，`sh -n` 退出 0。主目录为上表路径，worktree 根 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees` 已建立。该命令从可核实提交创建 `agent/$DSH_SUPERAGENT_NAME` 独立 worktree；不替换框架分支命名，不复制主目录未提交内容。本轮没有实际执行 prepare 或建立 Ticket 工作树。

脱敏前后快照与差异分别见 [dsh-settings-before.json](dsh-settings-before.json)、[dsh-settings-after.json](dsh-settings-after.json)、[configuration-diff.json](configuration-diff.json)、[dsh-save-events.json](dsh-save-events.json)、[dsh-prompts-before.json](dsh-prompts-before.json)、[dsh-prompts-after.json](dsh-prompts-after.json)。完整秘密配置与一致性 SQLite 备份仅存仓库外归档的 private/，目录权限 700、文件 600。profile 的配置值和全部 50 个 skill 文件保持一致；执行期间观察到的 profile 文本格式差异登记在 [配置保全记录](preserved-host-configuration.json)，当前文件完整保留。

## 迁移、资产与 Matt 初始化

原包 SHA256SUMS.txt 的 24 个条目全部匹配，另有清单自身，共 25 个文件。保留 [原清单](original-SHA256SUMS.txt)、[校验命令输出](original-sha256-check.json)、[初始完整清单](initial-workspace-inventory.json)、[逐文件映射和新旧哈希](migration-map.json)、[归档记录](archive-record.json)。适配的五份文档各有 migration-*.diff，原清单未被重写。原包退出的实际时刻与位置见 [HANDOFF_EXIT.json](HANDOFF_EXIT.json)。

16 个模型相关文件全部字节一致，包括 13,479,328 字节 GLB、映射、离线检查、导出脚本/源码子集、锁文件、README、作者 MIT、Three.js 许可和第三方声明。GLB SHA256 为 `f650a3b2c080ea76bb5daa9e0f4c7f37f0f5bf7774f2d323e42ef432a00fa316`。没有运行导出或应用构建，也没有把静态检查算作 viewer、浏览器或业务 PASS。

TASKS.md 与 ACCEPTANCE.md 从 v2 迁入后字节相同；机械核对 27 项任务、145 条必要验收，ID 唯一、编号连续、依赖无悬空、范围完整且无孤立条款。映射见 [task-acceptance-mapping.json](task-acceptance-mapping.json)，仅是迁移一致性快照，不另建任务状态。固定上游 SHA、完整 M0～M4、架构约束及 S→C→E→K 均保留。

Matt setup 已按预选项写入根 AGENTS.md 和 docs/agents/：GitHub Issues、single-context、实际 triage 安装对应的五角色本地映射。已确认术语写入根 GLOSSARY.md；没有必要的新 ADR，未建空目录。远程只读检测到 wontfix 已有，其余四个默认状态标签未创建。实际 worker 的 12 个相关 skills 及其共 50 个文件有 [哈希清单](worker-skills-manifest.json)；[调用审计](skill-invocation-audit.json) 区分工具可调用与文件加载，未安装/更新全局 skills。setup 的 Codex 参考文件与 worker 文件哈希相同。

已保存需求歧义、领域建模、接口设计、implement+tdd、缺陷诊断、规范/规格两个维度的审查、仅按需 to-spec/to-tickets，以及冻结、实测、远程基线、K 回执和人工集成要求。已授权/已冻结的决定不反复访谈，已有 27 项任务不重新划分。上游/文档/环境任务采用对应核实，不生成形式测试。

## WSL、Docker 与工具

| 检查 | 实际结果 |
| --- | --- |
| WSL/系统 | WSL 2.7.8.0；ubuntu 与 docker-desktop 均 Running、VERSION 2；Ubuntu 24.04.5 LTS |
| 内核/Windows | 6.18.33.1-microsoft-standard-WSL2；wsl.exe 报 Windows 10.0.22631.2861 |
| Docker context/endpoint | default / unix:///var/run/docker.sock；DOCKER_HOST、DOCKER_CONTEXT 无环境覆盖；未切换 context |
| Docker client/server | 29.5.3 / 29.5.3；Server 明确 Docker Desktop 4.78.0 (229452)，linux/amd64；info 名称 docker-desktop、OperatingSystem Docker Desktop，WSL2 内核；与运行中的 docker-desktop WSL 2 发行版相互印证 |
| Compose | Docker Compose v5.1.4，可执行；没有启动容器/项目服务或另起 dockerd |
| Git/gh | Git 2.43.0；gh 2.103.3 |
| Node/包管理 | Node v24.22.2；npm 11.19.1；pnpm 11.7.0；未安装项目依赖 |
| Python | Python 3.12.3；venv 模块存在；pip/ensurepip 模块缺失，uv 命令不存在；没有为报告安装工具 |
| Git LFS | git lfs version 退出 128，当前不可执行；尚未确定后续上游是否需要，不自动安装或改全局过滤器 |
| 实际资源 | WSL/Docker 可见内存 14,655,565,824 bytes、12 CPU；GPU NVIDIA GeForce RTX 4060，8188 MiB，driver 621.01；仅设备识别，不是推理或性能验收 |

输出与退出码见 [commands.json](commands.json)、[wsl-decoded.json](wsl-decoded.json)、[environment-focused.json](environment-focused.json)。Windows 命令输出按 UTF-16 解码，保留版本与退出码。本地模型、MCP、Kafka、流引擎、viewer/浏览器和性能测试按后续任务执行。

宿主 GitHub CLI 的最终只读检查出现间歇性 EOF/TLS 连接终止，命令、退出码和输出保存在 [远程复核记录](remote-final-verification.json)。2026-11-03 14:54:50 Asia/Shanghai，通过操作者的现有 GitHub 连接读取 main 引用，仍为既有基准 dad14da1561ac609a5d14076629d1698c53b3627。agent CLI 的身份与权限来自此前独立检查；实际 worker 的网络、推送和远程交付仍需真实 Ticket 验证。

## 后续交接与待验证项

[TRANSFER.md](TRANSFER.md) 说明本轮新增、修改、删除的完整清单与 SHA256、变更包位置、在正确基准应用的方法、用户内容保全和禁止自动提交。运输副本位于本目录明确忽略的 transfer/；接收方验证后仅将清单中的正式文件纳入自己的工作树。包的运输校验信息不是 S/C/E/K，正式提交后不再依赖运输副本。

正式 M0-00 仍需真实 Ticket、独立 worktree、真实 worker 的 S、候选、提交/推送与远程验证。尤其 A04 的实际 worker 工作树、A06 的规格提交 S 与新 prompt 实际使用、A07 的接单/提交/推送均未在本轮执行。权限元数据不能替代实际 push；准备检查不能补记 PASS。Python 包管理/ensurepip 与 Git LFS 可执行性缺项留待所属任务处理。本轮不推进 FE-BASE 或任何应用开发。

最终检查见 [final-checks.json](final-checks.json)，准备状态与后续验收要求见 [FINAL_STATUS.json](FINAL_STATUS.json)。文档、任务、资产和准备命令的一致性检查见 [validation.json](validation.json)；离线恢复验证目录的归档位置见 [validation-archive.json](validation-archive.json)。变更包的全部操作、前后 SHA256 和运输校验记录位于 transfer/manifest.json、transfer/SHA256SUMS.txt 与 transfer/verification.json。
