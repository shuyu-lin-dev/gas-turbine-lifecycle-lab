# FE-BASE 验收报告

状态：VERIFIED。准确被测代码提交 C、worker 两次完整实测、协调独立 Standards/Spec 审查和实际复验均通过。远程证据基线及 LOCKED 登记由后续交付步骤记录。

## 任务与版本

- task_id：FE-BASE；Issue #3；PR #4；dsh Ticket `914d2ac32b5d2f130d718138164c8bab`。
- actual_worker/session：`worker-914d2ac32b5d2f130d718138164c8bab`；branch：`agent/frontend-upstream-baseline-914d2ac32b5d`。
- S：`7704387252b293bee1ec671b440164a12287ca16`；tested_code_sha C：`ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f`。
- comparison_base / merge_base / 前置实际集成基线：`86e521184a4d5bbd42dfe93a48999fa714c233f2`；前置 M0-00 已 LOCKED 并实际集成。
- 上游 `AlexZhangji/turbine-explorer` 固定 commit `efc5d2ecd12055f880a41b47215791c22d3656d4`，原始 tree `03487ef57f6bc957dfc83b890de1f1e700ed2841`。
- 真实 subtree 导入提交 `459a359afd4e2e2bdaca05acccc4b65f79b741d8`，压缩历史提交 `8053436d63df1790eaf0a6011de34d1143cd5e1a`；完整62项文件与来源、许可保持。
- 实际 vendor tree `fc5ac885bdb2bc8272ab77d74473a46e4b5da45c`；唯一上游兼容补丁为部件百分比四处 output 选择器。完整[来源及实际文件清单](worker-handoff/main/source.json)和[补丁](worker-handoff/main/upstream.patch)保留。
- [冻结规则](../../criteria.md)原文、根 ACCEPTANCE、既有 M0-00 证据、许可证及16项模型资产与基准逐字节保持。

## 必要验收

| 条款 | 最终结果 | 实际依据 |
| --- | --- | --- |
| FE-BASE-A01 | PASS | 固定 commit/tree、完整62项原始blob SHA256、真实subtree trailers、唯一origin、完整导入及候选补丁核实 |
| FE-BASE-A02 | PASS | Node24.22.2/npm11.19.1；原始锁、MIT/OFL/CC0及第三方来源说明保持，实际依赖/许可元数据核查 |
| FE-BASE-A03 | PASS | worker主运行、worker干净运行、协调独立运行的真实Chrome/WebGL2全部完成原有交互及新增镜头负对照 |
| FE-BASE-A04 | PASS | 原版与实际vendor的npm ci、npm test、npm run build、npm run build:labs、npm ls均退出0；原测试脚本未改 |
| FE-BASE-A05 | PASS | worker和协调分别从准确C建立独立git clone --no-local，分离HEAD、全新安装与完整适用检查通过，无未追踪源码依赖、无GLB请求 |

required_total / passed / failed / blocked / skipped / not_run：5 / 5 / 0 / 0 / 0 / 0。

| 实测 | 采集命令 | 退出码 | 完整浏览器操作/资源请求 | 缩放回归 |
| --- | --- | --- | --- | --- |
| worker main | 32 | 全部0 | 32 / 20 | PASS |
| worker clean | 26 | 全部0 | 32 / 20 | PASS |
| 协调独立clean | 26 | 全部0 | 32 / 20 | PASS |

原始[主命令记录](worker-handoff/main/commands.json)、[worker干净命令记录](worker-handoff/clean/commands.json)及[协调独立命令记录](coordinator-independent/commands.json)包含实际argv、cwd、时刻、退出码、stdout/stderr和输出哈希。全部运行采用冻结Chrome156.0.8078.80、1920×1080、WebGL2 ANGLE/SwiftShader。无pageerror/requestfailed/console.error，运行未请求GLB；警告原文保留，PMREM环境模糊采样裁剪和Vite体积提示均按原程序记录，不作硬件性能结论。

真实操作覆盖整机及部件画布的静止对照/旋转/双向缩放、外壳切换、10个组件/面包屑/抽出归位、叶片模式/流动/涂层、两套HDR；没有以图片或截图代替断言。镜头旋转阈值1e-5、双向缩放0.01、单条件120秒和完整流程1200秒保持。每个镜头7个即时checkpoint记录输入、实际矩阵、上传及draw来源，失败路径保存当时观测。

## 镜头缺陷反馈与修正

原独立C5的+600等待超时继续作为FAIL保存于[原独立浏览器](worker-handoff/independent-C5-FAIL/candidate-browser.json)与[命令](worker-handoff/independent-C5-FAIL/commands.json)。其哈希分别为 `11d2dec8c4dca3249dfad07268b5b95ecd9f19478c2525217e2ac2362067b808`、`0537331563b666e0a3b0fb758f3311c77a5a983fbab1a1baeee563dc2db26991`。原JSON缺少中间矩阵/事件，该次确切调度继续作为证据限制保留。

