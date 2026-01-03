# 🚀 Deploy CLI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](#)

A professional AI-powered Command Line Interface (CLI) built with **Ink**, **React**, and **Groq**. Deploy CLI brings state-of-the-art reasoning models directly to your terminal with a premium visual experience.

## ✨ Features
- **🧠 Real-time AI Reasoning**: Powered by `gpt-oss-120b` for deep problem-solving.
- **🎨 Premium Web Aesthetics**: High-end terminal UI with amber highlights and smooth transitions.
- **🛡️ Enterprise Grade**: Modular architecture, type safety, and comprehensive testing.
- **🔌 Plugin System**: Extendable via a modular plugin architecture.
- **🔐 Secure Access**: Built-in authentication flow for workspace security.

## 📂 Project Structure

```text
.
├── assets/       # Brand assets and design guidelines
├── bin/          # Global executable binaries
├── config/       # Multi-environment configuration
├── docs/         # API and Architecture documentation
├── scripts/      # Automation and developer tools
├── src/          # Source code
│   ├── components/ # React/Ink UI components
│   ├── hooks/      # State and logic hooks
│   ├── services/   # AI and external API services
│   ├── types/      # TypeScript definitions
│   └── utils/      # Shared utility functions
├── tests/        # Unit and integration test suites
└── ... (Standard config and standard project files)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/abdulwasea89/DeployCli.git

# Enter the directory
cd DeployCli

# Install dependencies
npm install

# Build/Run
npm run dev
```

### Docker Usage
If you prefer to run the CLI in a container:

**Using Docker directly:**
```bash
docker build -t deploy-cli .
docker run -it --env-file .env deploy-cli
```

**Using Docker Compose:**
```bash
docker-compose run deploy-cli
```

### Environment Setup
Create a `.env` file in the root:
```env
GROQ_API_KEY=your_key_here
NODE_ENV=development
```

## 📖 Documentation & Community
- **[Contributing](./CONTRIBUTING.md)**: How to help the project grow.
- **[Code of Conduct](./CODE_OF_CONDUCT.md)**: Our community standards.
- **[Changelog](./CHANGELOG.md)**: Track every update and feature.
- **[Security](./SECURITY.md)**: Report vulnerabilities securely.
- **[Support](./SUPPORT.md)**: Get help when you need it.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---
Built with ❤️ by [Abdul Wasea](https://github.com/abdulwasea89)
