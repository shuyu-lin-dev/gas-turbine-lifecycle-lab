# FE-BASE 范围与验收冻结

日期：2026-11-03（Asia/Shanghai）。本项采用根 AGENTS 2.2、DEV_SPEC/TASKS/ACCEPTANCE 2.0；FE-BASE-A01～A05 全部必要。本文补齐执行方法，ACCEPTANCE 原文语义保持。任务状态统一登记于 TASKS.md。

## 来源与准确版本

- 来源：Issue #3，shuyu-lin-dev，2026-11-03T08:45:29Z；trigger `a15501c1f508f9e84e3578dfa9bf04e8`。
- Ticket：`914d2ac32b5d2f130d718138164c8bab`；session：`worker-914d2ac32b5d2f130d718138164c8bab`。
- 工作树：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/frontend-upstream-baseline-914d2ac32b5d`；分支：`agent/frontend-upstream-baseline-914d2ac32b5d`。
- 唯一 origin：`https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git`。
- 集成基准、比较基准、预期 merge-base：`86e521184a4d5bbd42dfe93a48999fa714c233f2`。刚 fetch 的 origin/main 与初始 HEAD 均相同。
- 前置 M0-00 已 LOCKED；S=`3980867902a9c102f18894e9acf65b8c72051b19`、C=`b4ae8e35d7823da484d6ab0ec3dad41c55fbdc61`、E=`398b923f01eb97bcf7c22e9e31f344662c2365c5`、K=`2d462fade2f7c3d04f304af471e46c84aaf29e8c`。PR #2 已合并；K 外部回执评论 `6599010057`，实际集成回执评论 `6599090173`。当前分支包含全部祖先，39项正式证据哈希已逐项核实。
- 前置基线 `baseline/M0-00-b4ae8e35d782` 指向 E；前置正式 SHA256SUMS.json 哈希 `fed3f234403a599e97ad28052d52b1275f186b22ebd9608e25d1d46fbeed77b5`。

本文件首次提交为 S；S 的最终 SHA 在后续提交及外部回执引用。C 必须严格后于 S，包含全部行为、测试、依赖和配置。核查入口要求 HEAD=C、工作树干净、冻结文件与 S 相同。修改测试、实现或行为配置形成新 C 并重验。E/K 均不填自身最终 SHA。

## 允许范围

完整取得固定 turbine-explorer；通过真实 Git subtree 导入 `vendor/turbine-explorer`；必要兼容修正、来源/许可记录、验收工具、真实检查和浏览器验证、干净检出复现及证据。活动授权说明按 Issue #3 更新，M0-00 冻结及历史证据保持字节一致。

本项交付完整上游独立基线。Vue、业务 HTTP/SSE、同源 /viewer 桥接、业务告警、RAG 均按后续任务派发。参考克隆仅用于比对；实际安装和运行使用任务目录内的原版副本及主仓库 vendor。完整 M0～M4、27项任务、145条必要验收、16个资产及其许可证保留。

## 固定来源与输入

上游 `https://github.com/AlexZhangji/turbine-explorer.git`；commit=`efc5d2ecd12055f880a41b47215791c22d3656d4`；tree=`03487ef57f6bc957dfc83b890de1f1e700ed2841`。完整参考克隆 `/home/lsy/workspace/lab/_upstream/turbine-explorer`；通过 gh repo clone 取得并检出固定提交，工作树干净。采用 `git subtree add --prefix=vendor/turbine-explorer <参考克隆> <固定SHA> --squash`，记录实际导入 SHA 及 subtree trailers。源文件、锁文件和运行资源共62项；文件模式/路径由固定 Git tree 核对，内容由 [upstream-manifest.json](upstream-manifest.json) 核对，清单 SHA256=`f0162a27cee0ba6c33b3d8835ddd9273cd8cb04bb1a1f84e7c6d6ea3d76f2bc5`。

package.json SHA256=`3afdb8a78e894f19ccff44df9303ad4b5bcd9e4748d8fb376adb7259b8e26593`；package-lock.json SHA256=`b2be10e2180b7b59d7d792d863a91a9daaf1b4286badc91c5fc50034263ba2f5`。锁文件原样保留。原版与修正版本单独记录，任何本地补丁使用 `git diff <导入SHA> C -- vendor/turbine-explorer` 保存；无补丁时记录为空。

