# M0-01 独立复审记录

会话：`01a1a252-009d-7220-83a1-a4c31b35ab6d`，与实际CODEX_THREAD_ID一致。协调聊天：`01a1a22f-d503-7cf0-bad4-ad8dd9d707a8`。任务M0-01，Issue #5，draft PR #6，dsh Ticket `810d967dfbff4f0b93ef72c858f5a6b6`。记录日期2026-11-04，Asia/Shanghai；原始命令采用UTC时间。

本会话只读项目文件，新增材料全部位于当前工作树`.scratch-runtime/coordinator-m001-rereview/`。实际复验统一由本会话执行，两个全新上下文子代理分别只读审查。项目文件、提交、远程消息及合并保持用户规定的操作边界。

## 固定版本与完整审查范围

- comparison_base与实际merge-base：`b8ad3150cf4480f8e205926541aeeccb072f7f80`。
- 冻结S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`，严格为C祖先。
- 准确新C：`d0af9d76a459f838f6f8fb8ee656a7b60fc6c790`。
- 原C：`73d7e29cb2e837eceb4767932e116e76e4916d0f`。
- 分支：`agent/vue-python-runtime-810d967dfbff`。审查前后HEAD均为新C，工作树干净。唯一origin为`https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git`。

完整命令为`git diff b8ad3150cf4480f8e205926541aeeccb072f7f80...d0af9d76a459f838f6f8fb8ee656a7b60fc6c790`；原文保存于[full.diff](full.diff)。覆盖33文件，2669行增加、15行删除。全部五提交为18a9210、f80af8b、290f173、73d7e29、d0af9d7，完整身份和提交说明见[commits.log](commits.log)。原C→新C六文件增量另见[remediation.diff](remediation.diff)。[independent-audit.json](independent-audit.json)登记33项文件在准确C、原工作树、独立clone中的完整字节哈希，全部一致。

33文件：AGENTS.md、DEV_SPEC.md、README.md、TASKS.md；backend/.dockerignore、Dockerfile、pyproject.toml、src/gt_lifecycle_api/__init__.py、src/gt_lifecycle_api/app.py、tests/test_http.py、uv.lock；compose.yaml；docs/M0_01.md、docs/agents/dsh.md、issue-tracker.md、workflow.md；evidence/M0-01/criteria.md、health-api-a.json、health-api-b.json；frontend/.dockerignore、Dockerfile、index.html、nginx.conf.template、package-lock.json、package.json、src/App.vue、src/main.ts、src/style.css、tests/browser.mjs、tests/lifecycle.mjs、tsconfig.json、vite.config.ts；scripts/verify_m0_01.py。

按根顺序完整读取AGENTS、DEV_SPEC、TASKS、ACCEPTANCE、领域约定、GLOSSARY、dsh/workflow/issue-tracker、前置FE-BASE冻结和正式报告、当前冻结及运行说明。没有已有ADR、CODING_STANDARDS或CONTRIBUTING文件。Issue #5完整正文及全部评论、PR #6完整正文和讨论经gh-agent-bot只读取得，原始JSON在[remote/](remote/)。操作前实际身份为lucy-assistant。末次Issue回执`6610198885`的整改报告和399项清单哈希均实际核实；末次PR正文已经引用新C，head与本次候选相同。

前置FE-BASE已LOCKED。K=`efb0a5c6cf5e44eb9297d39ea88201a4610bf15e`为base祖先，K/base的tree同为`3c1a4ac1f0f197c56d0ec0231a80f51f0081666d`。PR #4的merged与merge_commit_sha、Issue #3评论6607816699/6607856530/6608042226重新核实。远程main仍为base；FE-BASE标签指向E=`a7966085071051d07cb7e80d0843a07ad9687183`，M0-00标签指向原E=`398b923f01eb97bcf7c22e9e31f344662c2365c5`。对应远程原文保存于remote。

## Skills与独立标识

code-review采用文件加载：`/home/lsy/.codex/skills/code-review/SKILL.md`，SHA256=`9c921a8d88138a41401d8897ca1bb852088ab1b7b605cdd04edc13e3e8aab6dd`。该skill没有额外相对引用；本会话按其要求使用fork_turns=none并行审查，保留两个维度的分别结论。

agent-browser采用文件加载：`/home/lsy/.codex/skills/agent-browser/SKILL.md`，SHA256=`fd4ddd37ddb69f37ebc62e086566fcf606bbd09a5b4e4e7d7a6c4f0f94fdee47`；实际CLI的`skills get core`原文为[agent-browser-core.md](agent-browser-core.md)，SHA256=`cd33c2a5a3d02b1f75ce240e3c96727ecd417892a89efbf4fe183e475e3940b8`。真实浏览器按用户指定冻结入口采用Playwright1.56.1与实际Chrome，使用独立浏览器、真实导航/点击、DOM/网络/控制台。实现、模块设计、领域维护及技能安装不属于本次操作，相关skills不适用。

## Standards

PASS，确认规范问题0项。全新上下文代理`/root/m001_rereview_standards`覆盖完整33文件、五提交及六文件整改增量；12项smell作为判断参考。独立原文见[standards.md](standards.md)，SHA256=`0c55fc2f1a9e01c3cfb2eeee6dca15ffc5477ff87e6761bdf864697d8904c58b`。代理未运行争用端口的验收。

## Spec

FAIL，确认P2问题1项。全新上下文代理`/root/m001_rereview_spec`覆盖相同完整范围。独立原文见[spec.md](spec.md)，SHA256=`caf3a4d1b15baa450d31bda1fa1771c9461aac20e6017680249c2ff69bfc4588`。其精确import记录为[spec-origin-probe.json](spec-origin-probe.json)。

### P2-03：空userinfo的origin配置被接受

条款：S中`evidence/M0-01/criteria.md:23`的“只允许显式HTTP/HTTPS origin”“非法配置启动失败”，及M0-01-A05必要配置错误路径。候选为新C；位置`backend/src/gt_lifecycle_api/app.py:31`、`:32`。

输入分别为`API_CORS_ORIGINS='["http://@example.com"]'`和`API_CORS_ORIGINS='["http://:@example.com"]'`。真实命令为独立已安装wheel环境的`bin/python -B -c 'import gt_lifecycle_api.app; print(gt_lifecycle_api.app.origins)'`。两种输入实际均退出0并打印原配置，冻结预期为非零退出。username/password使用真值检查时，空字符串不能触发拒绝；Pydantic接受该HTTP URL，配置中仍保留userinfo。

主会话在主运行wheel与独立干净clone的wheel分别复现；合法`http://example.com`退出0，非空凭据`http://user:password@example.com`退出1。两套wheel的app.py SHA256与准确C源码同为`246bd7afadf46cab733ae419be5e8be0fdb6c3cc444335c3be2c309ecf4a29e3`。

