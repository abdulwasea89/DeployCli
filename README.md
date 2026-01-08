<div align="center">
  <h1>Deploy CLI</h1>
  <p><b>A professional AI-powered Command Line Interface for the Next Generation of Developers.</b></p>
  <p>面向下一代开发者的专业级 AI 驱动命令行界面。</p>

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/abdulwasea89/DeployCli?style=social)](https://github.com/abdulwasea89/DeployCli)
[![Docker Image](https://img.shields.io/badge/docker-ready-skyblue.svg?logo=docker)](./Dockerfile)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Build Status](https://img.shields.io/github/actions/workflow/status/abdulwasea89/DeployCli/ci.yml?branch=main)](https://github.com/abdulwasea89/DeployCli/actions)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)

[English](./README.md) | [简体中文](./README_zh-CN.md)

</div>

---

## Overview

**Deploy CLI** is a high-performance terminal assistant that brings state-of-the-art AI reasoning directly to your workflow. Built with a "Terminal First" philosophy, it combines the flexibility of React/Ink with the power of Groq's low-latency inference, featuring secure authentication, file context inclusion, and a beautiful glassmorphism-inspired interface.

## Who am I and why I built this

Hi there! I'm Abdul Wasea, a passionate software developer who spends most of my day in the terminal. For years, I've been frustrated with the disconnect between powerful AI tools and the command-line environment where I do most of my work.

I built Deploy CLI because I wanted an AI assistant that feels like a natural extension of my terminal workflow. No more switching between browser tabs, copying code snippets, or losing context when asking AI for help. This tool lives where I live - in the terminal.

My goal is to create something that not only solves real developer problems but also demonstrates how AI can be deeply integrated into our daily development workflows. Every feature in Deploy CLI was born from my own frustrations and the desire to build something I'd want to use every day.

## Key Features

### AI & Reasoning
- **Deep Reasoning**: Native support for `gpt-oss-120b` for complex problem solving with real-time reasoning display
- **File Context**: Include files in conversations using `@filename` syntax for context-aware responses
- **Streaming Responses**: Real-time text and reasoning streaming for responsive interactions
- **Session Persistence**: Automatic session recovery and chat history preservation

### User Experience
- **Premium Aesthetics**: Aesthetically pleasing TUI with Amber/Black glassmorphism-inspired design
- **Interactive Commands**: Rich command system (`/login`, `/clear`, `/help`, `/logout`, `/exit`)
- **Multi-language**: Full English and Chinese language support
- **Terminal First**: Optimized for developers who live in the terminal

### Architecture
- **Enterprise Modular**: Decoupled architecture for easy extension and plugin development
- **Container Native**: First-class support for Docker and Docker Compose with complete containerization
- **Secure Authentication**: Integrated OAuth-based authentication with secure token management
- **High Performance**: Built with modern Node.js, TypeScript, and optimized for low-latency responses

## Project Structure

```text
.
├── assets/           # Brand assets & design guidelines
├── bin/              # Executable binaries
├── config/           # Multi-environment configurations
│   ├── constants.ts     # App constants and configuration
│   └── environments/    # Environment-specific configs
├── docs/             # Technical documentation
├── scripts/          # Automation and database scripts
├── src/              # Main application source code
│   ├── components/   # React/Ink UI components
│   │   ├── ChatHistory.tsx  # Message display component
│   │   ├── ChatInput.tsx    # Interactive input component
│   │   └── Header.tsx       # App header with branding
│   ├── hooks/        # React hooks for state management
│   │   └── useChat.ts       # Main chat logic and state
│   ├── services/     # Business logic and API integrations
│   │   ├── aiService.ts     # Groq AI integration
│   │   └── auth/            # Authentication services
│   ├── types/        # TypeScript type definitions
│   ├── server/       # Backend API server
│   ├── lib/          # Shared utilities and libraries
│   ├── middleware/    # Request middleware
│   ├── schemas/      # Data validation schemas
│   └── themes/       # UI themes and styling
├── web/              # Next.js authentication portal
├── tests/            # Test suites
│   ├── integration/     # Integration tests
│   └── unit/           # Unit tests
├── Dockerfile        # Container build configuration
├── docker-compose.yml # Multi-service orchestration
└── package.json     # Node.js dependencies and scripts
```

## Quick Start

### Prerequisites
- **Node.js 20+**
- **npm or yarn**
- **Docker & Docker Compose** (recommended for full setup)

### Local Development / 本地开发

#### 1. Clone and Setup / 克隆项目
```bash
# Clone the repository
git clone https://github.com/abdulwasea89/DeployCli.git
cd DeployCli

# Install dependencies
npm install
```

#### 2. Environment Configuration / 环境配置
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: GROQ_API_KEY, DATABASE_URL, etc.
```

#### 3. Database Setup / 数据库设置
```bash
# Start PostgreSQL database
docker-compose up -d db

# Initialize database schema
npm run db:init
```

#### 4. Start the Application / 启动应用
```bash
# Terminal 1: Start the backend API server
npm run server

# Terminal 2: Start the authentication web portal
cd web && npm install && npm run dev

# Terminal 3: Start the CLI application
npm run dev
```

### Docker Deployment / Docker 部署
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run CLI only
docker-compose run --rm deploy-cli
```

## Usage Guide

### Authentication
```bash
# Start the CLI
npm run dev

# In the CLI, type:
/login
```
This will open your browser for authentication via the web portal at `http://localhost:3000`.

### Chat Commands
```
/help          # Show available commands
/login         # Authenticate with the service
/logout        # Clear current session
/clear         # Clear chat history
/exit          # Exit the application
```

### File Context
Include files in your conversations for context-aware AI responses:
```
Tell me how to optimize this code @src/components/ChatInput.tsx
```

## API Reference

### Authentication Endpoints / 认证端点

#### POST `/api/auth/*`
Better Auth OAuth endpoints for user authentication.

#### POST `/custom/auth/initiate`
Initiate authentication flow.
```json
// Response
{
  "code": "A1B2C3D4",
  "url": "http://localhost:3000/login?CODE=A1B2C3D4"
}
```

#### POST `/custom/auth/verify`
Verify authentication code.
```json
// Request
{
  "code": "A1B2C3D4",
  "userId": "user_123",
  "sessionToken": "token_here"
}
```

#### GET `/custom/auth/poll?code={code}`
Poll authentication status.

#### POST `/custom/auth/validate`
Validate session token.

## Tech Stack

### Frontend & CLI
- **[Ink](https://github.com/vadimdemedes/ink)** - React for interactive CLIs
- **[React 19](https://react.dev/)** - UI framework
- **[Next.js 16](https://nextjs.org/)** - Web authentication portal

### Backend & Services
- **[Hono](https://hono.dev/)** - Lightweight API framework
- **[Better Auth](https://better-auth.com/)** - Authentication library
- **[PostgreSQL](https://postgresql.org/)** - Primary database
- **[Redis](https://redis.io/)** - Session storage (optional)

### AI & Data Processing
- **[Groq](https://groq.com)** - Ultra-fast AI inference
- **[Vercel AI SDK](https://vercel.com/docs/ai)** - AI integration framework
- **[Zod](https://zod.dev)** - Schema validation

### Development & Deployment
- **[TypeScript 5.9+](https://www.typescriptlang.org/)** - Type safety
- **[Docker](https://www.docker.com/)** - Containerization
- **[ESLint](https://eslint.org/)** - Code linting
- **[tsx](https://tsx.is/)** - TypeScript execution

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run all tests with coverage
npm run test:coverage
```

## Contributing

Contributions are extremely welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Automated code linting and formatting
- **Pre-commit hooks**: Automated testing and linting
- **Conventional commits**: Standardized commit messages

## Documentation

- **[Architecture](./docs/architecture.md)** - System design and component overview
- **[API Documentation](./docs/api/)** - Backend API specifications
- **[Contributing Guide](./CONTRIBUTING.md)** - Development guidelines
- **[Brand Guidelines](./assets/brand_guidelines.md)** - Design and branding standards

## Troubleshooting

### Common Issues / 常见问题

**CLI won't start / CLI 无法启动**
```bash
# Check Node.js version
node --version  # Should be 20+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Authentication fails / 身份验证失败**
```bash
# Ensure backend server is running
npm run server

# Check database connection
docker-compose ps
docker-compose logs db
```

**Docker build fails / Docker 构建失败**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Contributors

<a href="https://github.com/abdulwasea89/DeployCli/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=abdulwasea89/DeployCli" />
</a>

## Acknowledgments

- **Groq** for providing ultra-fast AI inference
- **Vercel** for the AI SDK and Next.js
- **Ink** for the amazing CLI framework
- **Better Auth** for seamless authentication

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=abdulwasea89/DeployCli&type=date&legend=top-left)](https://www.star-history.com/#abdulwasea89/DeployCli&type=date&legend=top-left)

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/abdulwasea89">Abdul Wasea</a></p>
  <p>Deploy CLI is open source software licensed under the <a href="./LICENSE">MIT License</a>.</p>
</div>
