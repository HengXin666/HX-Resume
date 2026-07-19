<div align="center">

<img src="assets/readme/hero.svg" width="100%" alt="HX-Resume：把经历写进去，把简历带出去。">

<p>
  <a href="https://hengxin666.github.io/HX-Resume/">在线体验</a> ·
  <a href="docs/DEVELOPMENT.md">开发指南</a> ·
  <a href="https://github.com/HengXin666/HX-Resume/issues">反馈问题</a>
</p>

<p><sub>编辑一次 · 多模板确认 · 按需导出 · 可选私有同步</sub></p>

<p>
  <img src="https://img.shields.io/badge/License-MIT-00e5ff?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8">
</p>

</div>

HX-Resume 是一个开源的在线简历工作台：在同一块屏幕里编辑内容、实时检查排版，并将结果导出为适合投递、分享或继续加工的多种格式。纯前端模式可直接运行在 GitHub Pages；启用后端后，还能把简历数据同步到自己的私有 Git 仓库。

> 适合需要持续维护多份简历、在不同岗位间切换版本，或希望把个人数据掌握在自己手中的开发者。

## 先看它能做什么

<p align="center">
  <img src="docs/img/02_简历页面.png" width="100%" alt="HX-Resume 编辑器：左侧编辑模块，右侧实时预览简历">
</p>

| 编辑 | 预览 | 输出 | 数据边界 |
| --- | --- | --- | --- |
| 所见即所得编辑、Markdown 富文本、拖拽排序 | 5 套模板、暗色 / 亮色主题、实时分页预览 | PDF、HTML、Markdown、JSON | 公开分享自动打码；完整模式支持 Git 私有仓库同步 |

## 核心能力

- **多份简历，一处管理**：创建、排序、复制简历，并保留版本快照。
- **内容与版式同步确认**：编辑区与预览区并排工作，改动不必反复切页验证。
- **模板随时切换**：Classic、Modern、Minimal、Creative、Professional 五种模板覆盖不同投递场景。
- **公开也能保护隐私**：分享前开启公开模式，姓名、电话、邮箱等敏感信息自动打码。
- **导出不锁定格式**：按需导出 PDF、HTML、Markdown 或 JSON，方便投递、发布和迁移。
- **代码开源，数据私有**：后端以本地 Git 管理简历数据，可 Push / Pull 到你自己的私有仓库。

## 界面预览

<p align="center">
  <img src="docs/img/01_主页.png" width="100%" alt="HX-Resume 简历管理中心">
</p>

<p align="center">
  <img src="docs/img/03_公开简历模式.png" width="100%" alt="HX-Resume 公开简历模式与敏感信息打码">
</p>

<p align="center">
  <img src="docs/img/04_导出PDF演示.png" width="100%" alt="HX-Resume 多格式导出演示">
</p>

<p align="center">
  <img src="docs/img/05_数据同步界面.png" width="58%" alt="HX-Resume Git 私有仓库数据同步设置">
</p>

## 工作流：从内容到成品

<p align="center">
  <img src="assets/readme/workflow.svg" width="100%" alt="HX-Resume 工作流：编辑、预览、导出，并可选同步到私有 Git 仓库">
</p>

## 技术结构

前端负责编辑、状态与预览；后端只在需要本地持久化、字体管理或 Git 同步时参与。静态部署与完整部署共享同一套核心编辑体验。

| 层 | 组成 | 作用 |
| --- | --- | --- |
| UI | React 19 · Ant Design 6 · Vite 8 | 编辑器、模板、主题与交互 |
| 状态 | Zustand · dnd-kit · react-markdown | 内容状态、排序与 Markdown |
| 服务 | FastAPI · SQLAlchemy · SQLite | 本地数据、字体和同步配置 |
| 输出 | html2canvas · jsPDF · Markdown · HTML | 生成可投递、可迁移的结果 |

## 快速开始

### 直接使用

打开 **[在线 Demo](https://hengxin666.github.io/HX-Resume/)**。纯前端模式无需后端，核心编辑、预览、导出与 JSON 导入导出均可使用。

### 本地一键启动

需要 Node.js ≥ 18、Python ≥ 3.11 与 Git：

```bash
git clone https://github.com/HengXin666/HX-Resume.git
cd HX-Resume
sh ./run.sh
```

启动后，打开 `http://localhost:5173`，新建一份简历即可开始。首次只想验证前端时，也可以跳过后端，直接在 `frontend` 目录运行 `pnpm install && pnpm dev`。

前端默认运行在 `http://localhost:5173`，后端 API 默认运行在 `http://localhost:8000`。若要分别启动或调试，请参阅 [开发指南](docs/DEVELOPMENT.md)。

## 静态版与完整模式

| 能力 | GitHub Pages 静态版 | 本地完整模式 |
| --- | :---: | :---: |
| 编辑、实时预览、主题切换 | ✅ | ✅ |
| PDF / HTML / Markdown / JSON 导出 | ✅ | ✅ |
| 多简历与版本快照 | ✅ | ✅ |
| 自定义字体上传 | — | ✅ |
| Git 私有仓库同步 | — | ✅ |
| 数据存储 | 浏览器 `localStorage` | 本地 SQLite + `backend/data/` |

> Git 同步使用本机已有的 SSH 或 HTTPS 凭据，不需要在 HX-Resume 中配置 Token。简历数据目录已从主仓库排除。

## 你可以从哪里开始

- 想直接制作简历：打开 **[在线 Demo](https://hengxin666.github.io/HX-Resume/)**。
- 想本地开发：阅读 [开发指南](docs/DEVELOPMENT.md)，再运行 `sh ./run.sh`。
- 想了解数据同步：查看开发指南中的「私有数据同步」章节。
- 发现问题或有想法：提交 [Issue](https://github.com/HengXin666/HX-Resume/issues)。

## 开发与贡献

更完整的环境说明、目录结构、静态构建与部署步骤见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。欢迎通过 Issue 或 Pull Request 参与改进：

1. Fork 仓库并创建特性分支。
2. 完成修改并在 `frontend` 中运行 `pnpm lint`、`pnpm build`。
3. 提交清晰的变更说明，再发起 Pull Request。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

<div align="center">

如果 HX-Resume 帮你更快完成了一份简历，欢迎点一个 ⭐ Star。

Made with ❤️ by [HengXin666](https://github.com/HengXin666)

</div>
