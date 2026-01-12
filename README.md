# 初一科技期末考试系统

一个基于 Node.js 和 Express 的在线考试系统，支持学生在线答题和教师管理后台。

## 🚀 在线访问

**部署地址**: https://sci-tech-exam.onrender.com

**学生考试页面**: https://sci-tech-exam.onrender.com/index.html  
**教师管理后台**: https://sci-tech-exam.onrender.com/admin.html

**管理员密码**: `admin123`

## 功能特性

### 学生端
- 📝 在线答题（选择题 + 判断题）
- ⏱️ 考试计时功能（30分钟）
- 🎯 自动评分和结果展示
- 📊 显示正确、错误、未答题数统计
- 🔄 支持多次提交（最多3次）

### 教师管理后台
- 📈 成绩统计（总人数、平均分、最高分、最低分、及格率）
- 📋 成绩列表查看
- 🔍 学生成绩搜索
- 📥 成绩导出（CSV格式）
- 🗑️ 成绩管理（删除单条/清空所有）

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JavaScript
- **数据存储**: JSON 文件
- **跨域**: CORS

## 安装步骤

### 1. 克隆仓库
```bash
git clone https://github.com/Andrew-Pei/sci_tech_exam.git
cd sci_tech_exam
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动服务器
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 使用说明

### 学生考试
1. 访问 `http://localhost:3000/index.html`
2. 填写学生信息（姓名、班级、学号）
3. 答题（30道选择题 + 20道判断题）
4. 点击"提交答案"按钮
5. 查看考试结果

### 教师管理
1. 访问 `http://localhost:3000/admin.html`
2. 查看成绩统计信息
3. 使用搜索功能查找学生
4. 导出成绩或删除成绩

## 考试规则

- **考试时间**: 30分钟
- **选择题**: 30道，每题2分，共60分
- **判断题**: 20道，每题2分，共40分
- **总分**: 100分
- **提交限制**: 每个学号最多可提交3次

## 安全特性

- ✅ 身份验证机制（管理员密码）
- ✅ 输入验证和数据验证
- ✅ 文件备份机制
- ✅ 并发写入保护
- ✅ 提交次数限制

## 配置说明

### 管理员密码
默认管理员密码为 `admin123`，可在 `server.js` 中修改：
```javascript
const ADMIN_PASSWORD = 'admin123';
```

### 端口配置
默认端口为 `3000`，可通过环境变量修改：
```bash
PORT=8080 npm start
```

## 数据存储

- 成绩数据存储在 `scores.json` 文件中
- 自动备份到 `scores_backup.json`
- 每次修改前都会创建备份

## 注意事项

1. 请确保 Node.js 版本 >= 14.0
2. 生产环境请修改默认管理员密码
3. 建议定期备份 `scores.json` 文件
4. 部署时请配置适当的网络安全策略

## 项目结构

```
sci_tech_exam/
├── server.js          # 后端服务器
├── index.html         # 学生考试页面
├── admin.html         # 教师管理后台
├── package.json       # 项目配置
├── package-lock.json  # 依赖锁定
├── .gitignore         # Git忽略配置
├── scores.json        # 成绩数据（自动生成）
└── README.md          # 项目说明
```

## 许可证

MIT License

## 作者

Andrew-Pei

## 更新日志

### v1.0.0 (2026-01-09)
- ✨ 初始版本发布
- ✅ 添加身份验证机制
- ✅ 改进文件存储和并发处理
- ✅ 修复计分逻辑问题
- ✅ 添加提交保护功能
- ✅ 区分未作答和答错题目