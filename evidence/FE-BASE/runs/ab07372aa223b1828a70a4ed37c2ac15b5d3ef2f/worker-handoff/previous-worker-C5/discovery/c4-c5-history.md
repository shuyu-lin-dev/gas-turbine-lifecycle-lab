# FE-BASE C4/C5 失败与复验记录

C4=`86c1c3b5bca425e4a930ac7beb8fdad80b9b4463`的真实浏览器已通过部件抽出input/output=100断言。新增画质检查使用`.lab-quality output`，实际同时匹配整机画质输出1920×1080和组件画质输出1410×946，Playwright strict mode violation退出1。原始commands.json和candidate-browser.json保留，不能视为C4通过。此时正在运行的独立C4干净复现被主动SIGTERM终止，记录为INTERRUPTED；其部分证据保留，4174服务已回收。

C5=`e77466c3390b6c8b05f52d5b5a4bd00fc77b291c`仅将上述两处画质locator限定`.parts-lab .lab-quality output`，原像素格式和全部必要断言保持。两个只读reviewer对完整77文件base...C5审查均PASS。C5主工作树完整验收命令退出0，31条采集命令全部退出0；原版与产品的npm ci、npm test、npm run build、npm run build:labs均实际通过。真实浏览器32项操作全部通过：10项组件选择与抽出归位、主画布和组件镜头的静止/旋转/双向缩放、外壳切换、滑块和拖动柄键盘、叶片模式/流动/涂层、两套HDR。无pageerror、requestfailed或console.error，未请求GLB。软件渲染完整流程在2026-11-03T09:39:24Z开始预览，浏览器09:54:56Z完成，服务09:55:01Z主动回收，SIGTERM退出143。独立C5干净检出复现结果单独登记，不提前宣称通过。

保留的console.warn为Three.js PMREM环境模糊采样请求54而上限20的采样裁剪提示，每次整机加载2条，共6条。该信息来自原版环境图生成，不是资源加载失败、shader错误或context lost；所有警告原文与实际renderer均在浏览器JSON中保存。没有改变原版采样或隐藏警告，本项不评价硬件性能或图像质量阈值。Vite原始构建另有单个chunk超过500kB提示，原命令退出0；产物保留完整源码行为。

准确C5的错误candidate、S=C及真实未追踪文件边界均退出1且错误类型符合预期，随后单个探针文件按已核实绝对路径删除，工作树重新干净。C5真实HTTP404浏览器探针立即退出1、operations=[]、state=FAIL，验证错误不会继续运行。对应服务已回收。

首次推送C5因gnutls_handshake TLS连接提前终止而退出128；同一授权推送原命令重试后退出0，gh API回读远程分支精确为C5。没有改变origin、账号、认证或传输安全设置。
