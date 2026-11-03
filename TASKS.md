# GT Lifecycle Lab 可追溯任务清单

版本：2.0；日期：2026-11-03（Asia/Shanghai）。本轮修订为 **27 项任务、145 条必要验收**。所有任务初始 PLANNED，所有条款初始 NOT_RUN；本项目没有因上游已有功能或历史模型检查而自动通过的任务。

## 推进与锁定

- 一次一个任务，严格按下面顺序。前项功能通过、完成 S→C→E→K 交付门且实际集成基线可用后，再进入下一项。
- 每项代码开始前，先冻结范围、条款、固定输入、独立预期、实际命令与证据要求，提交为 S。命令和必需条件缺失时不能 READY。
- 功能必要项全部 PASS 才 VERIFIED；远程证据、基线标签与 K 状态登记完成后才 LOCKED。任务 `[x]` 仅表示 LOCKED；FAIL、SKIP、BLOCKED、NOT_RUN 均不能勾选。
- E 记录被测 C；基线标签指向 E。K 只引用已存在的 S/C/E 等祖先；K 的推送结果在外部 Ticket 回执核对，避免提交自引用。
- 两个上游通过 Git subtree 进入一个主仓库，dsh 只绑定主仓库。FE-BASE/RAG-BASE 是基线任务，不能代替 Vue/数据/业务 Agent 的集成验收，也不能继承上游任务勾选。
- 原 GLB 是可交换资产；运行主路径是 Vue 业务壳与同源 /viewer iframe 中的完整源程序。首版 RAG 使用 Chroma+BM25 和已有 Ollama provider，Milvus Lite 不作为必需工作。

## M0 实时监测主线

| 完成 | 任务 ID | 交付结果 | 依赖 | 初始状态 | 验收条款 | 测试提交 / 证据 / 基线 |
|---|---|---|---|---|---|---|
| [x] | M0-00 | 本机、主仓库、dsh 接入与规格冻结 | 无 | LOCKED | M0-00-A01～M0-00-A07 | S=`3980867902a9c102f18894e9acf65b8c72051b19`；C=`b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61`；E=`398b923f01eb97bcf7c22e9e31f344662c2365c5`；[正式报告](evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/REPORT.md)；基线 `baseline/M0-00-b4ae8e35d782` 已远程核实 |
| [x] | FE-BASE | 固定前端上游源码与独立基线 | M0-00 | LOCKED | FE-BASE-A01～FE-BASE-A05 | S=`7704387252b293bee1ec671b440164a12287ca16`；C=`ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f`；E=`a7966085071051d07cb7e80d0843a07ad9687183`；[正式报告](evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/REPORT.md)；基线 `baseline/FE-BASE-ab07372aa223` 已远程核实 |
| [x] | M0-01 | Vue 与 Python 前后端独立运行 | FE-BASE | LOCKED | M0-01-A01～M0-01-A05 | S=`18a9210947e0114a8bbc6a10c8864701dfb8539e`；C=`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`；E=`32558e25e394dda6e1fffee5970ae30bc378e7d7`；[正式报告](evidence/M0-01/runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/REPORT.md)；基线 `baseline/M0-01-01569c205a8d` 已远程核实 |
| [ ] | FE-INTEGRATE | Vue 业务壳与同源 viewer 桥接 | M0-01 | PLANNED | FE-INTEGRATE-A01～FE-INTEGRATE-A06 | 未执行 |
| [ ] | M0-02 | 事件契约、幂等持久化和范围查询 | FE-INTEGRATE | PLANNED | M0-02-A01～M0-02-A07 | 未执行 |
| [ ] | M0-03 | 单设备固定 CSV 播放 | M0-02 | PLANNED | M0-03-A01～M0-03-A05 | 未执行 |
| [ ] | M0-04 | 持久 SSE、补读与快照一致性 | M0-03 | PLANNED | M0-04-A01～M0-04-A06 | 未执行 |
| [ ] | M0-05 | Vue 趋势、记录表与真实连接状态 | M0-04 | PLANNED | M0-05-A01～M0-05-A05 | 未执行 |
| [ ] | M0-06 | 业务部件、测点与 viewer 状态联动 | M0-05 | PLANNED | M0-06-A01～M0-06-A06 | 未执行 |
| [ ] | M0-07 | 教学告警与实时监测主线复验 | M0-06 | PLANNED | M0-07-A01～M0-07-A08 | 未执行 |

