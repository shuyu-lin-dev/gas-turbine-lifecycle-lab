Spec FAIL，确认一项P2。代理：`/root/m001_rereview_spec`。

base/merge-base=`b8ad3150cf4480f8e205926541aeeccb072f7f80`；S=`18a9210947e0114a8bbc6a10c8864701dfb8539e`；C=`d0af9d76a459f838f6f8fb8ee656a7b60fc6c790`。覆盖完整33文件、5提交及73d7e29→C；工作树干净。code-review文件加载，SHA256=`9c921a8d88138a41401d8897ca1bb852088ab1b7b605cdd04edc13e3e8aab6dd`。

P2：`backend/src/gt_lifecycle_api/app.py:31`检查username/password真值，接受空userinfo。S `evidence/M0-01/criteria.md:23`要求“只允许显式HTTP/HTTPS origin”“非法配置启动失败”。独立wheel对`["http://@example.com"]`与`["http://:@example.com"]`实际import均退出0；这两个字符串包含userinfo，无法作为页面origin配置使用。应拒绝userinfo存在的配置，并补充真实拒绝断言。精确命令、输出和源码/wheel一致哈希见`spec-origin-probe.json`。

原两项整改已覆盖：通配origin拒绝；同一页面真实停止/恢复API、点击失败清除和恢复成功纳入正式入口。未发现确认的越界行为。主/干净worker证据均关联新C；全部独立验收由主会话核查。本代理仅执行import，未启动服务或浏览器。
