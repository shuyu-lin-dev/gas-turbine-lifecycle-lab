# FE-INTEGRATE 范围与验收冻结

任务 FE-INTEGRATE「Vue 业务壳与同源 viewer 桥接」；Issue #7；trigger `6618ff4acad5e9586f4bba62b50b259c`；Ticket `6ba251e86b41f5c03f50f84a0180213c`；worker/session `worker-6ba251e86b41f5c03f50f84a0180213c`；工作树 `/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/vue-viewer-bridge-6ba251e86b41`；分支 `agent/vue-viewer-bridge-6ba251e86b41`。当前只完成本项，后续 M0-02 单独派发。

## 依据、前置与范围

根规则 2.2，DEV_SPEC/TASKS/ACCEPTANCE 2.0，27项任务、145条必要验收及依赖保持。固定 comparison_base/merge-base=`d4624599072312f86c65c12e77407b25e3005a3b`，tree=`865ad37ffff720c4a76361cfd50f1398d777708e`。HEAD 与基准相同，工作树初始干净；实际 gh 身份 lucy-assistant，目标仓库 WRITE，origin 正确。M0-01 已 LOCKED：S=`18a9210947e0114a8bbc6a10c8864701dfb8539e`，C=`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`，E=`32558e25e394dda6e1fffee5970ae30bc378e7d7`，K=`779035fbdb7117770e0df23b537b943ac704cf94`。已实际读取 PR #6 MERGED、Issue #5 回执6611895677/6612184100、远程 baseline/M0-01-01569c205a8d→E；本分支包含K。前置 REPORT/总清单哈希分别 `3f6a7c6208463a92e76ff33fbb8bade55c3c699e935905975f98a5954bd870ad`、`63050ec12278fd8f120befe6c61634e5491fc0cca48cd617cb37e08891376381`，本地重新计算一致。

允许修改 Vue 页面、共享协议、完整 vendor viewer 的 embedded/bridge/必要资源释放、构建部署、实际测试入口和相关文档。沿用 subtree `459a359afd4e2e2bdaca05acccc4b65f79b741d8` 与上游 `efc5d2ecd12055f880a41b47215791c22d3656d4`，保留完整源程序、许可、原始锁和16项模型资产。保留 M0-01 的独立前后端、健康配置、错误路径与既有验收入口。当前任务新增行为由本次S授权；前置健康行为语义保持。真实运行数据、SSE、告警及完整业务测点归属后续任务。

本文件及固定输入的首次提交为S；S最终SHA由后续提交与回执引用。S以前不写应用或测试。所有行为、依赖、测试及配置纳入C，验收要求HEAD=C且干净，S为严格祖先，冻结输入与S逐字节相同。

## Interface 与消息精确定义

测试 seam 为真实 Window.postMessage、Vue/iframe 的用户DOM操作、HTTP/CLI/部署入口、原始WebGL调用观察。仅四种消息，JSON对象字段必须完全符合下述定义，不接受额外字段、缺失、错误类型或数组冒充对象。发送使用 location.origin 的明确 targetOrigin；父只接受当前 iframe.contentWindow，子只接受 window.parent，双方 event.origin 必须等于各自 location.origin。先验证来源，再验证数据，拒绝消息不抛出页面异常、不改变业务状态。

公共字段：`schema_version` 固定字符串`1`；`type`；`viewer_instance_id` 为1～64个ASCII字母/数字/下划线/连字符；`context_revision` 为0～2147483647安全整数，只有ready允许null；`payload`为对象。业务消息另有 `run_id/device_id`，均为1～64个ASCII字母/数字/下划线/连字符。布尔、NaN、Infinity、小数、负数及超界revision拒绝。组件编号为1～64字符，匹配`[a-z][a-z0-9_]*`。语法非法编号拒绝；语法有效但未映射编号保留原编号并返回 unavailable，不映射相似部件。

- `viewer-ready`：子→父，准确五个公共字段，revision固定null，payload={}，省略run/device。父每个实例只处理首次合法ready；重复ready不重发过期数据或回退上下文。
- `select-component`：父→子，公共及run/device字段，payload准确为 `{component_id, request_id}`；request_id为1～64个ASCII字母/数字/下划线/连字符。子必须已绑定且三项context完全一致。选择改变模型选中状态和镜头，回传一次component-selected；同context同request_id重发不重复执行或回执，不同component复用request_id也拒绝。请求记录持续至context更新或销毁。
- `component-selected`：子→父，公共及run/device字段，payload准确为 `{component_id, request_id, trigger, result}`；trigger=`request|user`，result=`selected|unavailable`。selected仅用于已知映射五组件，未知编号仅unavailable。request回执必须对应父当前待确认request_id和component；过时/未知/重复回执不触发联动或覆盖较新的选择。user选择必须带新request_id；父去重，同一动作只更新一次。父接收不向子回发select，消除循环。
- `update-component-state`：父→子，公共及run/device字段，payload为下述完整快照，是更新上下文的唯一消息。未绑定采用完整快照；更高revision清除旧选中/测量/颜色/请求去重记录并绑定新run/device；相同revision只接受相同run/device；低revision拒绝。相同context的快照完整替换状态，不做隐式合并。不产生选择回执。

