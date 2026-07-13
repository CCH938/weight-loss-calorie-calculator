🔥 减肥热量计算器
这是一个科学减肥热量计算器 PWA（渐进式网页应用），支持安装到手机桌面离线使用。主要功能：

四大核心模块：
🧮 计算器 — 根据性别、年龄、身高、体重等信息，计算 BMR（基础代谢率） 和每日推荐热量摄入，并制定减肥热量目标。
🍽️ 饮食记录 — 每日饮食日记，支持按早餐/午餐/晚餐/加餐记录食物，配备内置食品数据库（food-db.js），还能通过 AI 拍照识别食物（camera.js）。
📊 体重追踪 — 记录每日体重变化，使用 Chart.js 生成可视化趋势图表。
🤖 AI 助手 — 内嵌 AI 对话助手（agent.js），连接 OpenAI API，能基于用户数据自动分析减重进展、给出饮食建议，并可直接帮用户执行操作。

技术架构：
文件	说明
index.html	单页面应用入口
css/style.css	全局样式（28KB，支持深色模式）
js/app.js	主应用逻辑（标签切换、日记管理、设置等）
js/calculator.js	BMR 和热量计算引擎
js/food-db.js	常见食物热量数据库
js/camera.js	摄像头拍照 + AI 食物识别
js/tracker.js	体重记录与图表
js/agent.js	AI 对话智能体
sw.js	Service Worker，支持离线缓存
manifest.json	PWA 配置，可安装到主屏幕


整体是一个功能完善的、面向中国用户的减肥辅助工具，界面为中文，绿色主题，支持深色模式切换和本地数据持久化（localStorage）。
