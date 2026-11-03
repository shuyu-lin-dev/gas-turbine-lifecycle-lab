# M0-01 验收冻结

任务：M0-01「Vue 与 Python 前后端独立运行」。来源 Issue #5，trigger `02ba12d14c5bf71b8b2927352df07f93`；Ticket `810d967dfbff4f0b93ef72c858f5a6b6`；worker/session `worker-810d967dfbff4f0b93ef72c858f5a6b6`；分支 `agent/vue-python-runtime-810d967dfbff`。

## 权威与基准

根规则2.2、DEV_SPEC/TASKS/ACCEPTANCE2.0，完整27任务与145条必要条款保持。固定 comparison_base/merge-base=`b8ad3150cf4480f8e205926541aeeccb072f7f80`，tree=`3c1a4ac1f0f197c56d0ec0231a80f51f0081666d`。实际 HEAD、远程 main、PR #4 MERGED、K祖先关系和基线已重新核实。FE-BASE LOCKED：S=`7704387252b293bee1ec671b440164a12287ca16`，C=`ab07372aa223b1828a70a4ed37c2ac15b5d3ef2f`，E=`a7966085071051d07cb7e80d0843a07ad9687183`，K=`efb0a5c6cf5e44eb9297d39ea88201a4610bf15e`，baseline/FE-BASE-ab07372aa223→E。Issue #3回执6607816699、6607856530、6608042226已完整读取。前置总清单SHA256=`8a3461de61ecdf1c4bd658387e087e78cce220f775b895439f476ea81574d0ef`。

S为包含本文件的冻结提交，由后续C和证据引用其准确SHA。S提交以前不编写应用或测试。当前范围限于frontend、backend、两角色部署、必要文档和验收工具。保留vendor完整文件、来源/许可/锁、16项assets、原验收语义、既有证据。完成M0-01后停止，FE-INTEGRATE等后续任务单独派发。

## Interface、配置与独立预期

测试seam为真实HTTP进程、Vue页面DOM/真实网络，以及两端公开CLI/Compose入口。沿用Issue明确授权的接口验收，无需新增普通开发审批。API只提供本阶段健康信息及FastAPI文档；Python不提供Vue dist，不依附Spark。

`GET /api/v1/health`：200、application/json；对象准确字段如下，顺序不限、字段和值完全一致：

- schema_version：string，`1`。
- service：string，`gt-lifecycle-api`。
- version：string，`0.1.0`，取自实际安装的Python发行包元数据。
- status：string，`ok`，表示当前HTTP进程可服务；本阶段无外部必要业务依赖。
- instance_id：string，来自API_INSTANCE_ID配置，默认`local`。验收两实例使用`api-a`和`api-b`，分别由真实独立进程/容器提供，版本与服务一致。

配置API_CORS_ORIGINS为JSON字符串数组，只允许显式HTTP/HTTPS origin；默认允许本地5173/4175开发站点，不允许通配。API_INSTANCE_ID为1～64个ASCII字母、数字、下划线或连字符；非法配置启动失败。健康路径不支持POST（405），未知API及`/`、`/index.html`均404。允许origin的GET返回对应Allow-Origin，不允许origin没有该头；必要preflight拒绝不允许origin。

前端通过`VITE_API_BASE_URL`指定API前缀，默认`/api/v1`。允许同源绝对路径或无凭据、无query/hash的HTTP/HTTPS绝对URL；非法/空配置明确报错。读取健康结果检查字段和类型，连接/HTTP/解析/协议错误清除成功状态并显示“连接失败”，附可理解的错误与重新检查入口；请求超时5秒。首次挂载请求一次，点击“重新检查”重新请求；进行中禁止重复点击。页面显示真实后端版本、服务状态、实例及实际请求地址，失败不继续展示上次成功版本。文案不预填设备数据或后续功能。

Vite开发反向代理`/api`默认转发127.0.0.1:8201，可用API_PROXY_TARGET修改；绝对VITE_API_BASE_URL走真实CORS。部署web由Nginx独立提供构建产物，`/api/`代理到API_UPSTREAM（默认http://api:8000），保留路径；静态路由刷新可用、缺失静态资源404。web/api各自Dockerfile与Compose服务，无启动依赖，端口只绑定127.0.0.1，可通过环境变量更换。不写个人绝对路径。

## 环境与依赖

已实查Node24.22.2/npm11.19.1、Python3.12.3、Windows Docker Desktop4.78.0 Linux engine29.5.3、Compose5.1.4；无运行容器。5173、4175、4176、8201、8202、8280、8281、8282当时可用，运行前再次核实。