许可输入为根 LICENSE（AlexZhangji MIT）、THIRD_PARTY_NOTICES.md、public/environment/README.md（两套 Poly Haven CC0 HDR）、两份字体 OFL1.1、licenses/three-LICENSE.txt 及 public/licenses/。完整许可正文已读取；所有文件哈希在来源清单中。程序几何和音效由上游代码生成，作者声明未分发第三方参考影像。实际安装依赖版本与许可从锁文件及已安装 package.json/许可文件记录。

## 环境与工具

已实查 Node v24.22.2、npm 11.19.1，满足上游 Node >=22.18.0。当前 dsh 0.2.1-rc.3、Source revision2、Policy revision1、Executor revision2；maxWorkers=1，running=1/queued=0，实际 Ticket/session/path 一致。agent 为 lucy-assistant，目标 WRITE。有效 prompts 使用当前 revision4，原 scope/delivery 与 Issue #3 的真实开发授权共同适用；不修改 profile、模型、认证或配置。

浏览器为 Linux Chrome for Testing `156.0.8078.80`，agent-browser 0.41.0 取得。实际路径 `/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome`；Playwright `1.56.1` 通过真实 CDP 运行。viewport=1920×1080，deviceScaleFactor=1，locale=en-US，timezone=Asia/Shanghai，reducedMotion=reduce，headless=true。参数 `--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader`；实际 WebGL2 renderer 为 `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`。这是软件渲染基线，性能不在本项验收范围。[browser-environment.json](browser-environment.json) SHA256=`ec5d67b02c6a0cf48c78ca767b142decbfc1b8182431bcc03f0331eeaafd581e`。

主机缺少 libnspr4/libnss3/libasound2，且 sudo 需要密码。通过 apt-get download 取得实际 Ubuntu 包并用 dpkg-deb 解压至 `.scratch-runtime/browser-deps`，通过 LD_LIBRARY_PATH 提供；无替代库。实际包为 libnspr4 `2:4.35-1.1build1`、libnss3 `2:3.98-1ubuntu0.3`、libasound2t64/libasound2-data `1.2.11-1ubuntu0.3`。完整安装与失败信息保留。临时目录全部位于 `.scratch-runtime/`。Chromium Unix socket 要求较短路径，专用符号链接 `/home/lsy/.fe914tmp` 指向本任务 `.scratch-runtime/tmp`；TMPDIR/TMP/TEMP 均使用该链接，实际临时内容仍在本任务忽略目录，禁止使用 /tmp。

## 必要命令与独立预期

统一入口计划为 `python3 scripts/verify_fe_base.py --criteria S --candidate C --output .scratch-runtime/fe-base-C`。S/C 替换为已存在完整 SHA。工具保存 argv/cwd/时间/退出码/stdout/stderr 和 SHA256，失败即时终止，已保存证据保留。每次使用新输出目录。浏览器脚本为 `node scripts/fe-base/browser.mjs <URL> <输出JSON>`；依赖通过 `npm ci --prefix scripts/fe-base` 安装。独立预期来自 ACCEPTANCE、固定源码中的 UI 定义与 OrbitControls/GPU 接口语义，预期和阈值在此冻结。

