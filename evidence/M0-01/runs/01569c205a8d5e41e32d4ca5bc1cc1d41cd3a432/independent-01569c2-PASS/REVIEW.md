# M0-01 独立复审记录

Standards PASS；Spec PASS；M0-01-A01～A05 全部 PASS。确认缺陷0项。该结论对应准确候选 `01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。

会话标识：`01a1a274-4921-7f83-85f0-3d056391d87d`，依据协调评论6610920824；主审查代理 `/root`。协调聊天 `01a1a22f-d503-7cf0-bad4-ad8dd9d707a8`。任务 M0-01、Issue #5、draft PR #6，唯一仓库 `shuyu-lin-dev/gas-turbine-lifecycle-lab`。独立冻结入口准备开始于2026-11-04 01:30:20，最终远程核实为01:34:39，Asia/Shanghai；各条实际时刻保存在原始命令记录。

## 固定版本与范围

- comparison_base / 实际 merge-base：`b8ad3150cf4480f8e205926541aeeccb072f7f80`。
- 冻结 S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`，严格为C祖先；冻结目录及ACCEPTANCE语义保持。
- 准确 C：`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。
- 当前worktree HEAD、独立clone HEAD、远程分支及PR实际head均为C；两个工作树均干净。最终远程main为base。
- 分支：`agent/vue-python-runtime-810d967dfbff`；worker Ticket `810d967dfbff4f0b93ef72c858f5a6b6`。独立会话未调用开发worker。
- 完整比较命令：`git diff b8ad3150cf4480f8e205926541aeeccb072f7f80...01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。全部34文件见 `files.txt`、完整内容见 `base-to-c.diff`。
- 完整提交命令：`git log --format=fuller b8ad3150cf4480f8e205926541aeeccb072f7f80..01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。七提交依次为18a9210、f80af8b、290f173、73d7e29、d0af9d7、7bc4050、01569c2，原文保存在 `commits.log`。
- 另行审查 `git diff d0af9d76a459f838f6f8fb8ee656a7b60fc6c790 01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`，七文件增量原文为 `increment.diff`。

本会话只在本报告所在的忽略目录建立审查证据和独立clone，应用、测试、依赖及行为配置保持只读。未提交、推送、发布消息或执行合并。

## 来源与独立审查

按根顺序读取AGENTS、DEV_SPEC、TASKS、ACCEPTANCE、领域约定、GLOSSARY、dsh/workflow/issue-tracker、前置FE-BASE正式报告与远程核实记录、当前冻结及运行说明。未发现已有相关ADR或额外CODING_STANDARDS/CONTRIBUTING。

连接GitHub只读工具取得Issue #5完整正文、全部评论和PR #6，保存为 `github-0.json`、`github-1.json`、`github-2.json`。最新完整评论保存在 `github-comments-latest.json`，含worker交接6610933900及保持候选回执6610954636；已核实worker报告SHA256为 `66bbd5d6f810efd07fbfc626f026b1a216516d5b3f875ecc6017a61f451c1b1c`。最终PR正文及元数据保存为 `pr-final.json`，正文候选与实际head均为C。

code-review采用文件加载：`/home/lsy/.codex/skills/code-review/SKILL.md`，SHA256 `9c921a8d88138a41401d8897ca1bb852088ab1b7b605cdd04edc13e3e8aab6dd`。完整读取全部步骤；该文件没有当前步骤必须读取的外部引用。两个子代理均以 `fork_turns=none` 建立全新上下文，分别检查完整base→C和整改增量，仅作只读审查，未启动验收服务。

| 维度 | 独立标识 | 结论 | 记录与SHA256 |
| --- | --- | --- | --- |
| Standards | `/root/standards` | PASS；确认规范违反0项，启发式建议0项 | `standards.md`；`d40eb563dc4d2e94ef2ee483133038de3485cf3c819a54d62f2f3f35250e54a2` |
| Spec | `/root/spec` | PASS；确认缺失、错误实现及范围问题0项 | `spec.md`；`bcfa89003e13a47f1371ee2be36e5e14962b64a2d5712ef92ade44baeea13ac6` |

## 独立实际验收

本会话执行 `bash .scratch-runtime/coordinator-m001-origin-review/run-frozen.sh`，退出0。该脚本在专用目录以 `git clone --no-local --no-checkout` 创建 `clean-01569c2`，分离HEAD至准确C，独立`.git`与唯一origin均核实。源码全部来自C，全新安装frontend/vendor的node_modules、backend venv及wheel venv；uv/npm/XDG缓存均在该clone专用目录。未共享worker安装目录或未提交源码。

在clone根目录只运行一次完整冻结入口：

```sh
python3 scripts/verify_m0_01.py --criteria 18a9210947e0114a8bbc6a10c8864701dfb8539e --candidate 01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432 --output .scratch-runtime/coordinator-m001-origin-review/frozen-clean --clean
```

入口退出0，原文见 `frozen-clean.log`、`frozen-clean.exit`。下文独立原始目录记为R：`clean-01569c2/.scratch-runtime/coordinator-m001-origin-review/frozen-clean/`。

124条子命令中78条正常命令退出0、46条非法配置拒绝命令退出1；每条实际退出码均等于明确expected_exit_code。70项Python测试通过，58项独立wheel配置输入逐项符合冻结预期。所有argv、cwd、时刻、stdout/stderr和输出哈希见 `R/commands.json`。`npm run build`内部实际执行typecheck；两个Python构建及独立wheel安装均实际完成。

| 条款 | 结果 | 实际证据 |
| --- | --- | --- |
| M0-01-A01 | PASS | 独立依赖安装、typecheck/build、uv locked sync/pytest/build、独立wheel安装和真实启动；`R/commands.json`、各version JSON |
| M0-01-A02 | PASS | 两个真实API的HTTP200及冻结五字段、真实浏览器GET/响应体/版本/状态/实例与独立答案一致；`R/api-a-8201-http.json`、`R/api-b-8202-http.json`、`R/direct-a.json`、`R/direct-b.json` |
| M0-01-A03 | PASS | web实际停止后API仍200；API实际停止后web仍提供页面且显示失败；同一页面持续恢复检查通过；`R/web-stopped-api-alive.json`、`R/api-stopped.json`、`R/api-recovered.json`、`R/same-page-lifecycle.json`、`R/processes.json`及容器记录 |
| M0-01-A04 | PASS | 8201/api-a及8202/api-b实际切换；允许/拒绝CORS GET及preflight、Vite代理、Nginx部署代理、刷新和缺失资源404通过；`R/direct-a.json`、`R/direct-b.json`、`R/dev-proxy.json`、`R/deployment-routes.json`及真实pytest |
| M0-01-A05 | PASS | 70项真实Python检查、58项wheel配置、9项前端非法配置零fetch、5秒超时、真实404/405、Compose config/build/up及独立启停、API镜像无frontend/dist、vendor全部必要构建检查；原文均在R |

required / passed / failed / blocked / skipped / not_run：5 / 5 / 0 / 0 / 0 / 0。

## 整改与回归

P2-01通过：`http://*`、`https://*.example.com`及其余原始/编码通配输入均实际非零退出；合法HTTP/HTTPS、IPv6、显式端口及空允许列表实际退出0。成熟解析器为urlsplit与Pydantic AnyHttpUrl；合法和拒绝CORS/preflight由真实HTTP进程验收。