注册表已实查Vue3.5.44、Vite8.3.5、TypeScript7.0.2、vue-tsc3.3.14、@vitejs/plugin-vue6.0.10、FastAPI0.162.0、Uvicorn0.54.0。锁定直接依赖，npm package-lock及uv.lock记录完整解析和哈希。Python使用uv0.9.7，独立安装/构建/运行，构建后实际安装wheel验证版本；测试使用pytest/httpx及标准JSON/TOML库。浏览器工具沿用Playwright1.56.1并独立锁定，Chrome156.0.8078.80，1920×1080；采用实际DOM操作、网络响应和控制台，禁止截图/视觉工具及网络替换。

当前系统Python无pip/ensurepip，独立uv工具已取得于本任务忽略目录；下载包SHA256=`b26fcc8dfa1c39b5a5613445af3be3eefda45d9a39359bee271eafe34913583e`。Chrome必要系统库按Ubuntu实际包准备于本任务忽略目录，记录来源和哈希；不依赖其他任务未提交源码。TMPDIR/TMP/TEMP与缓存在当前工作树`.scratch-runtime/m0-01`，必要Unix socket短路径链接仍指向本任务目录，不使用/tmp。

dsh实查runtime ready、running1/queued0/maxWorkers1，Source revision2、Policy1、Executor2；身份lucy-assistant、目标WRITE，唯一origin正确。保留profile/认证/设置/prompts，验收重新核查配置指纹。

## 必要验收和命令

入口：`python3 scripts/verify_m0_01.py --criteria <S> --candidate <C> --output .scratch-runtime/m0-01/run-<唯一编号>`；要求HEAD=C、工作树干净、S严格为祖先、基准实际包含。每条子命令保存argv/cwd/时刻/退出码/stdout/stderr及哈希，正常命令退出0，预期错误单独断言。入口失败立即终止并保留失败数据，不产生PASS汇总。

| 条款 | 实际操作与独立通过条件 |
| --- | --- |
| M0-01-A01 | frontend内`npm ci`、`npm run typecheck`、`npm run build`；backend内`uv sync --locked`、`uv build`、`uv run --locked pytest`，在全新venv实际安装wheel并启动；记录npm ls、uv版本及依赖树。从准确C以`git clone --no-local --no-checkout`在专用忽略目录创建独立clone、分离HEAD，重新安装/构建/启动，同入口`--clean`完整重跑五条，不能共享node_modules/venv或未提交源码。 |
| M0-01-A02 | curl/httpx访问8201健康路径严格比较冻结对象。真实浏览器打开Vue，等待“连接正常”，断言页面版本/状态/instance_id，记录请求URL、method、status、原始响应体和页面DOM；与独立期望及直接HTTP一致。 |
| M0-01-A03 | 真实停止web进程后HTTP API仍200；重新启动web，实际停止API后重新加载和点击重新检查，页面仍200且“连接失败”，不显示旧成功字段；恢复API后点击重新检查恢复正常。进程退出及容器停止均记录，禁用网页请求不能代替停止进程。 |
| M0-01-A04 | 两个真实API进程分别绑定8201/8202，使用api-a/api-b身份。修改VITE_API_BASE_URL、重新启动web，通过浏览器断言两次不同URL及对应instance_id。绝对地址验证CORS；默认相对地址验证Vite真实反代；Compose部署验证Nginx同源反代、路径刷新、缺失静态资源与API根404。 |
| M0-01-A05 | `npm test`调用真实浏览器验收；`uv run --locked pytest`调用真实HTTP进程；两端构建和`docker compose ... config/build/up`实际成功。Compose分别停止web/api验证独立性、健康及页面，API镜像不含frontend/dist。非法API origin/instance配置、前端非法地址、真实404/405、后端关闭及超时配置均有明确失败断言；无Mock或替代接口。 |

浏览器超时单条件30秒、请求5秒；身份/字段/哈希/状态/HTTP码完全一致，无数值容差。启动等待最长30秒，容器构建最长1200秒。所有必要项PASS才可继续；FAIL/BLOCKED/SKIP/NOT_RUN均阻止验收。

固定独立答案保存为本目录`health-api-a.json`和`health-api-b.json`，SHA256分别为`e76127596f4543f6e95cb38dfcf42b342e4d460eb06b96724fbaf7caca918f0a`、`f79435d71fd824be8fd4de476d2071ef8fa8b19a076ae42f779d48221fa41125`，S保存完整字节。负路径输入为`file:///invalid`、含凭据的URL、空地址、不允许的origin `http://untrusted.invalid`、非法instance `bad instance`、未知`/api/v1/missing`。只发送本任务配置的本地服务，不依赖外部演示站点。

