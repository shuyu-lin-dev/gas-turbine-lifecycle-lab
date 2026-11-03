# Vue 与完整 viewer 同源桥接

本项在 Vue 的“模型联动”工作区通过同源 `/viewer/` iframe 使用完整 turbine-explorer。默认“服务连接”页继续显示实际 Python 健康信息；“结构学习”打开完整原演示。模型页面明确显示“未接入运行数据”，部件状态和测量只在操作“装载状态夹具 A”后用于桥接验证。真实运行数据、SSE、告警及业务测点由后续任务接入。

范围与精确四消息定义见 [冻结记录](../evidence/FE-INTEGRATE/criteria.md)，固定输入见 [桥接夹具](../evidence/FE-INTEGRATE/bridge-fixture.json)。任务与依赖只登记在 [TASKS.md](../TASKS.md)。来源、MIT及第三方许可保留在完整 [viewer目录](../vendor/turbine-explorer)；来源说明见 [FE-BASE运行说明](FE_BASE.md)。

## 开发与构建

从仓库根目录准备本工作树内的临时目录，所有临时内容及缓存放在忽略目录内：

```sh
mkdir -p .scratch-runtime/fe-integrate/tmp .scratch-runtime/fe-integrate/npm-cache .scratch-runtime/fe-integrate/uv-cache
export TMPDIR="$PWD/.scratch-runtime/fe-integrate/tmp"
export TMP="$TMPDIR"
export TEMP="$TMPDIR"
export npm_config_cache="$PWD/.scratch-runtime/fe-integrate/npm-cache"
export UV_CACHE_DIR="$PWD/.scratch-runtime/fe-integrate/uv-cache"
npm ci --prefix frontend
npm ci --prefix vendor/turbine-explorer
```

三个独立终端分别运行实际 API、viewer 和 Vue：

```sh
uv sync --project backend --locked
uv run --project backend --locked uvicorn gt_lifecycle_api.app:app --host 127.0.0.1 --port 8201
npm run dev:viewer --prefix frontend
npm run dev --prefix frontend -- --port 5173
```

Vue 在127.0.0.1的5173端口提供页面，`/viewer/`经同源代理到4177端口的真实完整viewer进程，`/api`代理到8201端口。`VIEWER_PROXY_TARGET`可更改开发代理目标，viewer的base必须保持`/viewer/`；API配置继续遵循 [M0-01运行说明](M0_01.md)。单独启动Python不需要Node或viewer。

```sh
npm run build --prefix frontend
npm run preview --prefix frontend -- --port 4175
```

前端构建入口依次构建 Vue 和完整 viewer，把两份实际构建产物组合到 `frontend/dist`，viewer位于其 `viewer/`子目录。两套源程序及锁文件保留，构建前两套npm依赖均须安装。viewer资源使用相对路径；访问`/viewer`转至`/viewer/`，独立演示及嵌入都从本机资源加载。

## 独立部署

```sh
docker compose -p gtl-lab build
docker compose -p gtl-lab up -d web api
```

web构建上下文为主仓库根目录，明确使用 [frontend/Dockerfile](../frontend/Dockerfile)；最终Nginx只包含组合静态产物，不包含Node依赖。默认页面在本机8280端口，独立API在8281端口。`/viewer/`及其全部静态资源由web提供，缺失资源返回404。`/api/`保持原同源HTTP代理。web与api没有启动依赖，可独立启停，Python继续只提供API。容器由已配置Docker Desktop WSL2 Linux引擎运行。停止本项目服务使用`docker compose -p gtl-lab down`。

## 部件与状态

当前教学映射版本为bridge-map-v1。压气机采用首级动叶环，燃烧室采用第六个组件，涡轮采用首级动叶环，前轴承采用已有剖分轴承机座，排气段采用完整排气组件。它们都引用完整程序内的实际节点。选择用青色几何外框表示，夹具状态采用灰色/琥珀/红色/未知灰色材质并配合文字。缺少映射的编号显示“该部件暂不可定位”并保留原编号。

父页面管理设备、批次、revision和实例；普通选件保持revision，设备或批次变化每次递增并清除旧状态。应用重载与再次load建立新实例并同步最新完整快照。父子均检查真实origin/source、实例、结构与上下文；快照更新是唯一的范围更新方式。请求与回执按request_id去重，回执不会再次发出选择请求。嵌入子页面尚未绑定时只允许本地模型选择。页面卸载后父监听器移除，旧帧销毁；真实页面导航同时清理动画、桥接、工坊、场景和音频资源。

## 真实验收

准备 Chrome156.0.8078.80及必要系统库，设置`M0_01_CHROME`和`M0_01_UV`为实际平台工具。当前机器缺少系统级uv与部分Chrome共享库，worker复用了已核实的uv0.9.7二进制和Ubuntu实际共享库；路径与哈希保存在运行证据。可在用户目录创建指向当前工作树忽略目录的专用短符号链接，供Chrome Unix socket使用；TMPDIR/TMP/TEMP解析后必须仍位于当前工作树，禁止/tmp。源码、node_modules、venv和缓存必须在当前检出独立建立。

```sh
node --experimental-strip-types --test frontend/tests/protocol.test.ts
python3 scripts/verify_fe_integrate.py --criteria 7bc1cb91d822560b32f804891798babeead68828 --candidate <C完整SHA> --output .scratch-runtime/fe-integrate/run-<唯一编号>
```

[统一验收入口](../scripts/verify_fe_integrate.py)检查准确HEAD、干净候选、S和固定基准祖先、冻结夹具与前置完整证据哈希。实际执行上游必要test/build/build:labs、M0-01全部本地与容器健康/配置/错误路径、独立wheel、浏览器和完整viewer回归，然后对开发与Nginx部署分别执行六条桥接验收。Chrome采用1920×1080和SwiftShader软件WebGL2，当前不作性能结论。

[主要浏览器入口](../frontend/tests/bridge.mjs)执行真实父子选件、状态、真实Window拒绝用例、上下文切换及五次生命周期；[初始化入口](../frontend/tests/bridge-initialization.mjs)执行ready前最新状态与未绑定子窗口。初始化探针使用真实DOM激活和实际Window，窗口消息由浏览器产生真实origin/source；没有伪造MessageEvent或网络响应。观察器仅记录真实WebGL材质上传与后续绘制、消息和资源调用，保持函数原参数和返回值。所有命令、退出码、原始输出、DOM/网络/控制台、消息与GPU证据及SHA256保存在输出目录，不采集图像或截图。

干净复现使用`git clone --no-local --no-checkout`在当前忽略目录建立`clean-<唯一编号>`，以`git switch --detach <C>`检出准确候选，origin设置为唯一主仓库。重新准备该clone内的TMPDIR/TMP/TEMP及缓存，运行同一入口并添加`--clean`。不共享node_modules/venv或未追踪源码；平台Chrome、系统共享库与uv可复用已声明版本。历史验收入口与冻结保持，当前任务通过其实际行为入口重跑适用回归，完整viewer变化由本项授权和验收覆盖。
