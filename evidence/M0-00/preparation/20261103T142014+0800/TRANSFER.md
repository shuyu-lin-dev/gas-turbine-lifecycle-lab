# 供后续真实 worker 使用的未提交变更包

本轮没有项目提交。本机主 checkout 的文档/资产不会自动出现在 prepare 建立的独立 worktree。此交接包只包含本轮获授权的文档、既有模型资产及脱敏准备证据，不包含 Git 元数据、秘密配置、原交接包、应用脚手架或既有无关用户变更。

## 位置、基准与清单

- 主 checkout：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab`。
- 正确唯一仓库：`shuyu-lin-dev/gas-turbine-lifecycle-lab`。
- 打包基准：既有 main 提交 `dad14da1561ac609a5d14076629d1698c53b3627`；不是本轮新建的提交。
- 运输目录：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab/evidence/M0-00/preparation/20261103T142014+0800/transfer/`。
- 运输文件：`payload.tar.gz`、`manifest.json`、`receipt.json`、`apply.py`、`SHA256SUMS.txt`、`verification.json`。
- [TRANSFER_RECEIPT.json](TRANSFER_RECEIPT.json) 保存 payload 的最终 SHA256、清单计数及范围；完整操作/前后 SHA256 在运输 manifest.json 中。

manifest 枚举每个 ADD/MODIFY/DELETE，含模式、来源、前后字节 SHA256；基准没有的文件用 ADD，已有 README 为 MODIFY。本轮原包从未被 Git 跟踪，因此没有待提交的原包 tracked deletion；其 25 个文件的本机退出单独登记 HANDOFF_EXIT.json，不虚构 Git 删除。原 LICENSE 不变，不列入修改。发现既有用户修改时应单列保全；本轮初始清单中没有此类额外文件。

payload 保存除最终运输回执外的正式文件；回执 receipt.json 作为明确的 ADD sidecar 应用，避免要求压缩包在自身内容中包含自己的最终哈希。manifest/checksums/apply/verification 是运输控制文件，不属于项目待提交变更，也不嵌入 Git。整个 transfer/ 被精确路径忽略，周围正式证据仍可见。

## 接收与核对

仅在用户后续明确派发真实 Ticket 后执行。worker 先只读主 checkout 的根 AGENTS.md 和本文件，核对其自身工作目录确为 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/$DSH_SUPERAGENT_NAME`，分支为 `agent/$DSH_SUPERAGENT_NAME`、origin 正确。不要直接在主 checkout 实施开发或提交。

在自己的工作树内使用 `.scratch-runtime/transfer-20261103T142014+0800/` 存运输副本，沿用既有禁止读写 /tmp 的 worker 要求。先确认该目录不存在；复制运输目录完整内容，不覆盖已存在的用户文件。以下命令用于已由真实 prepare 建立的工作树，不会创建 Ticket、分支、提交或推送：

```sh
set -eu
test ! -e .scratch-runtime/transfer-20261103T142014+0800
mkdir -p .scratch-runtime
cp -a /home/lsy/workspace/lab/gas-turbine-lifecycle-lab/evidence/M0-00/preparation/20261103T142014+0800/transfer .scratch-runtime/transfer-20261103T142014+0800
(cd .scratch-runtime/transfer-20261103T142014+0800 && sha256sum --check SHA256SUMS.txt)
python3 .scratch-runtime/transfer-20261103T142014+0800/apply.py --target "$PWD" --check
python3 .scratch-runtime/transfer-20261103T142014+0800/apply.py --target "$PWD" --apply
git status --short
git diff --check
```

apply.py 的默认模式为只核对。它验证唯一 origin、主仓库/worktree 关系、工作树分支、基准祖先、空暂存区、完整 payload/sidecar 哈希，以及每个将改动路径的预期前态。ADD 遇已有同字节可核对重入；任何其他冲突、未提交用户改动或不同的基准内容都在写入前阻止，不使用强制覆盖/清理。正式来源文件与未跟踪用户文件都须保全。写入只涉及 manifest 路径，不运行应用、不改配置、不 stage/commit/push。

若 main 已有后续提交，先核实当前分支包含必要前置成果；程序仍要求原基准是祖先且每个路径前态相符，不能用旧包回滚新规则。已经纳入已提交基线的相同文件无需再次应用；内容发生后续演进时，保留两边内容，按 manifest 和来源记录人工合并或重新生成包。应用报告只能说明文档迁入，不证明 M0-00 验收通过。

## 应用后

从自己的工作树重新读取根规则、TASKS/ACCEPTANCE、docs/agents、领域文档及前置证据，检查全部新增/修改/删除与清单一致，模型/许可哈希一致，原 LICENSE 保留。实际准备检查采用来源、Git、环境和配置核实，不添加形式业务测试。补齐 M0-00 的实际测试步骤、输入、独立期望、环境与证据要求，再由真实 worker 按项目规则提交 S；本轮准备材料没有资格替代它。

后续的候选、真实验收、E、远程基线、K 回执及人工合并按 AGENTS.md / docs/agents/workflow.md 执行。不得把本机准备、包校验或离线恢复比较记为真实 worker 接入、推送或 LOCKED。正式规则提交并集成后，使用普通仓库入口；不依赖原包归档或本运输目录。
