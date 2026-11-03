# FE-BASE 调查与首轮失败记录

Ticket：914d2ac32b5d2f130d718138164c8bab；日期：2026-11-03（Asia/Shanghai）。本文件保存调查事实，不作通过声明。

环境调查：Node24.22.2/npm11.19.1；agent-browser0.41.0取得Chrome for Testing156.0.8078.80。首次浏览器探针提供的路径多了一层chrome-linux64，进程退出1；按实际安装路径修正后，真实进程报缺少libnspr4.so并退出127；ldd还确认libnss3/libnssutil3/libsmime3/libasound2缺失。sudo -n true退出1，需要密码。通过apt-get download取得libnspr4、libnss3、libasound2t64、libasound2-data，并用dpkg-deb提取实际库到任务忽略目录。再次启动出现Chromium Unix socket path too long，进程SIGABRT；用专用短路径符号链接指向本任务临时目录后，真实Chrome WebGL2探针退出0。环境参数随后写入S；未修改profile、认证或系统软件。

原始C1=d42a280c2be5d7cc1632a11e30a96be49dce2bb9。统一验收命令退出1；原版和vendor的npm ci、npm test、npm run build、npm run build:labs、npm ls均退出0。首个浏览器实测的initial render、静止对照、真实拖动旋转及双向滚轮缩放已取得GPU数据；切换enclosed后，getAttribute的[data-housing=enclosed]同时匹配#app与button，Playwright strict mode violation退出1。对应原始commands.json及candidate-browser.json均完整保留于fe-base-C1输出目录。

诊断采用diagnosing-bugs实际工具加载，文件/home/lsy/.dsh/skills/diagnosing-bugs/SKILL.md，SHA256=849198df88cdb65fd0d97236604c1fca7ff2f22d2f705f9724a800d0266b118d。已运行的统一真实浏览器脚本直接捕捉该错误；错误消息同时提供匹配的两个真实DOM元素，固定源代码同步data-housing行为与之吻合。根因证据已明确，因此不另行猜测其他原因。修正为button[data-housing]并在新C上重跑原始完整流程。

首轮Standards reviewer=cd910d19-a6ee-4d01-9430-84bf99f37f0a，Spec reviewer=7262986a-cbb4-4493-80b2-e2174092a748。固定比较base/merge-base=86e521184a4d5bbd42dfe93a48999fa714c233f2，完整77文件，C1工作树干净。Standards FAIL：浏览器异步错误只记录到流程末尾，缺少立即终止。Spec FAIL：外壳selector实际失败；全部组件面包屑、extract/restore的output/投影及组件反向缩放覆盖不足。建议以当前模式独立稳定帧核查外壳draw变化。

整改C2=05bf9bc4e9d03fe4159161f7ebefa66a4fde2974。全部10个组件逐项检查标题/面包屑/aria、实际绘制和extract/restore输入/output/投影；统一镜头helper检查静止、旋转、双向缩放；外壳独立清空观察计数并比较最新稳定帧；GPU观察按实际draw的新鲜度选程序；console.error/pageerror/requestfailed/HTTP>=400通过Promise.race立即拒绝并保存证据，finally回收浏览器。完整vendor与上游tree保持相同。新C已提交，原始反馈流程正在重验；最终判定采用对应实测与复审结果。
