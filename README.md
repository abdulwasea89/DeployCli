<div align="center">
  <h1> Deploy CLI</h1>
  <p><b>A professional AI-powered Command Line Interface for the Next Generation of Developers.</b></p>
  <p>面向下一代开发者的专业级 AI 驱动命令行界面。</p>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/abdulwasea89/DeployCli?style=social)](https://github.com/abdulwasea89/DeployCli)
[![Docker Image](https://img.shields.io/badge/docker-ready-skyblue.svg?logo=docker)](./Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Build Status](https://img.shields.io/github/actions/workflow/status/abdulwasea89/DeployCli/ci.yml?branch=main)](https://github.com/abdulwasea89/DeployCli/actions)

[English](./README.md) | [简体中文](./README_zh-CN.md)

</div>

---

## 🌟 Overview / 项目概览

**Deploy CLI** is a high-performance terminal assistant that brings state-of-the-art AI reasoning directly to your workflow. Built with a "Terminal First" philosophy, it combines the flexibility of React/Ink with the power of Groq's low-latency inference.

**Deploy CLI** 是一款高性能终端助手，将最先进的 AI 推理能力直接引入您的工作流程。它秉承“终端优先”的理念，融合了 React/Ink 的灵活性与 Groq 的低延迟推理能力。

## ✨ Key Features / 核心特性

- **🧠 Deep Reasoning**: Native support for `gpt-oss-120b` for complex problem solving. (原生支持 `gpt-oss-120b`，助力解决复杂难题。)
- **🎨 Premium Aesthetics**: Aesthetically pleasing TUI with Amber/Black glassmorphism-inspired design. (精美的 TUI 设计，灵感源自琥珀色与黑色的玻璃拟态风格。)
- **🔌 Enterprise Modular**: Decoupled architecture for easy extension and plugin development. (解耦的架构设计，支持轻松扩展和插件开发。)
- **🐳 Container Native**: First-class support for Docker and Docker Compose. (原生支持 Docker 和 Docker Compose，环境无忧。)
- **🔐 Secure Flow**: Integrated workspace authentication and secure credential handling. (集成的任务空间身份验证和安全凭据管理。)

## 📦 Project Structure / 项目结构

```text
.
├── 📂 assets/       # Brand assets & guidelines (品牌资产)
├── 📂 bin/          # Executables (二进制可执行文件)
├── 📂 config/       # Multi-env configs (多环境配置)
├── 📂 docs/         # Documentation (项目文档)
├── 📂 scripts/      # Automation tools (自动化脚本)
├── 📂 src/          # Source Code (源代码)
│   ├── ⚛️ components/ # UI Elements (UI 组件)
│   ├── 🎣 hooks/      # Logic hooks (逻辑钩子)
│   ├── 🛠️ services/   # AI layer (AI 服务层)
│   └── 🏷️ types/      # Type safety (类型定义)
├── 📂 tests/        # Test suites (测试套件)
└── ⚙️ Dockerfile     # Deployment config (部署配置)
```

## 🚀 Quick Start / 快速开始

### Installation / 安装
```bash
# Clone
git clone https://github.com/abdulwasea89/DeployCli.git
cd DeployCli

# Install dependencies
npm install

# Run (Development)
npm run dev
```

### Docker Usage / 容器使用
```bash
# Using Compose
docker-compose run deploy-cli
```

## 🛠 Tech Stack / 技术栈

- [Ink](https://github.com/vadimdemedes/ink) - React for interactive CLIs
- [Groq](https://groq.com) - Ultra-fast AI inference
- [Zod](https://zod.dev) - Schema validation
- [Docker](https://www.docker.com) - Containerization

## 🤝 Contributing / 参与贡献

Contributions are extremely welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

非常欢迎参与贡献！请查阅我们的 [贡献指南](./CONTRIBUTING.md) 开始。

## 👥 Contributors / 贡献者

<a href="https://github.com/abdulwasea89/DeployCli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abdulwasea89/DeployCli" />
</a>

## 📈 Star History / 星标趋势

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=abdulwasea89/DeployCli&type=date&legend=top-left)](https://www.star-history.com/#abdulwasea89/DeployCli&type=date&legend=top-left)

---