M0 全部 LOCKED 只表示实时监测主线完成；仍不能宣布 RAG、检修、Kafka 或双引擎完成。FE-INTEGRATE 使用明确的消息夹具，真实运行与告警状态分别在 M0-06/M0-07 接入。

## M1 最小智能运维业务闭环

| 完成 | 任务 ID | 交付结果 | 依赖 | 初始状态 | 验收条款 | 测试提交 / 证据 / 基线 |
|---|---|---|---|---|---|---|
| [ ] | RAG-BASE | 固定 RAG 上游与本地运行基线 | M0-07 | PLANNED | RAG-BASE-A01～RAG-BASE-A06 | 未执行 |
| [ ] | M1-01 | 最小知识集、切分与文档版本 | RAG-BASE | PLANNED | M1-01-A01～M1-01-A05 | 未执行 |
| [ ] | M1-02 | Chroma 与 BM25 检索及引用证据 | M1-01 | PLANNED | M1-02-A01～M1-02-A05 | 未执行 |
| [ ] | RAG-INTEGRATE | 受控 stdio MCP 与业务工具接入 | M1-02 | PLANNED | RAG-INTEGRATE-A01～RAG-INTEGRATE-A05 | 未执行 |
| [ ] | M1-03 | 本地 Agent 分析、证据及前端呈现 | RAG-INTEGRATE | PLANNED | M1-03-A01～M1-03-A06 | 未执行 |
| [ ] | M1-04 | 部件档案、教学工单与生命周期事件 | M1-03 | PLANNED | M1-04-A01～M1-04-A05 | 未执行 |
| [ ] | M1-05 | 最小智能运维闭环复验 | M1-04 | PLANNED | M1-05-A01～M1-05-A04 | 未执行 |

M1 完成后才可称“最小智能运维业务闭环通过”。assistant 是独立 Python 运行角色，RAG 为其长期受控 stdio 子进程；本地模型可复用已核实的推理端点。

## M2 消息输入与双设备

| 完成 | 任务 ID | 交付结果 | 依赖 | 初始状态 | 验收条款 | 测试提交 / 证据 / 基线 |
|---|---|---|---|---|---|---|
| [ ] | M2-01 | Kafka 输入与两路 Producer | M1-05 | PLANNED | M2-01-A01～M2-01-A05 | 未执行 |
| [ ] | M2-02 | 持久化与 Kafka offset 故障恢复 | M2-01 | PLANNED | M2-02-A01～M2-02-A05 | 未执行 |
| [ ] | M2-03 | 双设备消息主线及智能闭环复验 | M2-02 | PLANNED | M2-03-A01～M2-03-A04 | 未执行 |

HTTP 直连验收保留为参考，Kafka 是输入适配扩展。持久化与 offset 之间的故障测试是必要项，不能用正常吞吐测试替代。

## M3 双引擎、告警主权与正常基线

| 完成 | 任务 ID | 交付结果 | 依赖 | 初始状态 | 验收条款 | 测试提交 / 证据 / 基线 |
|---|---|---|---|---|---|---|
| [ ] | M3-01 | Flink 事件时间窗口与收尾 | M2-03 | PLANNED | M3-01-A01～M3-01-A05 | 未执行 |
| [ ] | M3-02 | Spark 同窗结果与独立参考答案 | M3-01 | PLANNED | M3-02-A01～M3-02-A05 | 未执行 |
| [ ] | M3-03 | Flink 告警主权显式切换 | M3-02 | PLANNED | M3-03-A01～M3-03-A05 | 未执行 |
| [ ] | M3-04 | 工况合成与正常运行基线模型 | M3-03 | PLANNED | M3-04-A01～M3-04-A05 | 未执行 |

