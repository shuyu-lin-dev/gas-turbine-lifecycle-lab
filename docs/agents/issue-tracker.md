# Issue tracker：GitHub Issues

唯一目标为 [shuyu-lin-dev/gas-turbine-lifecycle-lab](https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab/issues)。Issue/Ticket 承载派工、来源、讨论与回执；[TASKS.md](../../TASKS.md) 是任务、依赖及 LOCKED 状态的唯一清单，[ACCEPTANCE.md](../../ACCEPTANCE.md) 定义硬通过条件。Issue 关闭、标签或 GitHub 原生 blocking 状态不能代替前置 LOCKED 和实际成果集成。

当前 Issue #7 已授权 FE-INTEGRATE 的调查、验收冻结、Vue/viewer 桥接实现、真实测试、必要修正、提交、推送、审查回执和 PR 交付；使用 dsh 提供的 `gh`，其 CLI 为现有 agent 包装器；不得使用 gh-owner 或操作者身份。每次写入前先核对 `gh api user --jq .login` 及 `gh repo view --json nameWithOwner`，目标必须为上面的唯一仓库。协调会话负责独立审查和最终合并，开发 worker 保留 PR 交付职责。

常用只读入口：

```sh
gh issue view <number> --repo shuyu-lin-dev/gas-turbine-lifecycle-lab --json number,title,body,labels,comments
gh issue list --repo shuyu-lin-dev/gas-turbine-lifecycle-lab --state open --json number,title,labels
```

确在后续授权派工范围内需要发布时，先核对已有 Issue，优先关联现有任务 ID；正文注明 TASKS.md 的任务、依赖、允许范围、当前验收来源、适用 skills 和预期交付，不复制另一套完成状态。多行正文写入当前 worker 目录内明确的临时文件，通过 `--body-file` 提交。保留团队规定的自动化代理披露行。to-spec/to-tickets 的默认“发布”仅在该工作已授权且确有新增/调整需求时适用，不重新划分当前 27 项任务。

GitHub 原生依赖可作派工辅助，使用真实 Issue database ID；没有原生依赖时在正文引用阻塞 Issue。两者都不能改变 TASKS.md 的规范依赖。分支最后一段保持框架的 DSH_SUPERAGENT_NAME，任务 ID 记入正文、提交信息和证据，不用任务 ID 替换框架分支名。

PRs as a request surface: **no**。这是 triage 的默认选择，保留现有 dsh Source 对已订阅 PR/评论/CI 的接收配置；两者职责不同。裸 `#number` 不明确时，先确认是 Issue 还是 PR。PR 交付后由协调会话按当前授权完成全部检查并合并；开发 worker 不执行 approve、merge 或 auto-merge。

新 Ticket 的后续派工方法及 prepare 见 [dsh.md](dsh.md)，标签角色见 [triage-labels.md](triage-labels.md)。
