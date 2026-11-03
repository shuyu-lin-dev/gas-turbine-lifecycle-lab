# FE-BASE C3/C4 失败与修正记录

C3=`0cbe3372d083fb91bde068824b22dedeb4e61ce0`，统一验收退出1。原版和vendor的npm ci、npm test、npm run build、npm run build:labs均退出0。真实浏览器已完成initial render、两个画布创建、整机旋转/双向缩放、enclosed/cutaway和第一个组件选择；首个组件extract后input=100，而对应`.lab-assembly-tools output`实际仍为0%，冻结独立预期100%，断言退出1。C3的vendor tree仍为原始tree，故这是未修改上游的实际浏览器失败。

反馈入口为已运行的scripts/fe-base/browser.mjs；准确原始commands.json保存actual='0%'、expected='100%'及退出位置143行。源代码读取确认qualityControl插入header，通用el('output')首先匹配画质输出；select、range input、setExtraction、extract/restore四处均使用该通用选择器。实际症状、原始DOM顺序和处理函数提供直接根因证据，无需猜测其他原因。

C4=`86c1c3b5bca425e4a930ac7beb8fdad80b9b4463`的上游补丁只将上述四处选择器改为el('.lab-assembly-tools output')。所有必要断言保持，并补充原生滑块End/Home的100/0、拖动柄ArrowUp/ArrowDown的10/0，以及画质输出仍为实际像素尺寸的回归。原始62项清单保持；验证器逐项核查真实导入blob的原始哈希，候选只允许src/component-inspector.ts这一条明确补丁路径，另保存actual_files/changed_files和完整unified diff。docs/FE_BASE.md明确完整固定版本加本地补丁身份。冻结S和根验收语义保持。

C4的实际运行结果与Standards/Spec复审分别登记；本记录保留原始失败及对应修正，不预填PASS。