快照准确字段：`selected_component_id`（null或合法组件编号）；`event_time`、`received_at`（null或可经Date解析且toISOString完全相等的UTC毫秒ISO时间，例如`2026-11-03T00:00:00.000Z`）；`measurement_quality`=`valid|invalid|stale|no_data`；`components`准确包含五个唯一component_id，顺序任意，每项准确字段为component_id/status/measurements。status=`normal|attention|alarm|unknown`；measurements为0～32项，准确字段tag_id/value/unit，tag_id同ASCII标识规则，单组件内唯一，value为有限number或null，unit为1～32字符非空白字符串且无控制字符。valid要求两个非null时间且received_at>=event_time；非valid所有部件status=unknown，invalid/no_data测量值必须null；no_data两个时间均null，invalid/stale可保留两个已有时间或均null，不能仅缺一个。失效或缺测不得转为零；stale可保留原有限值但文字显示过期。时间、状态和值在DOM显示，显示UTC；没有event_id和告警业务字段。

父挂载/应用重载以crypto.randomUUID创建新实例，通过`/viewer/?embedded=1&viewer_instance_id=...&lang=zh&experience=console&presentation=console&speed=0`传入。卸载清除父监听、待确认请求与旧帧引用。页面控制重载建立新iframe；检测到已有帧再次load时同样建立新实例。初始化前父选件只保存最新快照，不发select；ready后只同步最新完整快照。子绑定以前可作本地视觉操作，不发业务选择。普通选件不增revision；设备或批次切换（包括切回原范围）每次递增revision，保留同一iframe与实例。达到revision上界时明确拒绝继续递增。快照更新与选择不改变设备/批次身份。

## 固定夹具、教学映射与独立预期

[bridge-fixture.json](bridge-fixture.json) SHA256=`8e099d47e6599ec3d3cce92df6931e1c22a2105aa2e5e232c8e751f4445f09a8`。A为revision0、fixture-device-a/fixture-run-a，排气560°C/alarm，燃烧室attention，前轴承unknown；B为revision1、fixture-device-b/fixture-run-b，所有unknown、空测量、两个null时间。预期来自本文件及根规格，在实现以前写入。fixture仅通过明确标注的“桥接夹具”操作装载。默认页面显示“未接入运行数据”，应用不写业务API、不伪造接收结果。

本阶段版本化映射 bridge-map-v1：compressor→`compressor-rotor-01`；combustor→`combustor-module-06`；turbine→`turbine-rotor-1`；bearing_front→`sectioned-front-bearing-housing`；exhaust→`exhaust`。它们来自实际完整model.root；排气教学几何不声称传感器位置。使用真实节点全部可见后代Mesh作为状态对象，不生成替代模型。`aux_pump`为冻结未知编号，显示“该部件暂不可定位 aux_pump”。节点缺失启动立即失败。

状态材质以原材质clone设置emissive颜色，normal=`#a7b5c6`、attention=`#f0bd67`、alarm=`#ff9292`、unknown=`#64748b`，emissiveIntensity=.45。选中使用独立青色BoxHelper表示，保留状态着色；未知编号清除前一选中标记。状态更新不得破坏原共享材质/其他部件。新context采用B时旧红色及560数值完全清除。选择依据真实几何中心调整镜头，viewer可通过部件按钮和真实canvas拾取选择；按钮与鼠标拖动、展示控制不修改run/device。离开嵌入模式保持原演示与工坊交互。

不读取图像或截图。观察器只包装真实WebGL getUniformLocation/uniform3f/uniform3fv/useProgram/draw方法，保留原参数/返回值，记录emissive实际上传和随后同program的非零draw；sRGB→linear用标准公式独立计算，上述色值×.45，绝对误差<=1e-6。结合完整场景非零draw、DOM实际值、真实部件选择及GPU着色证据判断A05，不以DOM镜像单独证明渲染。镜头旋转/缩放沿用FE-BASE的独立矩阵阈值1e-5与距离.01。

## 环境、命令与必要验收

