# 领域文档约定

本项目采用 single-context：根 [GLOSSARY.md](../../GLOSSARY.md) 保存确认后的领域语言；`docs/adr/` 按需保存重要决策。没有 monorepo 或既有多上下文布局，不创建 GLOSSARY-MAP.md。

开始任务先读术语表和已存在的相关 ADR。术语/决策文件不存在时继续读取根规格，不为形式创建空目录、占位术语或空 ADR。术语表只解释实际确认的领域概念，不存接口、SQL、实现设计、验收条款或任务状态；规格仍以 [DEV_SPEC.md](../../DEV_SPEC.md) 为准。

用实际安装的 domain-modeling 维护语言，SKILL.md 及相对引用的 GLOSSARY-FORMAT.md/ADR-FORMAT.md 都从实际 worker skill 目录读取。新术语确认后及时登记；发现与已有定义或 ADR 冲突，明确指出并记录解决依据，不静默改名。

仅当决策难以逆转、缺少背景会令人困惑、且确有实际取舍时写 ADR，保留理由和受影响范围。不要把现有规格、任务表或整个对话复制为 ADR。变更已锁定行为仍先建变更任务或 REOPEN，领域文档不能越过验收门。

工程接口设计参考 codebase-design 的 module/interface/seam/adapter 词汇；这些通用工程词汇不加入领域术语表。业务中的 Device、Component、Run 等继续采用本项目定义。
