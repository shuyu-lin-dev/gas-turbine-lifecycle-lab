# 验收报告模板

这是空模板，不是实际验收报告。复制到当前任务独立 attempt 目录后填写；旧 attempt 保留。

## 版本与执行信息

| 字段 | 实际值 |
|---|---|
| task_id / attempt_id | 未填写 |
| dsh_ticket / executor_identity | 未填写 |
| started_at / finished_at / timezone | 未填写 |
| criteria_version / criteria_commit | 未填写 |
| tested_code_sha / dependency_baseline | 未填写 |
| worktree / branch / remote | 未填写 |
| environment / dependency_lock_hash | 未填写 |
| fixture_hashes | 未填写 |
| upstream_commits / imported_source_baseline | 当前任务涉及复用代码时填写 |
| current_scope / affected_regression | 未填写 |

## 逐条结果

从当前任务硬验收逐条复制 ID，不得漏项。仅实际 PASS 后勾选。

| 完成 | 条款 ID | 命令或操作 | 期望 | 实际 | 退出码 | 状态 | 证据文件 / SHA256 |
|---|---|---|---|---|---|---|---|
| [ ] | 待填 | 未执行 | 待填 | 无 | 无 | NOT_RUN | 无 |

required_total / passed / failed / blocked / skipped / not_run 必须相加一致。

## 失败与修复

记录原始失败、原因、变更、后续候选代码 SHA 和重验结果。不得删除旧失败记录。

## 锁定登记

- evidence_commit：只在后续状态提交 K 或外部回执中记录；本文件不能引用包含自身的最终提交 SHA。
- baseline_tag：
- C→E 差异检查：
- remote_verified_sha：
- integration_status / integration_sha：
- task_state：PLANNED；execution_status：NOT_RUN。

本报告进入证据提交 E 时最多登记 VERIFIED；已核实的远程 E 与标签由后续 K 登记 LOCKED。K 的推送确认放在外部 Ticket 回执。

## 结论

尚未执行。所有必要条款 PASS 并完成基线登记后，才能将任务标记为 LOCKED。