窗口对照使用独立答案；M3-03 按新运行显式把正式告警主权切到 Flink，之前任务保持影子计算。M3-04 的误差通过线必须在训练前冻结。

## M4 性能预算、稳定性与最终交付

| 完成 | 任务 ID | 交付结果 | 依赖 | 初始状态 | 验收条款 | 测试提交 / 证据 / 基线 |
|---|---|---|---|---|---|---|
| [ ] | M4-01 | 性能预算、负载与测量方法冻结 | M3-04 | PLANNED | M4-01-A01～M4-01-A05 | 未执行 |
| [ ] | M4-02 | 稳定性、并行性能实测与必要优化 | M4-01 | PLANNED | M4-02-A01～M4-02-A05 | 未执行 |
| [ ] | M4-03 | 可复现交付、全任务核对与 JD 证据 | M4-02 | PLANNED | M4-03-A01～M4-03-A05 | 未执行 |

M4-01 是预算与测量方法的前置任务，不表示性能已通过。当前预算 NOT_FROZEN；M4-01 未 LOCKED 不得开始 M4-02 优化。M4-03 功能验收结束后仍需自己的交付门，避免“要求自身先完成才能验收”的循环。

## 单任务追溯登记模板

每项任务从实际执行开始追加记录，所有占位字段初始为空：

- task_id / state：
- dsh_ticket / actual_worker / branch：
- specification_version / criteria_commit_S：
- dependency_baseline / integrated_base_sha：
- implementation_scope / upstream_commit / local_patch_scope：
- fixture_manifest / fixture_sha256 / expected_results_version：
- actual_commands / runtime_environment：
- tested_code_sha_C：
- required_total / passed / failed / blocked / skipped / not_run：
- evidence_path / evidence_sha256 / evidence_commit_E：
- baseline_tag / remote_verified_E：
- integration_status / integration_sha：
- lock_record_K_external_receipt：
- failure_and_fix_history / acceptance_change_history：

不得在 E 内填 E 自身 SHA，也不得在 K 内填 K 自身 SHA。E 的实际哈希可由后续 K 引用；K 的实际哈希和推送核实通过外部 Ticket 回执登记。锁定后改动建立新任务或显式 REOPEN，保留旧基线并回归受影响行为。

## 清单机械核对要求

交付前核对：任务 ID 唯一；本表每个验收范围在 ACCEPTANCE 中完整存在；条款编号连续且无重复；没有孤立条款或悬空依赖；所有初始完成框均为 `[ ]`；初始状态全部 PLANNED。以上是规格一致性检查，不是应用功能测试通过。

## M0-00 执行追溯

