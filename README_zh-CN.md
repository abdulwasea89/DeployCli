<div align="center">
  <img src="./assets/images/icon.png" width="120" height="120" alt="Deploy CLI Logo" />
  <h1>🚀 Deploy CLI</h1>
  <p><b>面向下一代开发者的专业级 AI 驱动命令行界面。</b></p>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/abdulwasea89/DeployCli?style=social)](https://github.com/abdulwasea89/DeployCli)
[![Docker Image](https://img.shields.io/badge/docker-ready-skyblue.svg?logo=docker)](./Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[English](./README.md) | [简体中文](./README_zh-CN.md)

</div>

---

## 🌟 项目概览

**Deploy CLI** 是一款高性能终端助手，将最先进的 AI 推理能力直接引入您的工作流程。它基于“终端优先”设计理念，结合了 React/Ink 的交互逻辑与 Groq 的极速推理能力。

## ✨ 核心特性

- **🧠 深度推理**: 原生支持 `gpt-oss-120b`，专为解决复杂业务逻辑设计。
- **🎨 顶级美学**: 琥珀色与黑色的极简设计，提供极致的终端视觉体验。
- **🔌 插件化架构**: 模块化设计，开发者可轻松定制专属插件。
- **🐳 容器化支持**: 完美适配 Docker 与 Docker Compose。
- **🔐 全链路安全**: 内置工作区身份验证，保障数据安全。

## 📦 项目结构

```text
.
├── 📂 assets/       # 品牌资产与设计指南
├── 📂 bin/          # 二进制执行文件
├── 📂 config/       # 多环境配置文件
├── 📂 docs/         # 项目技术文档
├── 📂 scripts/      # 自动化运维脚本
├── 📂 src/          # 核心源代码
│   ├── ⚛️ components/ # UI 交互组件
│   ├── 🎣 hooks/      # 状态与逻辑逻辑
│   ├── 🛠️ services/   # AI 接口服务层
│   └── 🏷️ types/      # TypeScript 类型定义
├── 📂 tests/        # 自动化测试套件
└── ⚙️ Dockerfile     # 容器构建配置
```

## 🚀 快速开始

### 安装
```bash
# 克隆仓库
git clone https://github.com/abdulwasea89/DeployCli.git
cd DeployCli

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### Docker 运行
```bash
# 使用 Docker Compose 启动
docker-compose run deploy-cli
```

## 👥 贡献者

<a href="https://github.com/abdulwasea89/DeployCli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abdulwasea89/DeployCli" />
</a>

## 📈 星标历史

[![Star History Chart](https://api.star-history.com/svg?repos=abdulwasea89/DeployCli&type=Date)](https://star-history.com/#abdulwasea89/DeployCli&Date)

---

<div align="center">
  <p>由 <a href="https://github.com/abdulwasea89">Abdul Wasea</a> 倾情打造 ❤️</p>
  <p>Deploy CLI 采用 <a href="./LICENSE">MIT 开源协议</a>.</p>
</div>