实查Node24.22.2/npm11.19.1、Python3.12.3、Docker engine29.5.3/Compose5.1.4。Chrome156.0.8078.80真实路径`/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome`；Playwright1.56.1沿用frontend锁。1920×1080、deviceScaleFactor1、Asia/Shanghai、reducedMotion=reduce，WebGL2使用ANGLE SwiftShader，参数`--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`。本项不验收性能。实际依赖按锁重新安装，禁止Mock、网络替换或合成MessageEvent代替真实Window来源。

本项所有临时文件和缓存设于`.scratch-runtime/fe-integrate/`；TMPDIR/TMP/TEMP指向该目录，必要短socket符号链接允许指向该目录，禁止/tmp。系统缺少uv的PATH入口，已定位前置uv实际二进制及Chrome必要系统库，仅可作为已核实平台工具使用；源码/依赖安装与输出独立，复现文档记录实际路径与哈希。端口实查5173、4175、4177、4178、8201、8202、8280、8281空闲，运行前重查。原M0-01入口继续可执行，测试其健康页面时不自动挂载viewer：默认仍提供既有服务连接页，导航至桥接工作区再挂载。

统一入口：`python3 scripts/verify_fe_integrate.py --criteria <S> --candidate <C> --output .scratch-runtime/fe-integrate/run-<唯一编号>`；干净检出加`--clean`。要求HEAD=C、干净、S严格祖先、base包含、fixture与S一致；错误candidate、S=C、脏候选均必须拒绝。每条命令保存argv/cwd/时间/实际与预期退出码/stdout/stderr/哈希。浏览器脚本`node frontend/tests/bridge.mjs <同源URL> <输出JSON>`，协议调用测试`node --experimental-strip-types --test frontend/tests/protocol.test.ts`。全部正常命令退出0；预期拒绝明确断言退出1。子条件最长120秒，完整浏览器最长1200秒，容器构建最长1200秒。

| 条款 | 实际操作与独立通过条件 |
| --- | --- |
| A01 | frontend/vendor分别npm ci、typecheck/build（vendor含原npm test/build:labs）；前端构建包含完整viewer到dist/viewer，Vite开发同源代理真实viewer开发进程；Docker/Nginx部署相同产物。真实访问/viewer、/viewer/和刷新，iframe尺寸变化后canvas匹配可用区域；字体/HDR/脚本全部正确路径与MIME，缺少/viewer/assets/missing.js真实404。独立/viewer/原演示完整可操作。 |
| A02 | 对真实postMessage及独立协议interface验证四种合法消息和每种缺字段/额外字段/错误版本/类型/载荷/标识/revision/部件/时间/值/质量；含0和2147483647有效，负数/小数/2147483648/字符串/布尔/NaN/Infinity无效。协议interface测试使用真实对象输入及独立布尔预期，浏览器验证拒绝不会改变业务。只记录四类协议消息。 |
| A03 | 初次挂载、应用重载和已有iframe再次load，实例均更新；ready null且没有run/device，合法ready以后第一条父消息为最新完整快照；未绑定真实子页面选择不回传业务；绑定后实际选择携带正确context。初始化期间父选择和切换最后一次值在ready后出现，无旧选择消息。 |
| A04 | 使用真实额外same-origin iframe作为错误source，另起不同端口/localhost origin的页面发送错误origin，真实当前父/子窗口发送错误实例、未知类型、非法部件、错误上下文、旧revision和旧ready。前后run/device/revision/选择/数值/GPU状态保持；保存event.origin与source对应实际窗口的观测，禁止dispatchEvent伪造来源。明确targetOrigin错误目标不会送达。 |
| A05 | 夹具A后逐项父选件、viewer按钮及canvas选件，五映射都回报正确ID且绘制继续；状态文字/560°C/时间严格等于夹具，GPU实际上传并绘制状态颜色。未知aux_pump仅unavailable并显示真实ID。重复request、迟到/重复ack不增加业务联动计数、不覆盖最新选择；排空任务后消息数稳定，不形成循环。 |
| A06 | 同一frame切换device、run分别递增revision并清除旧业务状态；相同revision不同run/device、低revision快照及选择均拒绝；普通选件revision保持。ready前最新选择和context正确同步。连续五次真实挂载/卸载观察父message监听净数量回到初值、旧窗口发消息无业务作用、iframe/canvas数量保持、旧frame回调/RAF不增长、WebGL上下文及材质/几何/纹理释放（真实delete调用或context销毁）。 |

干净复现：在当前忽略目录用`git clone --no-local --no-checkout`创建独立clone，分离HEAD=C，重新npm ci、构建部署及完整六条浏览器验收，不共享node_modules/venv或未追踪源码。真实Chrome/系统库/uv可复用已声明平台工具。干净输出TMP和cache仍归该clone忽略目录。

