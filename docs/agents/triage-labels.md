# Triage 标签映射

worker 已安装 triage，仓库此前没有五角色映射，采用 setup-matt-pocock-skills 的默认词汇。本文件只保存本地映射；本轮不创建或修改远程标签。远程已有 `wontfix`，其余四项在本轮只读列表中不存在，不把本地映射写成远程已配置。

| Skill 角色 | 本仓库标签 | 含义 |
| --- | --- | --- |
| needs-triage | needs-triage | 等待维护者评估 |
| needs-info | needs-info | 等待必要信息 |
| ready-for-agent | ready-for-agent | 派工描述充分，可由 agent 承接 |
| ready-for-human | ready-for-human | 需要人工判断或实施 |
| wontfix | wontfix | 不实施，保留理由 |

后续获授权使用 triage 时，先读取远程标签与已有映射，沿用以上字符串；缺标签的写入也必须在当次授权范围内。已有 `bug`、`enhancement` 可用于类别。标签仅组织派工，不表示必要验收 PASS 或任务 LOCKED；实际是否可以开始仍按 TASKS.md 与分支集成状态判断。