P2-02通过：`R/same-page-lifecycle.json`记录唯一一次导航、三次实际GET及200/502/200响应，两个真实API进程均记录启动和结束；同一页面初次成功、实际停止API后点击失败并清除全部旧字段、实际恢复API后再次点击成功。未使用网络替换。

P2-03通过：app.py:32按username/password字段存在性拒绝空和非空userinfo。`http://@example.com`、`http://:@example.com`及四类非空凭据输入在本次独立wheel逐项实际退出1。58项表覆盖路径、空/非空query和fragment、协议、空白/控制字符、端口、原JSON形状和类型及instance边界；审查预期依据S的配置语义。表SHA256 `55f6b488aac84a531a6aac7c3caaa033aab1c8e7059ba2754828ca44dd79fa34`。

最终01569c2的空query/fragment修正通过：浏览器正式入口实际验证绝对及相对地址的空query/fragment，`R/invalid-address-5.json`至`R/invalid-address-8.json`均显示配置失败、零fetch；其余五项非法地址也通过。原始真实404记录保存在worker封存包 `frontend-query-red/empty-query.json`，原两次错误URL和响应完整保持。

原d0af9d7独立FAIL报告仍为 `.scratch-runtime/coordinator-m001-rereview/REVIEW.md`，实际SHA256 `0b056850eb647c884434092399aa2f339c287c67b0d8365cbfef90c573053e16`。worker封存包保存原58项矩阵8项FAIL、前端原始失败及7bc4050反馈；本次独立通过全部来自准确新C。

