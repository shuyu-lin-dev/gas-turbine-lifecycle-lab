# 上游源码复用与业务接入

版本：v2。日期：2026-11-03（Asia/Shanghai）。

本文件规定两个上游项目怎样进入 GT Lifecycle Lab、哪些能力直接保留、哪些接入能力需要新增。完整业务范围见 [DEV_SPEC.md](../DEV_SPEC.md)；任务顺序、硬验收与交付规则分别以 [TASKS.md](../TASKS.md)、[ACCEPTANCE.md](../ACCEPTANCE.md)、[AGENTS.md](../AGENTS.md) 为准。本文件不另设一套完成状态，也不改变这些文件的验收要求。

完整 turbine-explorer 已在 FE-BASE 中通过 Git subtree 导入并完成独立基线验收，导入提交为 `459a359afd4e2e2bdaca05acccc4b65f79b741d8`，固定上游为 `efc5d2ecd12055f880a41b47215791c22d3656d4`。FE-INTEGRATE 在此完整源程序上增加同源嵌入与四消息桥接，具体执行与验收见 [本项冻结](../evidence/FE-INTEGRATE/criteria.md) 和 [运行说明](FE_INTEGRATE.md)。RAG 的取得、运行与集成仍由其所属后续任务执行；任务状态统一查 [TASKS.md](../TASKS.md)。

## 1. 已确定的复用方式

