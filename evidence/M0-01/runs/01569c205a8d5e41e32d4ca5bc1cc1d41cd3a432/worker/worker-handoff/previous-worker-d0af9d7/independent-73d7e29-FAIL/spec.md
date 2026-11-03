Spec：FAIL。

独立子代理：/root/spec_review；fork_turns=none，全新上下文，只读并行审查。覆盖固定base/merge-base=b8ad3150cf4480f8e205926541aeeccb072f7f80至C=73d7e29cb2e837eceb4767932e116e76e4916d0f的全部32文件、四提交、冻结S=18a9210947e0114a8bbc6a10c8864701dfb8539e、Issue #5、五条必要验收和前置保留范围。工作树没有未提交变更。子代理未运行服务、浏览器、容器或验收，未修改文件。

P2-01：backend/src/gt_lifecycle_api/app.py:31的origin校验接受hostname中的通配符。冻结evidence/M0-01/criteria.md:23要求只允许显式HTTP/HTTPS origin、不允许通配、非法配置启动失败。复现输入API_CORS_ORIGINS='["http://*"]'或'["https://*.example.com"]'，命令为实际安装环境python -c 'import gt_lifecycle_api.app'。当前校验允许导入，预期非零退出。影响配置校验即时失败，未判定存在CORS绕过。复验须覆盖含通配符的完整URL、原非法输入和合法origin。

P2-02：scripts/verify_m0_01.py:143和:193分别为停止、恢复API调用run.browser；frontend/tests/browser.mjs:10每次创建新浏览器。冻结A03要求恢复API后点击重新检查恢复正常。当前入口验证新页面加载，缺少同一失败页面的恢复和旧成功字段清除记录。主会话补充同一页面连续操作的独立真实复验；应用是否正确与入口覆盖缺口分别登记。

主会话使用实际backend环境独立复现P2-01：两种含通配符origin均退出0，原始输出和退出码保存为wildcard-http.log/.exit、wildcard-subdomain.log/.exit。干净clone和wheel独立复现结果另存supplement/results.json。

独立子代理随后完整读取supplement/results.json及supplement.log复核：P2-01确认，A05 FAIL；P2-02确认为冻结入口的持续回归覆盖缺口；同页实际恢复补充结果证明A03行为PASS。补充脚本退出1准确对应通配配置断言。
