# 🛠️ 开发指南

> HX-Resume 开发者文档 — 环境搭建、技术架构与部署说明

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite 8 |
| UI 框架 | Ant Design 6 |
| 状态管理 | Zustand |
| 拖拽排序 | dnd-kit |
| Markdown | react-markdown + remark-gfm |
| 后端 | FastAPI + SQLAlchemy |
| 数据库 | SQLite (aiosqlite) |
| PDF 导出 | html2canvas + jsPDF |
| 数据同步 | 本地 Git 命令 |

## 📁 项目结构

```
HX-Resume/
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   │   └── editor/      # 各模块编辑器
│   │   ├── pages/           # 页面（首页、编辑器、关于）
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── styles/          # 主题和全局样式
│   │   ├── templates/       # 简历模板（5 套）
│   │   ├── utils/           # 工具函数（API、导出）
│   │   └── types/           # TypeScript 类型定义
│   └── package.json
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/             # API 路由（简历、字体、同步）
│   │   ├── models/          # SQLAlchemy 数据模型
│   │   ├── schemas/         # Pydantic 校验模型
│   │   ├── services/        # 业务逻辑（简历管理、Git 同步）
│   │   └── core/            # 核心配置 & 数据库
│   ├── data/                # 本地数据目录（已 gitignore）
│   └── pyproject.toml
├── docs/                    # 文档 & 截图
└── README.md
```

## 🚀 快速开始

### 前置要求

- **Node.js** ≥ 18，推荐使用 [pnpm](https://pnpm.io/) 管理依赖
- **Python** ≥ 3.11，推荐使用 [uv](https://docs.astral.sh/uv/) 管理依赖
- **Git**（用于数据同步功能）

### 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端默认运行在 `http://localhost:5173`

### 启动后端

```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

后端默认运行在 `http://localhost:8000`，API 文档在 `http://localhost:8000/docs`

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

## 🌐 GitHub Pages 部署

本项目支持纯前端模式，无需后端即可使用核心功能（编辑、预览、PDF 导出、JSON 导入导出）。

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
