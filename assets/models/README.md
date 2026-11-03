# 工业燃气轮机教学模型资产

本目录是前一轮已准备的模型资产副本，随 dsh 交接包提供；没有因此完成本机浏览器验收。

v2 的主要运行路径改为完整克隆并二次开发 turbine-explorer，以保留原程序交互。本目录 GLB 用于资产交换、结构快照和按需备用展示，不要求用它替换完整源程序。M0-06 的主路径以 v2 ACCEPTANCE.md 为准。

## 直接使用

需要加载 GLB 时使用 `industrial-gas-turbine-educational.glb`。文件大小 13,479,328 字节，SHA256：

`f650a3b2c080ea76bb5daa9e0f4c7f37f0f5bf7774f2d323e42ef432a00fa316`

原作者项目：[AlexZhangji/turbine-explorer](https://github.com/AlexZhangji/turbine-explorer)，源快照 `efc5d2ecd12055f880a41b47215791c22d3656d4`。原作者用 Three.js 程序几何构造模型，本文件从该来源导出为 GLB；保留 MIT 许可。它是通用工业燃机教学结构，不能标成上燃实际机型或制造 CAD。

模型使用 `EXT_mesh_gpu_instancing`，选择处理需兼容实例化网格。`component-map.json` 提供 compressor、combustor、turbine、bearing_front、exhaust 的建议映射；业务测点由本项目另行绑定。

离线已检查 GLB 头、长度、节点、材质、扩展和 GLTFLoader 解析。浏览器可见效果、部件选择、壳体显隐、反复进入及性能应按 M0-06 实际验证。

## 来源与转换文件

- `LICENSE.txt`：原作者许可。
- `THREE-LICENSE.txt`：Three.js 许可。
- `industrial-model-inspection.json`：资产静态检查结果。
- `source/`：导出所需的源码子集、转换脚本、依赖清单及上游说明。

`source/README.md` 是原作者项目说明，提及的演示页面、截图、开发入口和部分文件不包含在此源码子集中，不能把本目录当作完整上游应用运行。完整上游项目以源仓库为准。

已提供的转换脚本使用源目录作为工作目录，输出到其父目录；仅在需要重新生成资产时使用，并重新记录版本与哈希。导出删除了运行时粒子、灯光和程序纹理，保留示意几何及金属材质颜色。GLB 没有内置运行动画；应用中未来新增动画也需要单独验收。

第三方资产与来源许可必须随项目保留。项目自己的代码许可不能覆盖第三方许可。