| 条款 | 必要命令/接口 | 完整通过条件 |
| --- | --- | --- |
| A01 | git rev-parse、ls-tree、log、merge-base；来源清单逐文件 SHA256；git remote get-url origin | 固定 commit/tree 相等；导入提交含 git-subtree-dir/split trailers；导入 tree 与上游相等；完整62项可核对；无追踪 gitlink 或 vendor/.git；origin 仍为主仓库 |
| A02 | node --version、npm --version、npm ci、npm ls --all --json；现成 JSON 解析锁文件与依赖元数据 | 所有来源/许可与锁文件完整保留；实际版本记录；Node 满足要求；安装成功；采用下列原始命令 |
| A03 | npm run build；npm run preview -- --port 4173 --strictPort；真实浏览器操作 | 完整构建成功；真实 WebGL2 有连续 draw calls；旋转、缩放、外壳切换、全部原有部件查看与冷却叶片交互成功；无资源缺失、pageerror 或 console error；shader/context 错误不能忽略 |
| A04 | 原版副本和准确 C 的 vendor 分别运行 npm test、npm run build、npm run build:labs | 每个命令退出0；npm test 原始串联 quality/energy/language/blade/service/geometry，其中 geometry 包含 case/assembly；测试脚本原样保留，未跳过或替换；原始失败与本地补丁完整记录 |
| A05 | git clone --no-local --no-checkout 当前主仓库至专用忽略目录；git switch --detach C；全新 npm ci、npm test、npm run build、npm run build:labs；preview端口4174；同一浏览器脚本 | clone HEAD=C 且安装前干净；所有源码/资源均来自 C，依赖按锁文件取得；重复 A01/A02/A03/A04 的适用检查；无本机未追踪源码依赖；未请求任何 .glb；原有 GLB 资产不作为程序启动输入 |

原版副本由固定 commit 完整归档到忽略目录，参考克隆保持只读；使用原版实际依赖检查与构建结果进行比较。所有 build:labs 产物仅用于验证原始发布构建，不部署到作者域名。Vite 本项仅绑定127.0.0.1；4173/4174/4175在冻结时无占用；4175保留原版独立运行调查。浏览器版本/viewport/容差相同，干净检出复现不要求构建时间或散列完全相同。

## 浏览器操作与可观察断言

1. 访问 `/?lang=en&quality=balanced&experience=console&speed=0`，默认完整程序；读取实际 WebGL VERSION/renderer、画布尺寸和 GPU draw 次数。等待至少两帧实际渲染；单次可观察条件超时120秒，导航120秒，完整 browser 流程上限20分钟。纯时间等待不能替代条件。
2. 在页面执行仅观察的 init script：包装 WebGL2 getUniformLocation/uniformMatrix4fv/drawElements/drawArrays 及 instanced 变体，原函数原参数原返回值执行，按 canvas 记录 viewMatrix 和真实 draw 次数。避免读取像素、图像或截图，不修改 Three.js 对象/状态，不模拟 WebGL。主画布选用透视主场景 viewMatrix，排除 shadow/SSAO 的其他 camera；记录选择依据和实际矩阵。
3. 在 #scene 未被控件覆盖的中央区域真实 pointer drag，移动160×80 CSS px；比较主场景 viewMatrix 的3×3旋转部分，最大绝对差 >1e-5；GPU draw计数继续增加。缩放使用该区域真实 wheel -600，viewMatrix 平移向量长度减少 >0.01，+600后增加 >0.01。记录输入坐标、前后矩阵与差值。无输入的静止对照确认旋转部分最大差 <=1e-5；运动控制关闭。镜头初始姿态取固定源码，不通过预期结果倒推。
4. 点击 [data-housing=enclosed] / [data-housing=cutaway]；#app data-housing、aria-pressed、URL housing 与选择完全一致，画布继续 draw。通过 draw 统计或渲染对象变化证明模式确已作用；若仅 UI 变化未能证明几何更新则失败。
5. 点击 .parts-launch 打开实际 dialog，打开组件目录；逐项选择固定源码定义的10个入口：turbine-1、single-blade、compressor-1、combustor、lower-case、upper-case、exhaust、turbine-rotor-2、turbine-rotor-3、turbine-rotor-4。每项按钮 aria-pressed=true、标题/面包屑与固定名称相同，检视画布有新的真实 draw。必要时打开“其他装配件”原有 details。针对可抽出组件执行 extract/restore，输入值100/0、输出及实际投影位置发生相应变化；组件独立检视支持旋转缩放，使用相同矩阵断言。
6. 打开冷却叶片，依次点击 cooling/surface/layers，aria-pressed及 blade-hero 状态正确且 draw 继续。切换冷却流动，aria-pressed true/false；选择 YSZ 后 aria-pressed=true，再次点击取消。关闭 dialog 回到整机。
7. 单独访问 `env=studio` 与 `env=contrast`，要求两套 HDR 请求200、#app data-environment=studio-hdr；所有页面字体、脚本和素材请求记录 URL/status/resourceType；全流程无 requestfailed、>=400、pageerror 或 console.error。console.warn完整记录并评估，不隐藏资源或 WebGL 错误。浏览器请求不得包含 .glb，证明源程序不以导出 GLB 为运行前提。

