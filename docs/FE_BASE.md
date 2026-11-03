# FE-BASE 独立前端基线

任务来源为 Issue #3，dsh Ticket `914d2ac32b5d2f130d718138164c8bab`。范围与独立预期见 [冻结记录](../evidence/FE-BASE/criteria.md)。本入口运行完整 turbine-explorer 源程序。

## 来源和许可

- 原始仓库：`https://github.com/AlexZhangji/turbine-explorer.git`。
- 固定 commit：`efc5d2ecd12055f880a41b47215791c22d3656d4`；Git tree：`03487ef57f6bc957dfc83b890de1f1e700ed2841`。
- 完整参考克隆：`/home/lsy/workspace/lab/_upstream/turbine-explorer`。
- 实际导入：`git subtree add --prefix=vendor/turbine-explorer /home/lsy/workspace/lab/_upstream/turbine-explorer efc5d2ecd12055f880a41b47215791c22d3656d4 --squash`。
- 导入提交：`459a359afd4e2e2bdaca05acccc4b65f79b741d8`；压缩历史提交：`8053436d63df1790eaf0a6011de34d1143cd5e1a`，保存原始 subtree trailers；导入 tree 与上游相同。
- 完整62项文件及哈希：[来源清单](../evidence/FE-BASE/upstream-manifest.json)。
- 原作者代码、程序几何 MIT：[LICENSE](../vendor/turbine-explorer/LICENSE)；[第三方说明](../vendor/turbine-explorer/THIRD_PARTY_NOTICES.md)；[HDR 来源](../vendor/turbine-explorer/public/environment/README.md)；[Manrope OFL](../vendor/turbine-explorer/public/fonts/Manrope-OFL.txt)、[Space Grotesk OFL](../vendor/turbine-explorer/public/fonts/SpaceGrotesk-OFL.txt)、[Three.js MIT](../vendor/turbine-explorer/licenses/three-LICENSE.txt) 均随完整源树保留。

模型、路径和流动具有教学性质，原作者的额定功率与教学计算保持原有含义。范围及限制见 [上游技术来源](../vendor/turbine-explorer/docs/SOURCES.md)。

## 独立运行

在 `vendor/turbine-explorer` 内执行原始命令：

```sh
npm ci
npm test
npm run build
npm run preview -- --port 4173 --strictPort
```

访问本机 `http://127.0.0.1:4173/?lang=en&quality=balanced&experience=console&speed=0`。源程序直接创建 Three.js 程序几何和原有控件。已有 GLB 作为独立资产保留。原始 `npm run build:labs` 也列入基线检查，产物只在本机核查。

上游要求 Node >=22.18.0；本次环境 Node v24.22.2/npm 11.19.1。全部上游依赖采用原始锁文件；自有浏览器工具独立锁定 Playwright1.56.1。

## 准确候选验收

已安装真实 Chrome for Testing156.0.8078.80。主机缺少的实际共享库通过 Ubuntu apt 包提供至本任务 `.scratch-runtime/browser-deps`。对应依赖包、失败及环境记录在验收证据中保存。独立复验可使用正常系统安装的相同依赖；本机执行环境为：

```sh
export FE_BASE_CHROME=/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome
export LD_LIBRARY_PATH="$PWD/.scratch-runtime/browser-deps/usr/lib/x86_64-linux-gnu"
export TMPDIR=/home/lsy/.fe914tmp
export TMP="$TMPDIR"
export TEMP="$TMPDIR"
python3 scripts/verify_fe_base.py --criteria 7704387252b293bee1ec671b440164a12287ca16 --candidate <C完整SHA> --output .scratch-runtime/fe-base-<C完整SHA>
```

`/home/lsy/.fe914tmp` 为指向本 Ticket `.scratch-runtime/tmp` 的专用符号链接，使 Chromium Unix socket 路径满足系统长度限制。内容仍保存在任务忽略目录。核查入口要求准确 HEAD=C、工作树干净且 S 为祖先；原始来源清单与冻结文件逐字节核查。输出目录必须全新。每条命令包含 argv、cwd、退出码、stdout/stderr 及哈希。

工具分别检查原版完整归档和当前 vendor 的 `npm ci`、`npm test`、`npm run build`、`npm run build:labs`，保留必要失败。之后启动实际 Vite preview，真实 Chrome 验证 GPU draw、镜头矩阵、10个组件、外壳模式、叶片交互、HDR和请求/控制台；完成后回收该次 preview 和浏览器。无图像采集。

## 干净检出复现

从当前主仓库以 `git clone --no-local --no-checkout` 建立 `.scratch-runtime/clean-<C前12位>`，在该独立仓库 `git switch --detach <C>`，确认 HEAD和干净状态，clone 的 origin 设置为唯一主仓库。该clone不共享工作树或依赖安装。将 TMPDIR/TMP/TEMP 指向该clone自己的 `.scratch-runtime/tmp` 短路径符号链接，FE_BASE_CHROME及已核实的实际系统库保持相同；在clone运行同一命令并添加 `--clean`，使用4174端口。

干净模式核对分离HEAD及独立`.git`、准确C与S；重新 `npm ci` 和全部必要检查、完整浏览器流程。浏览器证据要求没有GLB请求。两次输出中的候选SHA必须完全一致，干净复现通过后才可判A05通过。

准确C的自有代码、测试或依赖发生变化时，形成新C并重新验证。worker提交draft PR后等待协调会话对应C的独立Standards/Spec审查与复验；通过后才继续E、远程标签与K。最终结果和哈希登记于该次正式报告及TASKS，PR由协调会话最终核查、合并和确认集成。
