# M0-01 验收报告

状态：VERIFIED。准确候选C的worker主运行、worker干净检出、开发自查和全新上下文协调独立审查及实际复验均通过。远程证据基线与LOCKED登记由后续交付步骤记录。

## 任务、范围与版本

- task_id：M0-01「Vue与Python前后端独立运行」；Issue #5；PR #6。
- dsh Ticket：`810d967dfbff4f0b93ef72c858f5a6b6`；worker/session：`worker-810d967dfbff4f0b93ef72c858f5a6b6`；branch：`agent/vue-python-runtime-810d967dfbff`。
- S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`；tested_code_sha C：`01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432`。
- comparison_base / merge_base / 前置实际集成基准：`b8ad3150cf4480f8e205926541aeeccb072f7f80`。FE-BASE已LOCKED并通过PR #4实际集成。
- 完整base→C为34文件、七提交；根[冻结规则](../../criteria.md)、ACCEPTANCE、vendor/assets/许可证、前置证据与旧验收入口保持。
- 当前只交付M0-01。Vue提供实际服务连接检查，Python/FastAPI提供健康API，两端独立依赖、构建、运行和部署；Nginx提供静态页面及同源代理，web/api可独立启停。

## 必要验收

| 条款 | 最终状态 | 实际依据 |
| --- | --- | --- |
| M0-01-A01 | PASS | 两端锁定依赖独立安装、typecheck/build、uv locked sync/pytest/build；全新wheel环境按锁哈希安装并实际启动；两套准确C独立clone重现 |
| M0-01-A02 | PASS | 实际GET健康路径200、冻结五字段及包版本0.1.0；Vue真实请求/完整响应与版本、状态、实例一致 |
| M0-01-A03 | PASS | 实际停止web/API进程和容器验证独立性；同一页面成功→停止API→点击失败及旧字段清除→实际恢复API→原页面点击成功 |
| M0-01-A04 | PASS | api-a/8201与api-b/8202地址及实例切换；真实CORS允许/拒绝GET与preflight；Vite/Nginx代理、刷新和缺失资源404 |
| M0-01-A05 | PASS | 70项Python测试、58项独立wheel配置、9项前端非法配置零fetch、真实浏览器/容器、5秒超时、必要错误路径和受影响回归 |

required / passed / failed / blocked / skipped / not_run：5 / 5 / 0 / 0 / 0 / 0。

| 实测 | 命令数量 | 正常退出0 | 必要拒绝退出1 | 外层入口 |
| --- | --- | --- | --- | --- |
| worker主运行 | 122 | 76 | 46 | 0 |
| worker全新干净检出 | 124 | 78 | 46 | 0 |
| 协调全新独立干净检出 | 124 | 78 | 46 | 0 |

全部实际退出码等于明确expected_exit_code。完整[worker主命令](worker/worker-handoff/main/commands.json)、[worker干净命令](worker/worker-handoff/clean/commands.json)、[独立命令](independent-01569c2-PASS/clean-01569c2/.scratch-runtime/coordinator-m001-origin-review/frozen-clean/commands.json)保存argv、cwd、时刻、stdout/stderr和输出哈希。58项冻结语义对应的独立输入表SHA256为`55f6b488aac84a531a6aac7c3caaa033aab1c8e7059ba2754828ca44dd79fa34`；逐项声明输入到实际命令索引/退出码映射见[审计记录](worker/worker-handoff/audit-results.json)。

浏览器使用真实Chrome156.0.8078.80、Playwright1.56.1、DOM/网络/控制台断言。持续页面记录唯一一次导航、三次请求、200/502/200以及两个真实API进程正常shutdown；[worker持续操作](worker/worker-handoff/main/same-page-lifecycle.json)与[独立持续操作](independent-01569c2-PASS/clean-01569c2/.scratch-runtime/coordinator-m001-origin-review/frozen-clean/same-page-lifecycle.json)保持。非法前端配置均在fetch前明确失败，没有网络替换或截图替代。

## 失败、整改与回归

[首轮独立FAIL](independent-73d7e29-FAIL/REVIEW.md)确认通配origin未拒绝及正式入口缺少持续页面操作；[第二轮独立FAIL](independent-d0af9d7-FAIL/REVIEW.md)确认空userinfo未拒绝。原报告SHA256分别为`da764283db49f0cb108a0e096bf57508434f0582e39ea27a2686581c04096f8a`、`0b056850eb647c884434092399aa2f339c287c67b0d8365cbfef90c573053e16`。两轮全部清单内必要命令、输出、探针和复验均归档，原候选与旧基线保持。

配置[原候选真实red](worker/worker-handoff/old-c-red.log)为8项FAIL、50项PASS；[修正后Python反馈](worker/worker-handoff/green.log)为70项PASS。最终C按成熟解析器字段存在性拒绝userinfo和空query/fragment，完整覆盖合法HTTP/HTTPS/IPv6/端口、多origin/空数组以及非法结构、通配、控制字符、端口、JSON形状/类型和instance边界。

完整任务自查还确认前端空query/fragment：原[真实404请求](worker/worker-handoff/frontend-query-red/empty-query.json)记录两次错误路径GET，断言退出1。修正采用原生URL序列化结果并采集全部fetch；最终主/干净/独立运行的四项新增边界和全部9项非法地址均零fetch。中间7bc4050的118命令入口通过而Spec FAIL的记录在[开发自查](worker/worker-handoff/worker-review.md)与[中间原文](worker/worker-handoff/previous-7bc4050-main/results.json)保留，没有计作最终C通过。

TypeScript兼容性、真实构建/启动/浏览器错误、配置网络失败和日志目录启动失败等历史原文均在[前次完整worker记录](worker/worker-handoff/previous-worker-d0af9d7/)及其更早记录中保持。S及验收语义不变，必要断言没有放宽。

完整vendor/assets、FE-BASE/M0-00证据、许可及旧验收入口与base无差异；两份前置完整哈希清单及16项资产实际核对。vendor npm ci/test/build/build:labs实际重跑通过，dsh身份/origin/配置指纹及Docker版本回归通过。

## 开发自查与独立复验

开发Standards reviewer `8a153739-e7a2-477e-b49c-05e27d86ca2d`、Spec reviewer `3ee2a073-6648-4760-b909-160e9aaf56e1`分别覆盖完整34文件/七提交和所有增量，最终均PASS；[技能路径、哈希及完整反馈](worker/worker-handoff/worker-review.md)保持。

协调独立会话`01a1a274-4921-7f83-85f0-3d056391d87d`的Standards `/root/standards`、Spec `/root/spec`分别完整审查，确认问题0项。其[完整独立报告](independent-01569c2-PASS/REVIEW.md)SHA256=`7fc6f070a0264039d4a3e2649dca5805ef94df6d7342be0d2739cf154a62cc7c`；[独立审计](independent-01569c2-PASS/audit.json)通过49项。继续E/K的公开回执为Issue #5评论`6611125566`，[原始回执](delivery-audit/independent-approval.json)归档。

独立124条命令在全新clone、独立Git/依赖/缓存/wheel环境实际完成；uv与Chrome复用核实过的平台工具。原始[执行脚本](independent-01569c2-PASS/run-frozen.sh)、[外层输出](independent-01569c2-PASS/frozen-clean.log)和[退出码](independent-01569c2-PASS/frozen-clean.exit)均保存。

## 证据定位与复现

归档[来源索引](archive-index.json)逐项关联原始路径、归档相对路径与SHA256。worker原695项全部按原字节归档，来源清单SHA256=`ed63c94d3d029de44b8ab14459fe1ad2253d9c8d844de155b1d228c1c77207fd`；报告引用所需补充文件独立登记。三轮独立源清单保持原文，运行会话全文和代理提示等无关运行资料不进入交付；必要审查、失败和实测原文完整保留。原工具说明资料保持字节，其安装目录引用在索引中单独说明。

使用markdown-it-py4.0.0核查报告相对链接，文件SHA256按实际字节核查；[归档核查记录](delivery-audit/archive-03.log)与[最终证据核查](delivery-audit/validation.json)保存。正式[SHA256总清单](SHA256SUMS.json)覆盖本次证据文件，不含自身；本报告不填写E或K自身最终SHA。

复现时从准确C创建全新独立clone、分离HEAD、按[运行说明](../../../../docs/M0_01.md)准备实际uv/Chrome/系统库和当前clone内的临时目录，然后运行：

```sh
python3 scripts/verify_m0_01.py --criteria 18a9210947e0114a8bbc6a10c8864701dfb8539e --candidate 01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432 --output .scratch-runtime/m0-01/reproduce-<唯一编号> --clean
```

E/K只记录证据和登记，复验应用行为仍在准确C执行。全部worker与独立验收进程、浏览器和Compose已回收；既有其他服务保持。准确C的check-runs=0、commit statuses=0，没有上报CI检查，原文见[独立CI快照](independent-01569c2-PASS/ci-check-runs.json)。

PR #6最终head新增差异、最终交付核查、合并与实际main集成由协调聊天继续完成。当前任务交付范围止于M0-01，FE-INTEGRATE等后续任务需实际集成后单独派发。