影响限于非法origin配置未即时拒绝，这两个字符串无法作为浏览器发送的origin配置使用。本项没有认定CORS访问绕过。复验条件：拒绝userinfo存在的origin配置，覆盖上述两种空值，保留合法origin、通配符、既有错误配置和实际CORS/preflight回归，形成新C并重新复审。

主会话证据：[credentials-probe.json](credentials-probe.json)、[credentials-probe.log](credentials-probe.log)，外层退出1；干净wheel证据：[credentials-clean-02.json](credentials-clean-02.json)、[credentials-clean-02.log](credentials-clean-02.log)，外层退出1。每项包含准确argv/cwd、环境输入、时刻、实际退出码、stdout/stderr和独立预期。

## 原两项整改及原始失败

P2-01通配origin：整改前实际pytest的两项FAIL保存在worker-handoff/cors-red.log；整改后12项pytest通过。新C正式入口在两套独立wheel中分别对`http://*`与`https://*.example.com`执行真实import，两条各退出1，与expected_exit_code=1一致；合法origin退出0。本会话另运行42项配置输入及实际GET/preflight，见[origin-probe.py](origin-probe.py)、[origin-probe.json](origin-probe.json)、[origin-probe.log](origin-probe.log)，外层退出0。原通配问题整改通过。

42项覆盖7项合法HTTP/HTTPS/IPv6/端口origin、空允许列表、21项非法origin、6项非法JSON形状/类型以及7项instance边界。原始与编码后的通配符、路径、query、fragment、凭据、空地址、协议、空白与端口边界均有明确输入。真实服务的5次HTTP结果包括初始健康GET，以及允许/拒绝origin的GET和preflight：允许origin返回相同Allow-Origin，拒绝origin的GET无该头，拒绝preflight为400。每次原始状态、header和body保留。

