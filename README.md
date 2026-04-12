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
- **Git 同步** — 通过本地 git 命令将数据同步至私有仓库，代码开源但数据私有
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
| 数据同步 | 本地 Git 命令 |

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
│   ├── data/              # 本地数据目录（git 同步用，已 gitignore）
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

## 🔐 私有数据同步

本项目代码开源，但简历数据可通过**本地 git 命令**同步到你的私有仓库中，确保个人信息安全。

### 工作原理

- 后端 `data/` 目录作为独立的 git 仓库，存放简历 JSON 数据
- 该目录已通过 `.gitignore` 排除，不会提交到本项目的开源仓库
- 通过前端「同步设置」面板配置私有仓库地址后，即可一键 Push / Pull

### 使用方式

1. 在 GitHub / Gitee 等平台创建一个**私有仓库**（如 `my-resume-data`）
2. 确保本机 git 已配置好 SSH 密钥或 HTTPS 凭据
3. 在前端 Header 中点击 ⚙️ 齿轮图标，打开「数据同步设置」
4. 填入私有仓库地址（如 `https://github.com/username/my-resume-data.git`）
5. 点击 **Pull** 拉取已有数据 或 **Push** 推送本地数据

> **无需配置任何 Token** — 直接使用本机 git 凭据进行认证。
> 仓库地址配置存储在 `backend/data/sync_config.json` 中，公开也无安全风险（别人没有你仓库的权限）。

## 📄 License

MIT

## 🌐 在线 Demo（GitHub Pages）

本项目支持纯前端模式，无需后端即可使用核心功能（编辑、预览、PDF 导出、JSON 导入导出）。

> 🔗 **在线体验**: 推送到 `main` 分支后自动部署 → `https://<username>.github.io/HX-Resume/`

### 工作原理

- GitHub Actions 自动将前端构建为静态网页（`.github/workflows/deploy-pages.yml`）
- 构建时启用 `VITE_STATIC_MODE=true`，跳过所有后端 API 调用
- 使用 `HashRouter`（URL 带 `#`）避免 GitHub Pages 的 SPA 刷新 404
- 数据存储在浏览器 `localStorage` 中，无需任何服务器

### 静态版本 vs 完整版本

| 功能 | 静态版本 (GitHub Pages) | 完整版本 (含后端) |
|------|:---:|:---:|
| 简历编辑 & 预览 | ✅ | ✅ |
| PDF / HTML / Markdown 导出 | ✅ | ✅ |
| JSON 导入导出 | ✅ | ✅ |
| 暗黑模式切换 | ✅ | ✅ |
| 多简历管理 | ✅ | ✅ |
| 版本快照 | ✅ | ✅ |
| 自定义字体上传 | ❌ | ✅ |
| Git 数据同步 | ❌ | ✅ |
| 跨设备数据同步 | ❌ | ✅ |

### 本地测试静态构建

```bash
cd frontend
pnpm build --mode static
pnpm preview
```

### 手动启用 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. Source 选择 **GitHub Actions**
3. 推送到 `main` 分支即可触发自动部署
