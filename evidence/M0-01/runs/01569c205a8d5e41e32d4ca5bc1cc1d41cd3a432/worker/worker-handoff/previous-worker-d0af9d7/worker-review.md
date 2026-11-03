# M0-01 整改候选开发自查

准确C：`d0af9d76a459f838f6f8fb8ee656a7b60fc6c790`；S：`18a9210947e0114a8bbc6a10c8864701dfb8539e`；固定base/实际merge-base：`b8ad3150cf4480f8e205926541aeeccb072f7f80`。完整33文件、五提交18a9210/f80af8b/290f173/73d7e29/d0af9d7，并核对旧C73d7e29→新C六文件整改增量。开始与结束工作树均干净，冻结S/ACCEPTANCE、vendor/assets/前置证据和旧入口保持。

原独立会话`01a1a233-9fc1-7302-be2e-4db9ad6dd343`的Standards PASS、Spec FAIL和最终A05 FAIL保留于原目录。原REVIEW.md SHA256=`da764283db49f0cb108a0e096bf57508434f0582e39ea27a2686581c04096f8a`。当前开发自查与后续协调全新独立复审分别登记。

## Standards

reviewer：`5e14249d-7360-4bf8-a56b-d2dd3bf75995`。结论PASS，必须修正0项。完整读取全局/根规则、权威规格、领域及适配、冻结、前置报告与旧独立审查；通过gh完整读取整改评论6609696194。未发现其他CODING_STANDARDS、CONTRIBUTING或ADR；五提交author/committer身份正确。

一项非阻断判断建议：browser.mjs与lifecycle.mjs存在部分相似page事件采集逻辑，可考虑共享辅助函数。当前两入口的采集范围、错误响应和操作流程分别明确，保持直接可读的测试入口，本次不增加公共抽象。该建议不影响规范或必要验收。

实际调用code-review并读取`/home/lsy/.dsh/skills/code-review/SKILL.md`，SHA256=`9c921a8d88138a41401d8897ca1bb852088ab1b7b605cdd04edc13e3e8aab6dd`；无disable-model-invocation及额外相对引用。全程只读，无测试、服务、容器、环境或文件变更。

## Spec

reviewer：`c65068f9-ab03-4cf6-b166-c7c10291200b`。结论PASS，确认问题0项。原Issue #5、整改评论6609696194和旧REVIEW/spec/supplement全部读取。完整33文件和六文件增量均覆盖，无证据支持的遗漏、超范围或错误实现。

P2-01覆盖：app.py使用urlsplit/Pydantic AnyHttpUrl并拒绝通配符；HTTP测试保留合法GET/preflight、不允许origin及原非法输入，加入两种通配拒绝。正式入口在独立wheel环境执行两次预期退出1和一次合法配置退出0，错误预期来自原冻结规则。

P2-02覆盖：正式入口直接调用test:lifecycle并传独立wheel Python；连续测试实际创建、正常终止并等待API退出，使用单个Chrome页面完成初次成功、实际停止后原页面点击失败与旧字段清除、实际恢复后原页面点击成功。严格断言两次200完整响应、三次请求和一次导航，记录真实PID与原始输出。没有Mock、替换网络或新页面替代。

全程只读，无执行验收、启动服务、改变环境或干预其他进程。本记录只证明开发自查；正式主/干净实测和协调独立复审各自另存原始证据。