P2-02持续页面覆盖：正式入口已经调用test:lifecycle。本会话两套新C运行均记录单个Chrome页面，一次导航、三次健康请求、200→实际502→200、三个DOM阶段；失败阶段旧service/version/instance/status字段清除，恢复后同页实际点击取得完整冻结响应。两次API实际PID和SIGTERM/shutdown记录完整。主运行PID669166→669304；干净clone的实际PID见其same-page-lifecycle.json。两套持续操作均PASS。原问题属于入口覆盖，原会话补充的应用行为PASS保持原含义。

原会话`01a1a233-9fc1-7302-be2e-4db9ad6dd343`的Standards PASS、Spec FAIL、A05 FAIL及原始失败继续保留，REVIEW.md SHA256仍为`da764283db49f0cb108a0e096bf57508434f0582e39ea27a2686581c04096f8a`。本次没有用旧C通过结果代替新C验收。

## 新C实际命令与环境

[run-frozen.sh](run-frozen.sh)仅准备环境并调用当前候选入口。实际命令为`python3 scripts/verify_m0_01.py --criteria 18a9210947e0114a8bbc6a10c8864701dfb8539e --candidate d0af9d76a459f838f6f8fb8ee656a7b60fc6c790 --output <当次全新目录>`。

| 运行 | cwd / output | 外层退出码 | 子命令实际退出码 |
| --- | --- | --- | --- |
| main-01 | 当前Ticket工作树 / .scratch-runtime/coordinator-m001-rereview/main-01 | 0 | 63条；61条退出0，两条预期拒绝退出1 |
| clean-01 | clean-d0af9d7-review / .scratch-runtime/coordinator-m001-rereview/clean-01，添加--clean | 0 | 65条；63条退出0，两条预期拒绝退出1 |
| origin-probe.py | 当前Ticket工作树 / origin-probe.json | 0 | 42项配置符合独立预期；5次真实HTTP符合预期 |
| credentials-probe.py | 主运行wheel / credentials-probe.json | 1 | 两项空userinfo拒绝断言FAIL，两个控制输入PASS |
| credentials-probe.py --python <干净wheel> --name credentials-clean-02 | 干净wheel / credentials-clean-02.json | 1 | 同一问题独立复现 |
| audit.py | 当前Ticket工作树 / independent-audit.json | 0 | 两套独立与两套worker命令/输出哈希、版本和原证据核查完成 |

冻结两条入口均保存所有argv/cwd/时刻/退出码/expected_exit_code/stdout/stderr及哈希。完整安装、typecheck/build、uv sync/pytest/build/export、wheel全新安装及启动、真实浏览器、Docker config/build/up/stop/start/pause/unpause/logs/down、vendor四条回归均已运行。正式入口的results.json写5条PASS；最终判定同时考虑独立补充的确认失败。

独立clone通过`git clone --no-local --no-checkout . .scratch-runtime/coordinator-m001-rereview/clean-d0af9d7-review`建立，随后在该新clone分离HEAD至准确C，并设置唯一origin。独立.git、无alternates、干净工作树、各自node_modules/venv及逐项源码哈希已核实。主/干净clone的uv/npm/XDG缓存分别独立，未共享依赖环境。

TMPDIR/TMP/TEMP使用`/proc/<当前shell PID>/fd/3`短路径，文件描述符实际指向当前运行工作树`.scratch-runtime/coordinator-m001-rereview/env-<名称>/tmp`。预检和入口Path.resolve均核实所在目录；缓存显式置于同一专用忽略目录。uv与Chrome复用既有可执行文件，其路径和SHA256保存于independent-audit.json；必要Chrome共享库复用真实Ubuntu包目录。

实际版本：uv0.9.7、Node24.22.2、npm11.19.1、Chrome156.0.8078.80、Python3.12、Docker Desktop4.78.0/Linux engine29.5.3、Compose5.1.4。dsh实际runtime ready，最终running=0/queued=0/maxWorkers=1；Source/Policy/Executor等配置指纹与M0-00原值一致。实际gh身份lucy-assistant，仓库WRITE，origin与工作树位置正确。

验收前5173/4175/8201/8202/8280/8281均可用。所有本次API/Vite/浏览器与Compose均已回收，最后ss确认这些端口无监听，docker ps为空。最终状态及原始进程退出见independent-audit.json与两套processes.json。未终止其他服务。

辅助证据采集的一次干净wheel探针错误解析了Python符号链接，产生credentials-clean.log中的路径异常；该次未作为产品判断。使用独立venv的Python入口后，credentials-clean-02完整保存实际结果。第一次原证据核查在发现协调记录追加内容时退出1，audit-01.log保留；后续逐字节前缀核对证明原内容仍完整保存，详情见下一节。必要验收原始输出均保留。