| 上游 | 固定版本 | 主仓库内位置 | 采用方式 |
| --- | --- | --- | --- |
| [AlexZhangji/turbine-explorer](https://github.com/AlexZhangji/turbine-explorer) | `efc5d2ecd12055f880a41b47215791c22d3656d4` | `vendor/turbine-explorer/` | 保留完整 Three.js 演示源码、组件检视与程序几何；增加嵌入模式和业务消息桥接 |
| [jerry-ai-dev/MODULAR-RAG-MCP-SERVER](https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER) | `f658c5a4011c8b826707a65a3b11ce9301b0626f` | `vendor/modular-rag-mcp-server/` | 保留文档导入、Chroma、BM25、混合检索、Ollama provider、MCP stdio 和追踪模块；补燃机业务合同 |

本机后续执行到对应任务时，分别在 `/home/lsy/workspace/lab` 范围内完整克隆相应上游，核对上述 commit，再通过 **Git subtree** 纳入唯一主仓库。FE-BASE/FE-INTEGRATE 在 M0，RAG-BASE/RAG-INTEGRATE 在 M1；本轮接入准备不克隆或导入。不得把引用版本自动改为执行当天的 `main`。如需升级，建立单独变更任务，记录旧、新 SHA、差异与受影响验收。

导入目录不得遗留独立 `.git`，不得成为无法由普通主仓库 checkout 还原的嵌套仓库或隐式 gitlink。上游原始源码、配置示例、测试和已有来源说明应随 subtree 一起纳入；依赖安装产物、模型权重、数据库、凭据和临时日志不进入 Git。上游资料、演示数据和素材各自的许可仍需保留并核对。

subtree 导入记录必须写明原始仓库、固定 commit、导入前缀、导入提交，以及是否采用压缩历史。完整保留固定快照中的源文件不等于必须把上游全部历史并入主仓库。后续二次开发提交发生在本项目主仓库内，注明关联任务和修改了哪个上游目录；由 dsh 按项目规则提交、推送和验证。

## 2. 来源与许可记录

### 2.1 三维上游

固定快照的根 `LICENSE` 是 MIT 文本，版权行为 `Copyright (c) 2026 AlexZhangji`。导入和分发时保留该文件、`THIRD_PARTY_NOTICES.md` 和原有来源说明。该上游明确把自身定位为参考公开资料的独立教学可视化，几何、拆卸路径和流动效果具有示意性质；不应改称上燃真实机型、制造 CAD、经过验证的 CFD 或真实检修规程。[V1] [V2]

项目自己的业务接口、数据生成程序与 UI 可以独立标注作者和许可，但不能用自己的许可文件替换上游的作者和许可说明。第三方库、知识资料、模型权重和其他素材的许可分别记录，不因主项目许可而自动改变。

### 2.2 RAG 上游

固定快照的 `pyproject.toml` 声明 MIT，并含 MIT 分类标记；同一完整仓库树中未找到独立 `LICENSE` 或 `NOTICE` 文件，作者字段仍是模板占位值。[R1] [R2]

准确记录上述事实，保留原始声明、仓库地址和固定 SHA。**不得自行补写上游作者身份或声称已经取得完整、经核验的分发授权；也不能仅凭缺少独立文件断言该项目完全没有许可或不能使用。** 后续公开分发时，核对上游完整许可及版权信息，并把核实结果纳入来源记录。

## 3. Vue 壳与现有 Three.js 查看器

### 3.1 保留哪些已有能力

三维上游已经包含整机程序几何、剖视与分解装配、部件独立检视、冷却叶片教学展示、画质和背景设置、中英文，以及转子和流动等展示效果。它是 TypeScript、Vite、Three.js 前端；它的构建与交互逻辑可以直接复用，不要求先把全部源码转换成 Vue 组件。[V1] [V3]

GT Lifecycle Lab 的 Vue 主页面负责导航、机组和批次选择、ECharts、告警、日志、档案及 AI 分析面板。上游前端独立构建后由本项目在同一站点的 `/viewer/` 路径托管，Vue 使用 iframe 嵌入。新增轻量 `embedded` 样式与 bridge 即可接入；不嵌入作者的在线站点，不依赖其网站可用性。

构建任务需要验证 `/viewer/` 的资源基础路径、语言参数、iframe 尺寸变化和销毁行为。原有演示可独立打开，业务嵌入模式只保留当前场景需要的控件，避免双重导航遮挡主页面。

### 3.2 四种业务消息

以下消息全部属于本项目新增协议，不能宣称上游已经提供。统一消息信封包含 `schema_version`、`type`、`viewer_instance_id`、`context_revision` 和 `payload`；除准备握手外，业务消息均携带 `run_id`、`device_id`。

| type | 方向 | 最小业务内容 | 接收行为 |
| --- | --- | --- | --- |
| `viewer-ready` | 查看器 → Vue | 当前实例和协议版本 | 父页面校验后，重发当前上下文的组件状态快照与选中部件 |
| `select-component` | Vue → 查看器 | `component_id` | 定位并高亮支持的部件；无法映射时显示该部件不可用 |
| `component-selected` | 查看器 → Vue | `component_id` | 在当前上下文下联动趋势、告警和档案；不能反过来修改机组或批次 |
| `update-component-state` | Vue → 查看器 | 组件状态帧 | 更新对应部件的状态、测量值和更新时间 |

父页面是机组、批次和上下文的唯一管理方。设备/批次范围变化时递增 `context_revision`，普通部件选择不递增；每次挂载创建新的 `viewer_instance_id`，并在初始化参数中传给 iframe。`viewer-ready` 回传该实例标识，允许 `context_revision=null`，省略尚未绑定的 `run_id/device_id`。父页面校验 origin、source 和实例后，先发送含当前 context、run 和 device 的 `update-component-state` 快照；子页面绑定上下文后才发送业务 `component-selected`。准备期间不发送依赖场景已就绪的指令；新实例就绪后重发当前快照和选中部件，不重放过时队列；旧实例的 ready 同样拒收。此握手不增加第五种消息。

双向接收均校验 `event.origin`、`event.source`、协议版本、消息类型和字段。父页面只接受当前 iframe `contentWindow`，子页面只接受当前父窗口；发送使用明确的目标 origin。`update-component-state` 是父端更新上下文的唯一消息：通过上述校验后，尚未绑定时采用完整快照；更高 revision 清除旧业务状态并绑定新的 run/device/context；相等 revision 要求 run/device 相同；更低 revision 拒绝。其余业务消息必须与当前已绑定上下文完全匹配。须在不重建 iframe 的情况下完成设备/批次切换，旧快照不能回滚当前状态。销毁 iframe 时清理父页面监听器与待发送状态；子页面的监听器、动画循环和资源按其生命周期释放。

组件状态帧至少包含 `event_time`、`received_at`、`measurement_quality` 与各项 `component_id`；测量项明确 `tag_id`、`value`、`unit`，可附告警状态和 `event_id`。必须支持无数据、失效和过期状态，不能把缺测转换成正常值或零值。更新时间和数据质量来自业务帧，不由 Three.js 动画推断。

未知 `component_id` 不得定位到另一个相似部件。父、子页面均依据版本化组件映射判断是否支持；不支持时展示“该部件暂不可定位”，保留真实部件编号。接收 `select-component` 引起的程序定位不得触发无穷的选择消息回环。

### 3.3 原演示数值与运行数据

原项目包含用于教学展示的能量换算、额定功率常量和动画参数。例如 `src/energy.ts` 中有 571 MW 的示例额定功率；这不是本项目两台合成机组当前测量到的功率。[V4]

业务嵌入模式下，测点数值、告警颜色、运行状态和更新时间统一来自 Vue 收到的后端数据。未接通业务数据时显示“未接入运行数据”，不得把原演示常量当成采集值。可保留教学效果，但其数值和假设要明确标注为教学说明；视觉动画转速也不自动等于仪表转速。

原作者的独立演示模式可以继续保留其说明和计算。两种模式有明确标识，不把示例数据写入本项目 Kafka、窗口统计、告警、检修或验收证据。

### 3.4 GLB 的角色

本包已有的 `assets/models/industrial-gas-turbine-educational.glb` 及相关映射和来源记录继续保留，作为可下载模型资产、静态检查和后续备用展示输入。它由原作者程序模型导出，不能替代完整查看器的程序几何、拆解控制、叶片检视和交互源码。

v2 的主展示路径是复用完整 Three.js 应用并接入 iframe bridge。不得把“GLB 可解析”视为“原演示交互已接入”；原演示源码测试、iframe 联动测试和用户机浏览器验收分别记录。

## 4. RAG 子项目的最小接入

### 4.1 直接保留的实现

第一版沿用 Chroma 持久化、BM25 索引、稠密与稀疏检索、融合、文档导入流水线和 MCP stdio。Ollama 聊天和嵌入 provider 已有实现并注册；向量存储当前只有 Chroma 自动注册，不因配置注释列出其他名字就认定已实现其他后端。[R3] [R4] [R5]

本项目暂不为演示先行适配 Milvus Lite，也不先把 MCP 重写成 HTTP 服务。RAG 只承担专业资料的导入、检索和证据返回；设备历史、窗口结果、告警和检修记录仍由业务 API 提供。业务 Assistant 负责调用两类工具并组织回答。

### 4.2 进程、路径与启动合同

Python Assistant 通过 MCP 客户端启动 RAG stdio 子进程。子进程使用 `vendor/modular-rag-mcp-server/` 为工作目录和自己的 Python 环境、配置及持久化目录；不要把它的通用 `src` 包直接混入业务后端的导入路径。上游大量使用 `src.*` 绝对导入，打包配置也把 `src` 作为包名，独立进程能减少当前集成对其内部结构的修改。[R1]

应运行真正的模块入口 `python -m src.mcp_server.server`。固定快照中，`pyproject.toml` 的 `mcp-server` 指向 `main:main`，而根 `main.py` 仍是加载配置后返回的占位逻辑。不得通过那个占位入口的退出码判定服务就绪。实际就绪必须包含 MCP 初始化、工具枚举和真实工具调用。[R1] [R6]

stdout 仅用于 MCP 协议，普通日志写 stderr 或指定日志文件。Assistant 管理子进程退出、超时、取消和重启；启动失败不能伪装成知识库无结果。初始分析并发限制为 1，待用户机资源与并发场景验收后再提高。前端只访问业务 API，不连接子进程、不读取 Chroma 或业务 SQLite 文件。

### 4.3 本地模型和配置

从现有 Ollama provider 接入，不新增无必要的模型适配层。实际 endpoint 通过其支持的 `OLLAMA_BASE_URL` 或显式构造参数提供，并验证容器内可达性；不能把容器内 `localhost` 自动理解为 Windows 主机地址。聊天模型和嵌入模型名称以本机实际安装与验收记录为准。

初始 profile 明确设置：`vision_llm.enabled=false`、`ingestion.chunk_refiner.use_llm=false`、`ingestion.metadata_enricher.use_llm=false`，重排保持关闭；具体 YAML 键名以固定版本 `config/settings.yaml` 的真实字段为准，不复制未经核对的配置。上游默认视觉和两个 ingestion LLM 开关为开启，不能遗漏这些调用路径。[R7]

本地嵌入维度必须与模型实际输出一致，文档与查询使用同一嵌入版本。更换模型或维度时重建或迁移索引，不能直接混写。固定版本的 Ollama 嵌入实现调用 `/api/embeddings` 并逐条请求文本，聊天调用 `/api/chat`；其与实际安装版本的兼容性和耗时必须现场测，不能依据存在 provider 类就标为通过。[R5]

### 4.4 业务工具合同

本项目对 Agent 暴露 `search_knowledge`，内部映射到上游 `query_knowledge_hub`；不要求上游工具全部改名。入参至少明确 `query`、`top_k`、`collection`、经校验的 `filters` 和用于关联日志的 `analysis_id`。filters 初期只支持约定的设备系列、部件、资料类型、版本等简单字段，不能声称支持任意复杂查询表达式。

当前底层混合检索接受过滤条件，但上游 MCP 工具没有暴露 filters，内部实际传入 `filters=None`。新增工作是把参数从 MCP schema、handler、execute 到检索层完整透传，并让资料导入保存相应元数据。融合后过滤及所有返回证据都要验证，避免稀疏检索结果越过范围限制。[R8]

运行数据工具另行要求 `run_id + device_id + time_range`，不能用知识库 collection 替代业务查询范围。知识资料允许跨运行批次复用，但其型号、部件和版本适用范围必须可检查。

返回合同至少区分以下状态，并保留 MCP 错误语义：

| 状态 | 含义 | 前端/Agent 行为 |
| --- | --- | --- |
| `ok` | 检索执行完成，存在满足条件的证据 | 展示证据；仍需判断其是否足以支持回答 |
| `no_evidence` | 检索执行完成，所需范围内没有可用证据 | 明确缺少资料，不能虚构引用 |
| `degraded` | 某检索路径不可用，已知的替代路径完成 | 显示具体退化项；不得伪装完整检索成功 |
| `error` | 模型、索引、权限、参数或进程等故障阻止查询 | 返回可识别错误和 trace；不能当作正常空结果 |

上述统一状态和跨服务关联属于本项目新增合同。应检查上游异常捕获、降级和空结果分支，保留错误来源，禁止在桥接层用统一的空数组吞掉所有异常。

### 4.5 引用与追踪合同

上游已经有 Citation 对象，包含 `chunk_id`、source、score、文本片段和可选页码。实际 MCP handler 当前把引用 JSON 放在 TextContent 的 Markdown 代码块里，并未直接填写 `CallToolResult.structuredContent`。本项目应补机器可读结构化返回，Vue 不依赖解析任意 Markdown 来获取证据。[R9]

每条证据统一返回 `document_id`、`document_version`、`chunk_id`、`source_uri`、`title`、`locator`、`snippet`、`retrieval_score`；字段类型与缺失值规则在 M1-02 编码前冻结。`locator` 保存可核查的章节/页码定位，`snippet` 保存原文片段。分数是排序指标，不能标为故障诊断置信度。上游 `Citation.source` 是适配输入，由资料登记表映射为项目 `source_uri`，指向可访问文件或原始 URL；不能直接把容器本地路径当作用户可点击的文件链接。

页码只在导入过程保留了可靠页映射时显示。现有 PdfLoader 未为全部正文建立精确页码映射，DocumentChunker 会尝试从首张引用图片推断 `page_num`；因此不能把 Citation 有 page 字段等同于精确 PDF 正文页码功能已经完成。没有可靠页码的资料使用真实章节和片段定位，并明确页码不可用；不得根据文本内容猜页码。[R10]

复用现有 `trace_id`、分阶段耗时与 JSONL 记录；增加返回 trace 标识及 `analysis_id` 关联，记录检索范围、模型与索引版本、最终证据 ID 和错误/退化状态。数值结论绑定业务查询结果，文献结论绑定资料证据，二者分别保存。日志写入失败也要可观察，不得仅因完成一段生成文本就认定全链路成功。[R11]

## 5. 上游 skills 与 dsh 工作流

克隆源码不意味着自动启用上游全部 skills。上游自己的 `DEV_SPEC.md`、教学计划和自动编码规则留作来源资料，不能覆盖 GT Lifecycle Lab 根目录的规格、任务、验收或已授权的 dsh 提交流程。

`auto-coder` 可以借鉴小任务、实现、测试的组织方式，但其默认规则包含前置产物不匹配时警告后继续、三轮修复后停止、提交前询问及先修改任务完成标记。这些规则不能替代本项目依赖验收、持续修复、真实证据和通过后锁定的要求。[R12]

上游 `package` 的执行模式可清理 `data/`、`logs/` 等目录；它不进入本项目自动打包或交付流程。发布只处理明确的构建产物，不能默认删除知识库、模型、业务数据或验收日志。既有 dsh profile、认证、source、branch protection 和 worker 提交身份均按主项目规则保留。[R13]

## 6. 新增工作与验证边界

| 内容 | 状态类别 | 本项目仍需完成 |
| --- | --- | --- |
| 三维几何、拆解、检视、教学效果及现有前端测试 | 已有上游源码 | 固定版本导入、构建、在目标浏览器验证 |
| Vue 壳、`/viewer/` 托管、embedded 样式、四消息 bridge | 本项目新增 | 实现并验证组件联动、上下文切换、迟到消息及销毁行为 |
| Chroma/BM25、导入与混合检索、Ollama provider、MCP stdio、trace | 已有上游源码 | 安装固定依赖、实际本地模型接入、持久化和故障验证 |
| 燃机元数据、filters 透传、结构化证据、业务状态与 Agent 联动 | 本项目新增 | 完成接口合同及真实闭环验收 |
| 已导出的 GLB 和来源说明 | 已准备资产 | 用户机展示、选中映射与性能仍需验收；不能代表完整上游 UI 已接入 |
| 用户 WSL、Windows Docker、dsh worktree、远程 GitHub 基线 | 尚未在用户环境测试 | 由本机执行并保存真实命令、退出码、日志与远程验证记录 |

上游带有测试文件、README 描述了某功能、静态代码看起来完整，均不能自动转成验收通过。本文件不预填任何 PASS；正式硬验收、任务完成和锁定只写入根目录规定的验收与证据体系。

## 7. 固定版本源码审计索引

下表中的行号指所列固定 commit，升级后必须重新核对。链接定位源码事实，不表示已经执行过对应代码。

| 编号 | 固定版本路径/行号 | 支持的判断 |
| --- | --- | --- |
| [V1] | `turbine-explorer/README.md`：17–29、31–70 | 已有交互能力、教学性质和前端运行方式 |
| [V2] | `turbine-explorer/LICENSE`：1–21 | MIT 文本和原作者版权信息 |
| [V3] | `turbine-explorer/package.json`：6–25、34–35 | 构建/测试脚本、Three.js/Vite/TypeScript 及 Node 要求 |
| [V4] | `turbine-explorer/src/energy.ts`：1–7 | 原演示额定功率常量和教学能量换算 |
| [R1] / [R2] | RAG `pyproject.toml`：10–19、49–50、80–81；固定版本完整 tree | MIT 元数据声明、入口、通用 src 包及独立 LICENSE 缺失的观察范围 |
| [R3] / [R4] | `src/ingestion/pipeline.py`：97–110、434–452；`src/libs/vector_store/__init__.py`：13–16 | 可复用导入/索引流程和 Chroma 注册 |
| [R5] | `src/libs/llm/ollama_llm.py`：65–77、187–208；`src/libs/embedding/ollama_embedding.py`：65–78、119–139 | 本地聊天与嵌入实现及实际 endpoint |
| [R6] | `main.py`：22–34；`src/mcp_server/server.py`：82–110、125–131 | 占位根入口与真正 stdio 入口的区别 |
| [R7] | `config/settings.yaml`：8–29、37–46、52–55、69–73、104–112 | 默认 provider、视觉与 ingestion LLM 开关 |
| [R8] | `src/mcp_server/tools/query_knowledge_hub.py`：219–223、337–344、447–450；`src/core/query_engine/hybrid_search.py`：252–297、717–744 | MCP 未透传 filters，底层已有过滤能力 |
| [R9] | `src/core/response/citation_generator.py`：29–49、80–81；`response_builder.py`：71–83；`query_knowledge_hub.py`：477–483 | 现有引用字段与真实 MCP 内容返回形式 |
| [R10] | `src/libs/loader/pdf_loader.py`：110–138；`src/ingestion/chunking/document_chunker.py`：210–247 | 当前正文页码映射的限制 |
| [R11] | `src/core/trace/trace_context.py`：28–32、100–113；`trace_collector.py`：20、35–50 | trace ID、阶段数据和 JSONL 落盘 |
| [R12] / [R13] | `.github/skills/auto-coder/SKILL.md`：20、65、93–120；`.github/skills/package/SKILL.md`：40、46–50、90 | 不应原样覆盖本项目 dsh 流程或默认清理数据 |

[V1]: https://github.com/AlexZhangji/turbine-explorer/blob/efc5d2ecd12055f880a41b47215791c22d3656d4/README.md#L17
[V2]: https://github.com/AlexZhangji/turbine-explorer/blob/efc5d2ecd12055f880a41b47215791c22d3656d4/LICENSE
[V3]: https://github.com/AlexZhangji/turbine-explorer/blob/efc5d2ecd12055f880a41b47215791c22d3656d4/package.json#L6
[V4]: https://github.com/AlexZhangji/turbine-explorer/blob/efc5d2ecd12055f880a41b47215791c22d3656d4/src/energy.ts#L1
[R1]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/pyproject.toml#L10
[R2]: https://api.github.com/repos/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/git/trees/f658c5a4011c8b826707a65a3b11ce9301b0626f?recursive=1
[R3]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/ingestion/pipeline.py#L97
[R4]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/libs/vector_store/__init__.py#L13
[R5]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/libs/embedding/ollama_embedding.py#L65
[R6]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/mcp_server/server.py#L82
[R7]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/config/settings.yaml#L8
[R8]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/mcp_server/tools/query_knowledge_hub.py#L337
[R9]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/core/response/response_builder.py#L71
[R10]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/ingestion/chunking/document_chunker.py#L210
[R11]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/src/core/trace/trace_collector.py#L20
[R12]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/.github/skills/auto-coder/SKILL.md#L61
[R13]: https://github.com/jerry-ai-dev/MODULAR-RAG-MCP-SERVER/blob/f658c5a4011c8b826707a65a3b11ce9301b0626f/.github/skills/package/SKILL.md#L40
