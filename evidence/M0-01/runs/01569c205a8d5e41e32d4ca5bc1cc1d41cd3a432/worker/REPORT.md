# M0-01 配置结构整改交接

当前为VERIFYING。最终准确C完成原P2-03整改及完整任务自查确认的前端地址边界修正；主运行、全新干净检出和开发Standards/Spec均已通过。保持准确候选等待新的协调全新独立复审回执，尚未形成E/K或新基线，未登记VERIFIED/LOCKED。

## 来源与版本

- task_id：M0-01；Issue #5；draft PR #6。
- 原trigger：`02ba12d14c5bf71b8b2927352df07f93`；本轮trigger：`aa132b698ae776ab5435d93d9ca89168`，评论`6610342613`。
- Ticket：`810d967dfbff4f0b93ef72c858f5a6b6`；worker/session：`worker-810d967dfbff4f0b93ef72c858f5a6b6`。
- worktree：`/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees/vue-python-runtime-810d967dfbff`；branch：`agent/vue-python-runtime-810d967dfbff`。
- 唯一origin：`https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git`。
- 固定base/实际merge-base：`b8ad3150cf4480f8e205926541aeeccb072f7f80`。
- S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`；原冻结、ACCEPTANCE和前置基线保持。
- 最终C：`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。
- 完整base→C：34文件、七提交；本轮d0af9d7→最终C为七文件，两次候选提交7bc4050、01569c2，提交历史保持，author/committer均为规定lucy-assistant。

## 反馈与修正

P2-03：独立d0af9d7复审确认空userinfo被接受，原报告和真实wheel探针保持。新58项矩阵在保留的准确d0af9d7环境得到8项FAIL、50项PASS，外层退出1；原文见[old-c-red.log](worker-handoff/old-c-red.log)。失败包含空userinfo、空query/fragment、前导控制字符、反斜线和空端口。当前API使用urlsplit username/password字段存在性拒绝userinfo，结合Pydantic query/fragment存在性、规范化host通配检查和原始结构校验，全部58项独立预期通过。

完整任务开发自查还确认criteria.md:25前端空query/fragment遗漏。真实API、Vue与Chrome复现两次`/api/v1?/health`错误请求和404，浏览器及外层退出1；[原始请求](worker-handoff/frontend-query-red/empty-query.json)及日志/进程保持。最终C使用原生URL完整序列化结果检查地址结构，浏览器测试记录全部fetch，正式入口新增绝对/相对空query、fragment四项。两套最终实测中9项非法地址均明确失败且零fetch。

本轮全部修正沿用冻结criteria.md:23、:25和A05要求；没有放宽S或增加业务功能。原通配拒绝与同一页面实际停止/恢复入口保持。

## 逐条实际验收

| 条款 | 主运行 | 干净检出 | 实际依据 |
| --- | --- | --- | --- |
| M0-01-A01 | PASS | PASS | 两端独立锁依赖安装/构建/启动；独立clone、全新venv/npm及wheel环境按锁哈希重现 |
| M0-01-A02 | PASS | PASS | 实际HTTP200冻结五字段、真实Vue版本/状态/实例及原始响应一致 |
| M0-01-A03 | PASS | PASS | 实际进程/容器独立启停；同一页面成功→停止API→点击失败/清除旧字段→恢复API→原页面点击成功 |
| M0-01-A04 | PASS | PASS | 两个真实API地址/实例、合法和拒绝CORS GET/preflight、Vite及Nginx反代、刷新/404路由 |
| M0-01-A05 | PASS | PASS | 70项Python测试、58项独立wheel配置输入、9项前端非法地址零fetch、真实浏览器/容器、超时与受影响回归 |

两套各required5/PASS5/FAIL0/BLOCKED0/SKIP0/NOT_RUN0。主运行122条命令：76条正常退出0、46条必要配置拒绝退出1；干净运行124条：78条正常退出0、46条必要拒绝退出1。全部实际退出码等于明确expected_exit_code；两个外层入口均退出0。vendor npm ci/test/build/build:labs、前置完整哈希和dsh配置指纹回归通过。