- task_id / state：M0-00 / LOCKED。
- dsh_ticket：`910aedd83224919debc9bc9021d86450`；actual_worker：`worker-910aedd83224919debc9bc9021d86450`。
- branch：`agent/bootstrap-spec-freeze-910aedd83224`；integrated_base_sha / comparison_base / merge_base：`dad14da1561ac609a5d14076629d1698c53b3627`；无 predecessor。
- criteria_commit_S：`3980867902a9c102f18894e9acf65b8c72051b19`；[冻结记录](evidence/M0-00/criteria.md) SHA256 `50d7288f78db414505c1245145d794171b2d126cad33294552b163f707f7ba48`。
- tested_code_sha_C：`b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61`；evidence_commit_E：`398b923f01eb97bcf7c22e9e31f344662c2365c5`。
- required_total / passed / failed / blocked / skipped / not_run：7 / 7 / 0 / 0 / 0 / 0；worker 与协调会话独立复验各43个实际命令均退出0，四条真实失败路径回归通过。
- evidence_path：[正式报告与原始证据](evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/REPORT.md)；[SHA256 清单](evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/SHA256SUMS.json) SHA256 `fed3f234403a599e97ad28052d52b1275f186b22ebd9608e25d1d46fbeed77b5`。
- independent_review：协调会话 `01a1a040-ff3b-7f31-977e-71d5bd2d1e61`；Standards `/root/m000_standards_review` PASS；Spec `/root/m000_spec_review` PASS；[独立记录](evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/independent/REVIEW.md) SHA256 `17957b536a354e7eacbe823183565518a5733f2e0101db507b06b0fd0ed4188e`。
- baseline_tag：`baseline/M0-00-b4ae8e35d782`，全新标签指向 E；remote_verified_E：2026-11-03T08:23:24.400662Z，远程 branch/tag target 均为 E，远程 commit tree 与完整 REPORT 字节核实一致；[远程核实](evidence/M0-00/remote-E-verification.json)。
- lock_record_K_external_receipt：K 的最终 SHA 在真实推送后由 Issue #1 外部回执核实；本记录仅引用已存在的 S/C/E 与远程结果。
- integration_status：PR #2 待协调会话最终审查、合并与实际集成核查；main 在本项核实时仍为原基准。后续 FE-BASE 须单独派发，并确认实际工作分支包含前置成果。
- CI：当前 C 零条 check-runs、零条 commit statuses，没有上报 CI 检查，不记作 CI 通过；既有保护保留。
- failure_and_fix_history：[原始失败、修正与复验](evidence/M0-00/runs/b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61/REPORT.md)；完整 S 冻结后未改变验收语义，保留原候选和基线。

## FE-BASE 执行追溯

- task_id / state：FE-BASE / LOCKED。
- dsh_ticket：`914d2ac32b5d2f130d718138164c8bab`；actual_worker：`worker-914d2ac32b5d2f130d718138164c8bab`；branch：`agent/frontend-upstream-baseline-914d2ac32b5d`。
- criteria_commit_S：`7704387252b293bee1ec671b440164a12287ca16`；[冻结记录](evidence/FE-BASE/criteria.md) SHA256 `d24a5b12c91ba193012e7d05d5791033bb10e78baafa16280b614b249c9d19ac`。
- dependency_baseline：`baseline/M0-00-b4ae8e35d782`；integrated_base_sha / comparison_base / merge_base：`86e521184a4d5bbd42dfe93a48999fa714c233f2`，工作分支包含前置成果。
- upstream_commit：`efc5d2ecd12055f880a41b47215791c22d3656d4`；完整62项文件通过实际subtree导入`459a359afd4e2e2bdaca05acccc4b65f79b741d8`；local_patch_scope：部件百分比四处output选择器，许可与原锁保持。
- tested_code_sha_C：`ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f`。
- required_total / passed / failed / blocked / skipped / not_run：5 / 5 / 0 / 0 / 0 / 0；worker主32条、干净26条、协调独立26条命令全部退出0，真实全模型镜头负对照和全部浏览器交互通过。
- actual_commands / runtime_environment：[正式报告](evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/REPORT.md)与原始命令记录；Node24.22.2/npm11.19.1，Chrome156.0.8078.80，1920×1080，WebGL2 ANGLE/SwiftShader。
- evidence_path：[正式报告与原始证据](evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/REPORT.md)；[SHA256总清单](evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/SHA256SUMS.json) SHA256 `8a3461de61ecdf1c4bd658387e087e78cce220f775b895439f476ea81574d0ef`。
- independent_review：接续协调聊天`01a1a186-0661-7540-b368-f70449bdae16`；Standards `/root/febase_ab07372_standards`、Spec `/root/febase_ab07372_spec`完整79文件/9提交均通过，独立实际五条验收PASS；[独立记录](evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/coordinator-independent-review.json) SHA256 `64526dd2f202477658381901aa2da395299fc6e3b9d024c1b2247b6cad5b54fe`；外部通过回执为Issue #3评论`6607173203`。
- evidence_commit_E：`a7966085071051d07cb7e80d0843a07ad9687183`；baseline_tag：`baseline/FE-BASE-ab07372aa223`，全新标签指向E。
- remote_verified_E：2026-11-03T15:15:16.687939+00:00；远程分支/tag均为E，完整tree及193项证据blob一致，远程原文REPORT和总清单逐字节核实，原M0-00基线保持；[远程核实](evidence/FE-BASE/remote-E-verification.json)。
- lock_record_K_external_receipt：K推送后的准确远程SHA在Issue #3最终外部回执核实；本记录仅引用已存在的S/C/E及远程结果。
- integration_status：PR #4待协调最终核查及用户当前授权合并；本项尚未合并至main，后续任务需实际集成并单独派发。
- CI：准确C零条check-runs、零条commit statuses，仅记没有上报检查；既有保护保持。
- failure_and_fix_history：[原独立FAIL、真实red/green诊断及历次失败](evidence/FE-BASE/runs/ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f/REPORT.md)；冻结S及硬验收语义保持，历史失败与原哈希完整保留。

