<div align="center">
  <h1>🚀 Deploy CLI</h1>
  <p><b>面向下一代开发者的专业级 AI 驱动命令行界面。</b></p>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/abdulwasea89/DeployCli?style=social)](https://github.com/abdulwasea89/DeployCli)
[![Docker Image](https://img.shields.io/badge/docker-ready-skyblue.svg?logo=docker)](./Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

[English](./README.md) | [简体中文](./README_zh-CN.md)

</div>

---

## 🌟 项目概览

**Deploy CLI** 是一款高性能终端助手，将最先进的 AI 推理能力直接引入您的工作流程。它基于"终端优先"设计理念，结合了 React/Ink 的交互逻辑与 Groq 的极速推理能力，具备安全身份验证、文件上下文包含和精美的玻璃拟态界面设计。

## ✨ 核心特性

### 🤖 AI 与推理
- **🧠 深度推理**: 原生支持 `gpt-oss-120b`，提供实时推理显示，专为解决复杂问题设计
- **📄 文件上下文**: 使用 `@文件名` 语法在对话中包含文件内容，实现上下文感知的 AI 响应
- **💬 流式响应**: 实时文本和推理流式传输，提供响应式交互体验
- **🔄 会话持久化**: 自动会话恢复和聊天历史记录保存

### 🎨 用户体验
- **✨ 顶级美学**: 琥珀色与黑色的玻璃拟态设计，提供极致的终端视觉体验
- **⌨️ 交互命令**: 丰富的命令系统 (`/login`, `/clear`, `/help`, `/logout`, `/exit`)
- **🌐 多语言**: 完整的英语和中文语言支持
- **🎯 终端优先**: 专为生活在终端中的开发者优化

## 架构

Deploy CLI 采用解耦的多组件架构设计，以确保可扩展性和可维护性。它由三大部分组成：CLI、用于身份验证的后端服务器和用于登录的 Web 门户。

```mermaid
graph TD
    subgraph 用户交互
        A[用户的终端]
    end

    subgraph 系统组件
        B[Deploy CLI (Ink/React)]
        C[后端服务器 (Hono)]
        D[Web 门户 (Next.js)]
        E[PostgreSQL 数据库]
    end

    subgraph 外部服务
        F[Groq AI API]
        G[Better Auth]
    end

    A -- 进行交互 --> B
    B -- "/login" 命令 --> C
    C -- 生成 URL --> B
    B -- 在浏览器中打开 URL --> D
    D -- 通过...处理 OAuth --> G
    G -- 返回会话至 --> D
    D -- 将会话存储在 --> E
    C -- 轮询会话 --> E
    C -- 返回会话至 --> B
    B -- 向...发出经身份验证的请求 --> F
```

### 组件

-   **CLI 应用程序 (`src/`)**: 使用 **Ink** 和 **React** 构建，是用户与 AI 互动的主界面。它负责管理用户界面、处理用户输入，并与后端服务通信。
-   **后端服务器 (`src/server/`)**: 一个轻量级的 **Hono** 服务器，负责处理身份验证流程。它与 Web 门户和数据库通信，以验证用户会话。
-   **Web 门户 (`web/`)**: 一个 **Next.js** 应用程序，提供一个基于 Web 的界面，供用户通过 **Better Auth** 登录和验证身份。
-   **数据库 (`docker-compose.yml`)**: 一个 **PostgreSQL** 数据库，用于存储用户会话和其他应用程序数据。

### 身份验证流程

1.  用户在 CLI 中运行 `/login` 命令。
2.  CLI 向后端服务器发送请求，以启动身份验证过程。
3.  后端服务器生成一个唯一的验证码和 Web 门户的 URL，并将其发送回 CLI。
4.  CLI 在用户的默认浏览器中打开该 URL。
5.  用户通过 Web 门户登录，该门户使用 **Better Auth** 处理 OAuth 流程。
6.  身份验证成功后，Web 门户将用户的会话令牌存储在 PostgreSQL 数据库中。
7.  同时，后端服务器轮询数据库以检查会话令牌。
8.  一旦找到令牌，后端服务器会将其发送到 CLI，完成身份验证过程。
9.  然后，CLI 可以向 **Groq AI API** 发出经身份验证的请求。

## 项目结构

```text
.
├── assets/           # 品牌资产和设计指南
├── bin/              # CLI 应用程序的可执行二进制文件
├── config/           # 应用程序的多环境配置
│   ├── constants.ts     # 应用程序常量和共享配置值
│   └── environments/    # 特定于环境的配置（例如，开发、生产）
├── docs/             # 技术文档、指南和架构图
├── scripts/          # 用于数据库管理等任务的自动化脚本
├── src/              # CLI 的主要应用程序源代码
│   ├── components/   # 用于终端接口的可重用 React/Ink UI 组件
│   │   ├── ChatHistory.tsx  # 用于显示消息历史记录的组件
│   │   ├── ChatInput.tsx    # 用于用户输入和命令处理的组件
│   │   └── Header.tsx       # 应用程序页眉和品牌的组件
│   ├── hooks/        # 用于状态管理和逻辑的自定义 React 钩子
│   │   └── useChat.ts       # 用于管理聊天状态和 API 交互的核心钩子
│   ├── services/     # 业务逻辑和与外部 API 的集成
│   │   ├── aiService.ts     # 用于与 Groq AI API 交互的服务
│   │   └── auth/            # 用于处理用户身份验证的服务
│   ├── types/        # TypeScript 类型定义和接口
│   ├── server/       # 用于处理身份验证的后端 API 服务器 (Hono)
│   ├── lib/          # 共享实用程序、库和辅助函数
│   ├── middleware/   # 后端服务器请求的中间件
│   ├── schemas/      # 使用 Zod 的数据验证模式
│   └── themes/       # UI 主题、样式和颜色定义
├── web/              # 用于身份验证 Web 门户的 Next.js 应用程序
├── tests/            # 应用程序的自动化测试
│   ├── integration/     # 组合组件的集成测试
│   └── unit/           # 单个组件和函数的单元测试
├── Dockerfile        # 用于构建 Docker 容器的配置
├── docker-compose.yml # 用于多服务编排的 Docker Compose 配置
└── package.json     # Node.js 项目元数据、依赖项和脚本
```

## 🚀 快速开始

### 系统要求
- **Node.js 20+**
- **npm 或 yarn**
- **Docker & Docker Compose** (推荐完整设置)

### 本地开发

#### 1. 克隆和设置项目
```bash
# 克隆仓库
git clone https://github.com/abdulwasea89/DeployCli.git
cd DeployCli

# 安装依赖
npm install
```

#### 2. 环境配置
```bash
# 复制环境模板
cp .env.example .env

# 编辑 .env 配置您的设置
# 必需: GROQ_API_KEY, DATABASE_URL 等
```

#### 3. 数据库设置
```bash
# 启动 PostgreSQL 数据库
docker-compose up -d db

# 初始化数据库模式
npm run db:init
```

#### 4. 启动应用
```bash
# 终端 1: 启动后端 API 服务器
npm run server

# 终端 2: 启动认证 Web 门户
cd web && npm install && npm run dev

# 终端 3: 启动 CLI 应用
npm run dev
```

### Docker 部署
```bash
# 使用 Docker Compose 构建并运行
docker-compose up --build

# 或仅运行 CLI
docker-compose run --rm deploy-cli
```

## 📖 使用指南

### 身份验证
```bash
# 启动 CLI
npm run dev

# 在 CLI 中输入:
/login
```
这将在浏览器中打开认证页面 `http://localhost:3000` 进行身份验证。

### 聊天命令
```
/help          # 显示可用命令
/login         # 登录服务
/logout        # 清除当前会话
/clear         # 清除聊天历史
/exit          # 退出应用
```

### 文件上下文
在对话中包含文件以获得上下文感知的 AI 响应:
```
告诉我如何优化这段代码 @src/components/ChatInput.tsx
```

## 🔧 API 参考

### 认证端点

#### POST `/api/auth/*`
Better Auth OAuth 端点用于用户认证。

#### POST `/custom/auth/initiate`
启动认证流程。
```json
// 响应
{
  "code": "A1B2C3D4",
  "url": "http://localhost:3000/login?CODE=A1B2C3D4"
}
```

#### POST `/custom/auth/verify`
验证认证代码。
```json
// 请求
{
  "code": "A1B2C3D4",
  "userId": "user_123",
  "sessionToken": "token_here"
}
```

#### GET `/custom/auth/poll?code={code}`
轮询认证状态。

#### POST `/custom/auth/validate`
验证会话令牌。

## 🛠 技术栈

### 前端与命令行
- **[Ink](https://github.com/vadimdemedes/ink)** - 用于交互式 CLI 的 React
- **[React 19](https://react.dev/)** - UI 框架
- **[Next.js 16](https://nextjs.org/)** - Web 认证门户

### 后端与服务
- **[Hono](https://hono.dev/)** - 轻量级 API 框架
- **[Better Auth](https://better-auth.com/)** - 认证库
- **[PostgreSQL](https://postgresql.org/)** - 主数据库
- **[Redis](https://redis.io/)** - 会话存储 (可选)

### AI 与数据处理
- **[Groq](https://groq.com)** - 超快 AI 推理
- **[Vercel AI SDK](https://vercel.com/docs/ai)** - AI 集成框架
- **[Zod](https://zod.dev)** - 模式验证

### 开发与部署
- **[TypeScript 5.9+](https://www.typescriptlang.org/)** - 类型安全
- **[Docker](https://www.docker.com/)** - 容器化
- **[ESLint](https://eslint.org/)** - 代码检查
- **[tsx](https://tsx.is/)** - TypeScript 执行

## 🧪 测试

```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:integration

# 运行所有测试并生成覆盖率报告
npm run test:coverage
```

## 🤝 参与贡献

非常欢迎参与贡献！请查阅我们的 [贡献指南](./CONTRIBUTING.md) 开始。

### 开发工作流
1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 进行更改并添加测试
4. 运行测试: `npm test`
5. 提交 Pull Request

### 代码规范
- **TypeScript**: 启用严格类型检查
- **ESLint**: 自动化代码检查和格式化
- **Pre-commit hooks**: 自动化测试和代码检查
- **Conventional commits**: 标准化的提交信息格式

## 📚 文档

- **[架构说明](./docs/architecture.md)** - 系统设计和组件概览
- **[API 文档](./docs/api/)** - 后端 API 规范
- **[贡献指南](./CONTRIBUTING.md)** - 开发指南
- **[品牌指南](./assets/brand_guidelines.md)** - 设计和品牌标准

## 🐛 问题排查

### 常见问题

**CLI 无法启动**
```bash
# 检查 Node.js 版本
node --version  # 应该是 20+

# 清除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install
```

**身份验证失败**
```bash
# 确保后端服务器正在运行
npm run server

# 检查数据库连接
docker-compose ps
docker-compose logs db
```

**Docker 构建失败**
```bash
# 清理 Docker 缓存
docker system prune -a

# 无缓存重新构建
docker-compose build --no-cache
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 👥 贡献者

<a href="https://github.com/abdulwasea89/DeployCli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abdulwasea89/DeployCli" />
</a>

## 🙏 致谢

- **Groq** 提供超快 AI 推理
- **Vercel** 提供 AI SDK 和 Next.js
- **Ink** 提供出色的 CLI 框架
- **Better Auth** 提供无缝认证体验

## 📈 星标历史

[![Star History Chart](https://api.star-history.com/svg?repos=abdulwasea89/DeployCli&type=date&legend=top-left)](https://www.star-history.com/#abdulwasea89/DeployCli&type=date&legend=top-left)

---

<div align="center">
  <p>由 <a href="https://github.com/abdulwasea89">Abdul Wasea</a> 倾情打造 ❤️</p>
  <p>Deploy CLI 是采用 <a href="./LICENSE">MIT 许可证</a>的开源软件。</p>
</div>