58项表覆盖合法HTTP/HTTPS/IPv6/显式端口、多origin/空允许数组，以及userinfo、原始/编码通配、路径、空/非空query和fragment、协议、空白/控制符/反斜线、端口、JSON形状/元素类型及instance边界。表的SHA256=`55f6b488aac84a531a6aac7c3caaa033aab1c8e7059ba2754828ca44dd79fa34`，已作为候选测试输入提交。逐项声明的配置输入与实际命令记录索引/退出码见[audit-results.json](worker-handoff/audit-results.json)，声明来自准确候选表，实际stdout/stderr及其哈希由原入口捕获。

## 命令、环境与生命周期

主运行：

```sh
python3 scripts/verify_m0_01.py --criteria 18a9210947e0114a8bbc6a10c8864701dfb8539e --candidate 01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432 --output .scratch-runtime/m0-01-origin-structure/main-02
```

主运行TMPDIR/TMP/TEMP=`/home/lsy/.m001tmp`，实际指向当前任务忽略目录；uv/npm缓存位于当前`.scratch-runtime/m0-01-origin-structure/`。使用固定uv0.9.7、Chrome156.0.8078.80和原任务实际Ubuntu共享库目录。Node24.22.2/npm11.19.1、主机Python3.12.3/容器Python3.12.12、Docker Desktop Linux29.5.3/Compose5.1.4保持。

全新clone：`.scratch-runtime/m0-01-origin-structure/clean-01569c2`，由git clone --no-local --no-checkout创建、分离HEAD=C、origin设为唯一目标。使用自己的TMPDIR链接`/home/lsy/.m001v4tmp`及uv/npm缓存，同入口添加`--clean`，输出`.scratch-runtime/m0-01-origin-structure/clean-01`。没有共享node_modules、venv或未提交源码；uv/Chrome复用固定平台工具。

完整argv/cwd/时间/实际与预期退出码/输出和哈希见[主commands](worker-handoff/main/commands.json)、[干净commands](worker-handoff/clean/commands.json)。正式入口已回收全部当次API/Vite/浏览器/Compose；末次自身ss检查5173/4175/8201/8202/8280/8281无监听，docker ps为空。没有常驻worker审查入口，独立会话可自行管理复验进程。

## 原始证据与审查

[封存包](worker-handoff/)包含695项文件，含最终主/干净完整原文、配置red/green、前端真实404失败、C7主运行历史、原399项worker包及d0af9d7独立FAIL必要原文。原独立完整目录和全部旧候选保持。C7的118条主入口虽退出0，完整任务Spec发现前端边界后判定FAIL；该结果保留于开发自查，未计作最终C通过。

| 文件 | SHA256 |
| --- | --- |
| worker-handoff/SHA256SUMS.json | ed63c94d3d029de44b8ab14459fe1ad2253d9c8d844de155b1d228c1c77207fd |
| main/commands.json | 411894c0ba0d896b009a4a976ebf8cb7471ed220ce2ffc30207cb6d02bb099c2 |
| clean/commands.json | ef4c9cbf0a8eb28d428b72a7361d1e4acdfbe79c7e94601639ff5d7e6c536a70 |
| main/SHA256SUMS.json | fe09a5bd5186fc0c399ee57906d5c9c7400d1d07b54fb4f9c33ab1fa72625b57 |
| clean/SHA256SUMS.json | 88e52d7410000980b38d268473514ddc6033f4498016ce6387ded8b72a6a6c59 |
| 原独立d0af9d7 REVIEW.md | 0b056850eb647c884434092399aa2f339c287c67b0d8365cbfef90c573053e16 |

Standards reviewer=`8a153739-e7a2-477e-b49c-05e27d86ca2d`，Spec reviewer=`3ee2a073-6648-4760-b909-160e9aaf56e1`。完整34文件/七提交及本轮全部增量分别覆盖，最终均PASS，无必须修正或可选建议；[完整记录](worker-handoff/worker-review.md)保存C7反馈、最终结论与实际skill路径/哈希。子代理全程只读；实测由本worker执行。

完整vendor/assets/许可、FE-BASE/M0-00证据与旧入口、S及ACCEPTANCE保持。当前新C对应协调全新独立复审尚未通过，现有开发自查与旧独立回执分别保存。遵照本轮评论保持准确C等待新回执，之后继续E→远程基线→K及最终head核查；当前不形成E/K、不执行合并、不推进后续任务。