实际反馈记录显示，未收到wheel时，拖动余下运动已使距离22.22591295968092→22.21568041582251，跨越0.01。[红色回归](worker-handoff/diagnosis/regression-red.json)让旧距离判断返回true，独立预期false，退出1；修正前判断哈希 `8176cb3bfafe3d6cd3563881424706d8020c1a21bf86625eadf65f1d2c02dbf9`。新共享判断要求可信输入到达对应canvas、事件完成处理，以及输入之后真实viewMatrix上传和draw，再执行原阈值。[绿色回归](worker-handoff/diagnosis/regression-green-01.json)、[主完整缩放回归](worker-handoff/main/candidate-camera-regression.json)、[worker干净回归](worker-handoff/clean/candidate-camera-regression.json)及[协调独立回归](coordinator-independent/candidate-camera-regression.json)均通过。观察器保持原GPU函数参数和返回值，DOM监听为passive，不更改相机、控制器或GPU结果。

历史候选失败、C4旧干净复现中断、启动依赖/路径/Unix socket失败、真实404及候选版本错误边界、推送TLS重试均在[原worker归档](worker-handoff/previous-worker-C5/)与[诊断归档](worker-handoff/diagnosis/)保留；原始失败未被成功覆盖。

## 审查与独立复验

Worker Standards reviewer `cd910d19-a6ee-4d01-9430-84bf99f37f0a`、Spec reviewer `7262986a-cbb4-4493-80b2-e2174092a748`，对固定base→C完整79文件只读审查均PASS。[完整记录及skills版本](worker-handoff/diagnosis/worker-review-C6.md)保留；一项非阻断错误监听重复维护建议登记。

协调聊天 `01a1a186-0661-7540-b368-f70449bdae16` 的独立 Standards `/root/febase_ab07372_standards` 和 Spec `/root/febase_ab07372_spec` 覆盖完整79文件/9提交，无需整改。其全新独立clean运行26条命令全部0、五条必要验收PASS，环境与阈值保持，未设置DSH worker身份变量。独立整机静止差值0、旋转0.24453306198120117、放大距离差3.459983172276054、缩小3.422805031169947；部件静止差值0、旋转0.6635561883449554、放大10.675755544370428、缩小10.51463985942252。

[协调完整独立记录](coordinator-independent-review.json)原始SHA256为 `64526dd2f202477658381901aa2da395299fc6e3b9d024c1b2247b6cad5b54fe`；最终通过及继续交付授权来自Issue #3评论 `6607173203`。独立[SHA256清单](coordinator-independent/SHA256SUMS.json)为 `5affaca0c63b56e64112318b7d74007b2f505163bca65cebcdf44b2df8ae5885`；浏览器为 `e9a9553e3327acacba05c94503e9c762481293f93252e005d76eb39dc8c0c900`；命令为 `092e7a72d2fac213edcca47c468c2d50afa0bf23286bfe25b9d335a0cce378ab`。

## 证据与复现

[最终VERIFIED数据](verification.json)登记准确C及所有必要结果。[worker封存清单](worker-handoff/SHA256SUMS.json) SHA256为 `b6b18b3b4a51d390e10f094d7bb2a1d73bbce3d8da1126cc878daf3ce7f06f10`，保留提交协调复验时174项原始交接。该包中的pre-review状态字段记录封存时状态；最终协调通过以本报告及独立原始记录为准。worker主清单 `b2739eefc94aa4efea0978de9aac4ce4c67514d3e5fbd7281a89d889ff876d21`，worker干净清单 `bd256f0dda5fa6de300f3ca69a79679fe033a7b9d66b92876ea43d40da3739b4`。本目录总清单在同目录保存，外部登记其最终哈希，避免自引用。

准确C复现使用[独立运行说明](../../../../docs/FE_BASE.md)及冻结入口，环境变量采用实际Chrome、已声明共享库和专用忽略目录TMPDIR：

```sh
python3 scripts/verify_fe_base.py --criteria 7704387252b293bee1ec671b440164a12287ca16 --candidate ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f --output .scratch-runtime/fe-base-independent
```

干净复现在全新独立clone分离HEAD=C后运行同入口并添加`--clean`，采用全新输出目录。源码/资源从C取得、依赖按原锁安装。独立实际命令、环境说明和clone路径已在协调记录中保存。正式各次preview及浏览器均由入口回收；审查preview为另行管理的同C服务，生命周期与外部交付回执关联。

## 交付边界

当前准确C的check-runs=0、commit statuses=0，仅记无上报CI；既有保护保持。此证据提交仅含原始证据和必要VERIFIED登记，不修改实现、测试、依赖、行为配置或冻结语义。基线标签应全新指向本证据提交，真实远程核实后再形成状态登记K。E/K自身最终SHA通过Git历史及外部回执关联，不在自身内容中自引用。

当前只完成FE-BASE功能验收，后续M0～M4任务状态与依赖保持。正式PR交协调最终核查，worker不approve/merge/auto-merge。后续任务需要本项实际集成并单独派发。
