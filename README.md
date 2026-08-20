##整体工作链路
Gitee 收到 Push 代码 (beta分支) ➔ 阿里云 FC（接收请求 ➔ 过滤分支 ➔ 提取项目名） ➔ GitHub Actions (触发工作流，执行 yjcd-deploy.js) ➔ 部署到测试服务器