受影响回归：M0-01五条必要行为全部用原入口的Run.local/containers及真实测试重跑；原健康协议/配置拒绝用例和API代码保持。FE-BASE原test/build/build:labs与完整浏览器操作（整机旋转缩放、外壳、10部件、叶片、HDR）在当前完整viewer独立入口重跑，原16资产/许可/前置证据哈希保持；无需重新克隆或导入上游。既有verify_m0_01.py冻结的vendor无差异检查属于历史任务输入限制，本项通过新入口调用其实际运行行为并明确记录当前合法vendor变化，禁止篡改历史冻结或把历史工具的基准限制记作功能通过。M0-00的origin/identity/dsh配置指纹/单worker/Docker条件重新核实。所有必要FAIL/BLOCKED/SKIP/NOT_RUN均阻止验收。

## 页面设计与技能

沿用深蓝#101e32、面板#172b43、金属灰#a7b5c6、青色#63d8df、琥珀#f0bd67、红色#ff9292。中文Noto Sans CJK SC/思源黑体，标题28～40px、正文16px。默认服务连接页保持；导航增加“模型联动”，该页中央完整iframe约占桌面半宽，旁边明确的桥接夹具、设备/批次与部件操作和状态文字，左对齐，窄屏顺序布局，键盘焦点可见。只启用本阶段操作，始终显示未接入运行数据和教学模型来源；没有趋势/告警成功占位。原独立“结构学习”入口可访问完整原演示。设计已按当前教学用途和既定颜色核对，不使用截图或ASCII图。

- implement文件加载：`/home/lsy/.dsh/skills/implement/SKILL.md`，SHA256 `483bdc4ccf4ac31d86ac7beeaa0d0db80313e71e120bb8c59b3196ae5decd53d`，保留disable-model-invocation。
- tdd工具加载：同根tdd/SKILL.md `5505d25bbaa8fc14a79e4d20163936958992a2995b7f1dd1d6197edc9ed722e0`；tests.md `859f9e592c188fda4fc7277dd180e4ce9c7a2e13f6efe1f6f29eccc9d28c106a`，mocking.md `3ceb807fdf4a47d6a93d4d9a891e5ba6d362a6247bd08adc451feebfc17361ef`。逐项red→最小实现→green，项目禁止Mock优先；已有派工已确认上述seam。
- codebase-design工具加载：同根SKILL `2c20617f87ec8af6a434859f381b2f061a69b530444e74eb39e78bb016a6d1e2`，共享协议与真实窗口interface，父管理context，子管理场景。
- frontend-design工具加载：同根SKILL `d91970639e9f5c37682ac7ab60094d35f1c7c1f38d731bd56396563aee10c1d3`，采用上述既定颜色与阶段内容。
- agent-browser工具加载：同根SKILL `fd4ddd37ddb69f37ebc62e086566fcf606bbd09a5b4e4e7d7a6c4f0f94fdee47`，已完整加载CLI core说明；采用隔离session、真实DOM/网络/控制台与等待；可复现多窗口/GPU入口采用Playwright驱动同一实际Chrome，如实记录差异。
- dsh-superagent-github工具加载，实际`/mnt/e/DSH_SuperAgent/dsh-superagent-prototype/skills/dsh-superagent-github/SKILL.md`；候选时code-review分别Standards/Spec只读审查固定base→准确C完整差异；遇真实缺陷加载diagnosing-bugs并保存反馈。版本和引用在实际使用时核实。
- domain-modeling、grill-with-docs/grilling、to-spec/to-tickets、triage、prototype、research、wizard不适用：没有未决产品含义、新领域术语、重要架构取舍、需求重分配或人工配置步骤。不存在相关ADR目录，不创建占位ADR。上游skills保持参考状态，不启用或修改全局skills。

## 审查与交付门

准确C六条实测、干净复现及受影响回归通过后提交draft PR和Issue #7交接，保存固定base/merge-base、完整差异、S/C、worker/session/worktree/branch、逐条结果、命令/退出码、原始失败、证据哈希和复现入口。保持C等待协调聊天`01a1a22f-d503-7cf0-bad4-ad8dd9d707a8`另行启动全新上下文独立Standards/Spec及实际复验。确认缺陷形成新C重验复审。

必要项及独立审查全部PASS后，E只归档证据与VERIFIED，引用tested_code_sha=C；全新baseline/FE-INTEGRATE-<C前12位>→E，推送核实远程SHA；K只登记LOCKED及已有S/C/E/远程结果，推送后原Issue外部回执核实准确K和PR head。E/K不改行为或验收，不填自身最终SHA。最终head新增差异继续交全新独立会话核查。worker禁止approve/merge/auto-merge/gh-owner；协调负责最终核查、当前授权合并及实际集成。交付本项后停止。