## A01～A05最终判定

| 条款 | 最终状态 | 本次独立实际依据 |
| --- | --- | --- |
| M0-01-A01 | PASS | 新C主运行及全新clone各自依赖锁安装、typecheck/build、pytest/wheel构建与独立安装、真实启动成功 |
| M0-01-A02 | PASS | 两个API的实际健康200、五字段冻结对象、Vue请求/响应与DOM一致 |
| M0-01-A03 | PASS | 进程和容器独立启停；同一页面成功、实际停止后点击失败清除、实际恢复后同页点击成功 |
| M0-01-A04 | PASS | 两套地址/实例切换、CORS/preflight、Vite反代、Nginx同源部署、刷新及404路由 |
| M0-01-A05 | FAIL | 构建、测试、容器、原错误路径和通配整改通过；空userinfo配置仍接受，P2-03实际复现 |

必要计数：5项，PASS4、FAIL1、BLOCKED0、SKIP0、NOT_RUN0。Standards PASS、Spec FAIL分别保留。当前准确C未满足全部必要验收。

## 证据核查与回归

原worker180项、整改worker399项、FE-BASE192项、M0-00的39项清单全部逐字节匹配。整改交接REPORT.md哈希为`e8456f2f93f1e1f8cf1b6db7e0ba32e229687c0a5982aeeadff9f283aa283da4`，与Issue最新评论一致；399项清单为`9f29de27b11dfe65f9f9232d42c5f51b3457751258ae275359e0e310c34863d7`，原180项清单仍为`cce987562f4541c21d4f7efc57f4a09037a2c5f59cfe1558fe593f136b4535ba`。worker主63/干净65条命令、每条实际及预期退出码和输出哈希均核实。

原协调清单146项中144项全文件哈希匹配；coordination.md与session.jsonl有追加内容，原1416字节/2169256字节前缀分别精确匹配原清单哈希，原内容保存完整。其旧哈希、当前完整哈希、原长度和现长度登记于independent-audit.json；REVIEW、原始验收和FAIL证据保持原哈希。

vendor、assets、前置证据、许可证、旧验收入口、ACCEPTANCE及S的当前冻结文件与基准没有变化。两次独立运行均实际执行vendor的npm ci/test/build/build:labs并退出0。16项资产与完整上游来源/许可/锁和subtree成果沿用准确前置实际集成基线。本项未修改viewer行为，完整viewer浏览器交互沿用前置基线证据，本次未重复运行。

| 本次证据 | SHA256 |
| --- | --- |
| main-01/SHA256SUMS.json | 0c0e8faffc915f1980d5100da9b30a6e332db5ba9614b618691e093c3d25f282 |
| clean-d0af9d7-review/.scratch-runtime/coordinator-m001-rereview/clean-01/SHA256SUMS.json | 86a8ae5744d1d8b5812153ad8ad2e11dab3471d05b9eb730dfeb4aa1b5075044 |
| 主运行same-page-lifecycle.json | 7bd9ac6b738efffdf8de1ac201b2efe284fb47e13b7202f8af201a6ba4aecf01 |
| 干净运行same-page-lifecycle.json | 5853f961c9d4fd3a8f764ea2e72f8e675ee1cb1976625d73584e5a1b98cd5c4d |
| origin-probe.json | a364ad06de053538bcb8a6b72e46fb303f96759d1561bd3da7c4a306df8899e3 |
| credentials-probe.json | c5085f32e136d8f58393e9ac3c1f01abf2a66a93f4e100539eab1933e3ddb297 |
| credentials-clean-02.json | d78b5e67e421da97d4e02940ba3c0972dd4c2795ab69618ee460bca043930537 |

本次总清单SHA256SUMS.json登记本记录、审查原文、远程快照、补充探针与两套冻结输出，排除依赖、缓存和clone完整源树；REVIEW及总清单自身的最终哈希通过最终回复外部登记。

## 未验证项目与交付边界

准确新C的check-runs=0、commit statuses=0，记录为空检查集合，未记为CI通过。未来E/K、最终head新增差异、合并后的实际集成及后续任务尚未执行。当前Spec FAIL及必要A05 FAIL阻止通过回执；确认问题交由原worker在同一任务整改，新C重新实际验收和独立复审。本会话没有发布远程评论。