## M0-01 执行追溯

- task_id / state：M0-01 / LOCKED。
- dsh_ticket：`810d967dfbff4f0b93ef72c858f5a6b6`；actual_worker：`worker-810d967dfbff4f0b93ef72c858f5a6b6`；branch：`agent/vue-python-runtime-810d967dfbff`。
- criteria_commit_S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`；[冻结记录](evidence/M0-01/criteria.md)。
- tested_code_sha_C：`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`；comparison_base / merge_base / 前置集成基准：`b8ad3150cf4480f8e205926541aeeccb072f7f80`，完整包含FE-BASE实际集成成果。
- required_total / passed / failed / blocked / skipped / not_run：5 / 5 / 0 / 0 / 0 / 0；worker主122条、干净124条、协调独立干净124条命令的实际退出码全部等于明确expected_exit_code；每套包含46项必要拒绝退出1。
- evidence_path：[正式报告](evidence/M0-01/runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/REPORT.md)；[来源索引](evidence/M0-01/runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/archive-index.json)；[完整SHA256清单](evidence/M0-01/runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/SHA256SUMS.json)。
- independent_review：会话`01a1a274-4921-7f83-85f0-3d056391d87d`，完整base→C的34文件/七提交分别审查，Standards/Spec及五条实际验收均PASS；[独立报告](evidence/M0-01/runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/independent-01569c2-PASS/REVIEW.md) SHA256 `7fc6f070a0264039d4a3e2649dca5805ef94df6d7342be0d2739cf154a62cc7c`；通过回执Issue #5评论`6611125566`。
- failure_and_fix_history：[完整失败、整改及各轮复验](evidence/M0-01/runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/REPORT.md)；原两轮独立FAIL、各候选和实际red/green保持原始字节及哈希，S和验收语义保持。
- CI：准确C的check-runs=0、commit statuses=0，没有上报检查，既有保护保持。
- evidence_commit_E：`32558e25e394dda6e1fffee5970ae30bc378e7d7`；baseline_tag：`baseline/M0-01-01569c205a8d`，全新标签指向E。
- remote_verified_E：2026-11-03T18:06:15.870264+00:00；远程分支/tag均为E，完整tree、1114项证据blob及TASKS字节已核实，原两项前置标签保持；[远程核实](evidence/M0-01/remote-E-verification.json)。
- evidence_manifest_sha256：`63050ec12278fd8f120befe6c61634e5491fc0cca48cd617cb37e08891376381`；[锁定登记](evidence/M0-01/LOCK.md)。
- lock_record_K_external_receipt：锁定提交推送后的最终SHA在Issue #5外部回执核实；本记录仅引用已存在的S/C/E与远程核实结果。
- integration_status：PR #6待协调最终head核查、合并与实际main集成；当前只交付M0-01，后续任务需实际集成后单独派发。
