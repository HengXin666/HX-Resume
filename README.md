# HX-Resume

> 🌌 赛博朋克风格的在线简历制作平台

一个现代化的简历制作、管理和展示平台，采用科技感十足的赛博朋克 UI 设计。

## ✨ 功能特性

- **可视化简历编辑器** — 实时预览，所见即所得
- **多模板支持** — 内置多种专业简历模板
- **自定义样式** — 字体、间距、颜色等全方位调整
- **多格式导出** — 支持 PDF / Markdown / HTML 导出
- **导入导出** — JSON 格式数据导入导出
- **暗黑模式** — 赛博朋克风格 + 亮色模式切换
- **私有数据** — 简历数据存储于 GitHub 私有仓库，代码开源但数据私有
- **后端 API** — FastAPI + SQLite 提供数据存储与展示

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite |
| UI 框架 | Ant Design 5 |
| 状态管理 | Zustand |
| 后端 | FastAPI + SQLAlchemy |
| 数据库 | SQLite |
| PDF 导出 | html2canvas + jsPDF |
| 私有数据 | GitHub API (私有仓库) |

## 📁 项目结构

```
HX-Resume/
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── stores/        # Zustand 状态
│   │   ├── styles/        # 主题和样式
│   │   ├── templates/     # 简历模板
│   │   ├── utils/         # 工具函数
│   │   └── types/         # TypeScript 类型
│   └── ...
├── backend/           # FastAPI 后端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── models/        # 数据库模型
│   │   ├── schemas/       # Pydantic 模型
│   │   ├── services/      # 业务逻辑
│   │   └── core/          # 核心配置
│   └── ...
└── README.md
```

## 🚀 快速开始

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

### 后端

```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

## 🔐 私有数据说明

本项目代码开源，但简历数据存储在 GitHub 私有仓库中。后端通过 GitHub API 获取私有数据，确保个人信息安全。

需要配置环境变量：

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=your_username/your_private_repo
```

## 📄 License

MIT