前置回归通过：完整vendor/assets、FE-BASE/M0-00证据、许可、既有入口及ACCEPTANCE与base差异为空；冻结目录与S差异为空。独立入口核对两套前置SHA256清单；额外逐字节核对两份checkout内16项资产。vendor tree为 `fc5ac885bdb2bc8272ab77d74473a46e4b5da45c`，subtree导入tree为 `03487ef57f6bc957dfc83b890de1f1e700ed2841`，trailer及历史保持。vendor实际npm ci/test/build/build:labs均退出0。

## 证据字节、环境与远程核实

执行 `python3 .scratch-runtime/coordinator-m001-origin-review/audit.py`，退出0；49项审计通过。`audit.json`独立核对worker主122条、worker干净124条及本次124条的准确C/S/base、全部实际/预期退出码及stdout/stderr字节哈希，检查58项wheel命令、9项非法地址、持续页面及健康对象。worker主76条退出0、46条退出1；worker干净78条退出0、46条退出1。

worker封存695项逐字节核实，清单覆盖全部文件，无缺少或未列文件。独立R清单覆盖全部56项顶层原始证据，wheel安装目录单独保留。封存原始失败及前次独立报告均保持原哈希。

| 证据 | SHA256 |
| --- | --- |
| `base-to-c.diff` | `ab023157db81fc3c59fcff7f97c0ae6551b45089d69a97e4bf2b9a71efe5310a` |
| `increment.diff` | `71cd0f3ee54a5fb4d5b9df49aad825d4fe0c03ec399bb90fa9aac01d8ae7294d` |
| worker `worker-handoff/SHA256SUMS.json` | `ed63c94d3d029de44b8ab14459fe1ad2253d9c8d844de155b1d228c1c77207fd` |
| `R/commands.json` | `a97a9081985a4558a2d80c56ca78afe3517294d61ed8e0bb40d9b345582d0984` |
| `R/same-page-lifecycle.json` | `10f8cd0699575050e7f6c2441c9cc095db4d7c10150afba85254e229909023d9` |
| `R/SHA256SUMS.json` | `e81ab15c0801acc35e52c5aa2a3fb4afb7e89265b0c87c11c014a484b64300b2` |
| `audit.json` | `5ccf461906b748383a535bf653ddaca206f961641cb52d75b95eaad5ab4004f7` |
| `pr-final.json` | `37799d877140002ad3eb4e897e37afed4320de441b18c64cd9746fbfb5e3c1e4` |

复用已核实平台工具uv及实际Chrome，SHA256分别为 `6583a1d002bf6165be0a38366538268e028bbcbb8802880ca09cce80d5505447`、`1bcad71ad1bff85955db13c6d8dd9f32374934d5a5cb079b526c46fb51f9bd97`。采用Playwright驱动真实Chrome的冻结入口，只有DOM/网络/控制台采集。TMPDIR/TMP/TEMP使用指向clone自身专用目录的 `/proc/<runner-pid>/fd/4`，共享库路径与全部环境设置见 `run-frozen.sh`。未读写/tmp，未主动使用视觉功能。

dsh实际ready，running0/queued0/maxWorkers1。settings及Source完整指纹、prompts revision4/config指纹、六份既有profile/认证配置文件哈希均保持；只保存指纹及必要状态，未输出凭据。GitHub入口实际身份lucy-assistant、目标WRITE，未调用gh-owner。Docker及Compose实际版本见R对应version文件，连接现有Docker Desktop Linux引擎。

`bash .scratch-runtime/coordinator-m001-origin-review/final-check.sh`退出0。`final-state.log`记录最终HEAD、干净工作树、远程main/分支及前置标签；远程FE-BASE标签仍指向E=`a7966085071051d07cb7e80d0843a07ad9687183`。冻结端口5173/4175/8201/8202/8280/8281已全部释放，docker ps为空；其他既有服务保持。本会话所有验收进程/浏览器/容器均已回收。

准确C的check-runs=0、commit statuses=0，原始返回为 `ci-check-runs.json`、`ci-status.json`，记录没有上报CI检查。审查总清单保存在本目录 `SHA256SUMS.json`；不包含依赖缓存、clone Git元数据和构建产物。

## 未验证项与后续交付

确认缺陷清单为空。本次未重复完整viewer浏览器交互；其应用、资源和原验收入口无变化，按S保留前置准确FE-BASE证据。

E/K、M0-01远程新基线、最终head新增差异及合并后集成属于后续交付，当前尚未验证。本次结论允许协调聊天通知原worker继续E/K；最终head仍须独立核查。当前任务继续保持VERIFYING记录，本会话不修改任务状态。
