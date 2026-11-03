# M0-01 锁定登记

状态：LOCKED。唯一任务状态登记于根TASKS.md。

- task_id：M0-01；Issue #5；PR #6；Ticket `810d967dfbff4f0b93ef72c858f5a6b6`。
- branch：`agent/vue-python-runtime-810d967dfbff`。
- criteria_commit_S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`。
- tested_code_sha_C：`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。
- evidence_commit_E：`32558e25e394dda6e1fffee5970ae30bc378e7d7`。
- comparison_base / merge_base：`b8ad3150cf4480f8e205926541aeeccb072f7f80`。
- baseline_tag：`baseline/M0-01-01569c205a8d`，全新标签实际指向E；原M0-00和FE-BASE标签保持。
- [正式报告](runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/REPORT.md)与[完整清单](runs/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/SHA256SUMS.json)已包含于E。清单覆盖1113项文件，另保存清单自身；SHA256=`63050ec12278fd8f120befe6c61634e5491fc0cca48cd617cb37e08891376381`。
- required / passed / failed / blocked / skipped / not_run：5 / 5 / 0 / 0 / 0 / 0；准确C的开发及全新独立Standards/Spec审查通过，全部实际命令退出码符合明确预期。
- remote_verified_E：`2026-11-03T18:06:15.870264+00:00`，远程分支和tag target均为E；完整tree=`7401a9ebe45d5d1a12056e0d8feacc08a3d0019f`。1114项证据blob及TASKS逐项与远程一致，见[完整远程核实](remote-E-verification.json)及原始响应。
- C→E只增加证据与必要VERIFIED登记；应用、测试、依赖、行为配置及验收语义与准确C一致。当前锁定提交只增加本登记、远程核实原文和TASKS状态。
- 锁定提交最终SHA与真实推送核实结果在Issue #5外部回执提供；本记录引用已存在的S/C/E。
- CI按实际上报数量记录；准确C零条check-runs和零条commit statuses。保护规则保持。
- PR #6等待协调最终head核查、合并与实际main集成；后续任务在实际前置集成后单独派发。当前只交付M0-01。