## 回归、失败、审查与交付

受影响 M0-00 回归：原 LICENSE、16个模型资产、完整 evidence/M0-00/ 及 scripts/ 原有3文件与比较基准逐字节相同；ACCEPTANCE 原文哈希 `6593f43c6605311bec2375f0455b2e42940052a200ecc38f37da1bc93d382bb1` 保持；27项任务和145条必要验收编号、依赖及其他状态保持。当前只更新活动授权，不改变已锁定行为；M0-00 原核查工具含历史 Ticket/path 限制，采用实际现存 Source/Policy/Executor/prompts/身份/祖先关系与文件哈希核查作为本项适用回归，不篡改历史工具。`git diff --check` 检查自有文件，原版文件空白按固定源树来源记录，不能擅改源文件只为格式检查。未追踪行为文件阻止候选验收。

核查工具还须真实验证错误边界：错误 candidate、S=C、脏候选均拒绝；不存在静态资源不得被误记200（核查 MIME/内容）；缺少 WebGL/资源失败立即失败，禁止 Mock。调查启动失败为路径查找、缺少实际依赖和 Unix socket 路径长度，保留原始事实；对应环境条件经真实 Chrome WebGL2 探针通过后冻结。

固定比较 `git diff 86e521184a4d5bbd42dfe93a48999fa714c233f2...C`，记录 merge-base 和全部候选文件、未提交状态。worker 使用只读 Standards/Spec 子代理，不增加开发 worker。随后提交 draft PR 和 Issue #3 审查回执，含 S/C、基准、逐条结果、实际命令/退出码、哈希、复现命令、浏览器入口和服务生命周期。等待协调会话对应候选的独立审查及实测。全部通过后形成 E（证据及 VERIFIED 登记），创建全新 `baseline/FE-BASE-<C前12位>` 指向 E，真实 push并通过 gh回读commit/tree与tag；K登记LOCKED并引用已知祖先，push后在Issue外部回执记录远程K/PR head。正式PR交协调会话最终核查、合并和实际集成；本worker停止于FE-BASE交付。

CI通过 gh读取准确C的check-runs/statuses及现有保护。零条CI只记无上报检查，本项必要检查为上述本机真实命令，不新增CI门或放宽既有保护。必要FAIL/BLOCKED/SKIP/NOT_RUN均阻止验收。

## Skills 计划

- dsh-superagent-github：已用skill工具；实际 `/mnt/e/DSH_SuperAgent/dsh-superagent-prototype/skills/dsh-superagent-github/SKILL.md`，SHA256 `7907778f735550f642b7e3d511007be9ae67d29965aa17ac50119a0eeeb8e54b`；用于原始派工/回执和GitHub身份、PR交付。
- agent-browser：已用skill工具，`/home/lsy/.dsh/skills/agent-browser/SKILL.md`，SHA256 `fd4ddd37ddb69f37ebc62e086566fcf606bbd09a5b4e4e7d7a6c4f0f94fdee47`；通过实际CLI加载 core --full，采用独立浏览器上下文、真实操作/等待/console/network观察方法；CLI负责取得真实Chrome，矩阵观察使用Playwright实际浏览器接口。无截图或视觉工具。
- code-review：候选阶段使用skill工具，实际 `/home/lsy/.dsh/skills/code-review/SKILL.md`，SHA256 `9c921a8d88138a41401d8897ca1bb852088ab1b7b605cdd04edc13e3e8aab6dd`；固定比较基准并行只读Standards/Spec。
- diagnosing-bugs：出现代码或验收反馈缺陷时加载并记录实际哈希；按复现、原因、修复、新C、回归保存。环境依赖正常取得已在调查中完成。
- 无新增业务、术语、重要架构决策或模块接口；implement/tdd、domain-modeling、codebase-design不适用。已明确27项任务与依赖，grill-with-docs/grilling、to-spec/to-tickets、triage不适用。不启用上游skills，不更新全局skills；来源为GitHub，Feishu不适用。