回归：`git diff <base> <C> -- vendor assets evidence/FE-BASE evidence/M0-00 scripts/fe-base scripts/verify_fe_base.py scripts/verify_m0_00.py scripts/check_m0_00_failures.py ACCEPTANCE.md`必须为空；核实既有完整哈希清单、subtree记录/许可证与16项资产。实际运行vendor `npm ci/test/build/build:labs`，保留原必要入口。M0-00相关身份、origin、路径、dsh指纹、单worker及Docker版本重新实际核实。当前没有修改viewer行为，因此浏览器完整viewer交互仍引用准确前置基线，不将前置结果计作本项五条PASS。

## 页面设计

深蓝`#101e32`背景，面板`#172b43`，金属灰`#a7b5c6`，青色`#63d8df`，琥珀`#f0bd67`，失败红`#ff9292`。中文采用系统可用Noto Sans CJK SC/思源黑体，英文保留原名；主标题28～40px，正文16px。左侧说明教学平台与当前“服务连接”工作区，右侧以清晰定义列表显示实际连接结果，地址与错误允许换行。桌面左右布局，窄屏顺序排列，键盘焦点可见、状态有文字与aria-live。唯一操作“重新检查”。页面只呈现本阶段已实现能力与教学标识，不显示虚构运行数据。遵循既定颜色，所有结构帮助读取服务结果，不使用装饰动画、截图或ASCII示意。

## Skills与交付

- implement：文件加载`/home/lsy/.dsh/skills/implement/SKILL.md`，SHA256 `483bdc4ccf4ac31d86ac7beeaa0d0db80313e71e120bb8c59b3196ae5decd53d`，保留disable-model-invocation:true。
- tdd：skill工具，SKILL SHA256 `5505d25bbaa8fc14a79e4d20163936958992a2995b7f1dd1d6197edc9ed722e0`；tests.md `859f9e592c188fda4fc7277dd180e4ce9c7a2e13f6efe1f6f29eccc9d28c106a`，mocking.md `3ceb807fdf4a47d6a93d4d9a891e5ba6d362a6247bd08adc451feebfc17361ef`；全部位于同目录，项目禁止Mock优先，逐条失败→实现→验证。
- codebase-design：skill工具，路径`/home/lsy/.dsh/skills/codebase-design/SKILL.md`，SHA256 `2c20617f87ec8af6a434859f381b2f061a69b530444e74eb39e78bb016a6d1e2`，采用公开HTTP/DOM/CLI seam。
- frontend-design：skill工具，路径`/home/lsy/.dsh/skills/frontend-design/SKILL.md`，SHA256 `d91970639e9f5c37682ac7ab60094d35f1c7c1f38d731bd56396563aee10c1d3`，采用上述项目指定配色和当前阶段内容。
- agent-browser：skill工具，路径`/home/lsy/.dsh/skills/agent-browser/SKILL.md`，SHA256 `fd4ddd37ddb69f37ebc62e086566fcf606bbd09a5b4e4e7d7a6c4f0f94fdee47`；CLI0.41.0，已读取`skills get core`，采用隔离session、导航/实际点击/DOM网络断言；自动可复现入口使用Playwright驱动同一实际Chrome，记录方法差异。
- dsh-superagent-github：skill工具，实际路径`/mnt/e/DSH_SuperAgent/dsh-superagent-prototype/skills/dsh-superagent-github/SKILL.md`，使用gh核查原始派工与远程交付。
- code-review：候选时加载实际版本，以固定base/merge-base→C完整差异分别只读审查Standards/Spec，记录版本/哈希；两个子代理仅只读审查。
- diagnosing-bugs：遇到实际缺陷时加载并记录反馈循环。grill-with-docs、grilling、domain-modeling、to-spec、to-tickets、triage、prototype、research、wizard不适用：已定范围、术语和架构清楚，无新增需求划分、领域决策、标签或人工配置步骤。

准确C及全部必要实测完成后交draft PR与完整候选证据，保持C等待协调聊天全新独立审查回执。审查通过后才形成证据E及VERIFIED、全新baseline/M0-01-<C前12位>→E并远程核实、K登记LOCKED及推送外部回执。E/K不得改行为或验收、不得自引用最终SHA。最终head新增差异仍交协调独立审查。worker不approve/merge/auto-merge；当前只执行M0-01，最终合并与实际集成由协调完成。
