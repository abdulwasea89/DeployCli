# 🌐 Deploy CLI - Authentication Portal

The web authentication portal for **Deploy CLI** - a secure OAuth-based authentication interface that bridges your terminal CLI with web-based authentication services.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-38B2AC.svg)](https://tailwindcss.com/)

## 📋 Overview

This Next.js application serves as the authentication gateway for the Deploy CLI terminal application. It provides a clean, modern web interface for users to authenticate with the CLI service using OAuth providers, enabling secure session management between the terminal and web environments.

## ✨ Features

- **🔐 OAuth Authentication**: Secure authentication flow with multiple OAuth providers
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS and Radix UI components
- **🔄 Real-time Updates**: Live authentication status with the CLI application
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🌐 Multi-language Ready**: Built-in support for internationalization
- **⚡ Fast & Lightweight**: Optimized with Next.js App Router and modern React patterns

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm, yarn, or pnpm**
- **Deploy CLI backend server** running on `http://localhost:3001`

### Installation

1. **Navigate to the web directory:**
   ```bash
   cd web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Configure your `.env.local` with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   # Add your OAuth provider configurations
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 📁 Project Structure

```
web/
├── 📱 app/                    # Next.js App Router
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Main authentication page
│   ├── globals.css           # Global styles and Tailwind
│   ├── login/                # Authentication page
│   │   └── page.tsx          # Login form and flow
│   └── favicon.ico           # App favicon
├── 🧩 components/            # Reusable UI components
│   ├── ui/                   # Radix UI components
│   │   ├── button.tsx        # Button component
│   │   ├── card.tsx          # Card component
│   │   ├── input.tsx         # Input component
│   │   └── tabs.tsx          # Tabs component
│   └── auth/                 # Authentication components
│       └── auth-form.tsx     # Main auth form
├── 🔧 lib/                   # Utility libraries
│   ├── auth-client.ts        # Better Auth client configuration
│   └── utils.ts              # Utility functions
└── 📋 Configuration Files
    ├── next.config.ts        # Next.js configuration
    ├── tailwind.config.ts    # Tailwind CSS configuration
    ├── components.json       # shadcn/ui configuration
    └── eslint.config.mjs     # ESLint configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the web directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# OAuth Providers (configure as needed)
# GOOGLE_CLIENT_ID=your_google_client_id
# GITHUB_CLIENT_ID=your_github_client_id

# Better Auth Configuration
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001/api/auth
```

### OAuth Setup

1. **Configure OAuth providers** in your Better Auth configuration
2. **Add provider credentials** to your environment variables
3. **Update the auth client** in `lib/auth-client.ts` if needed

## 🎨 UI Components

This project uses a modern component architecture:

- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Beautiful icon library
- **shadcn/ui**: High-quality component library

### Key Components

- **AuthForm**: Main authentication interface with OAuth providers
- **Button**: Consistent button styling across the app
- **Card**: Clean card layouts for content organization
- **Input**: Form input components with validation

## 🔄 Authentication Flow

1. **CLI Initiation**: User types `/login` in the terminal
2. **Portal Redirect**: CLI opens authentication URL in browser
3. **User Authentication**: User completes OAuth flow on web portal
4. **Token Exchange**: Secure token exchange between web and CLI
5. **Session Establishment**: Authenticated session created in CLI

### API Integration

The portal communicates with the Deploy CLI backend via:

- **`/custom/auth/initiate`**: Initialize authentication flow
- **`/custom/auth/verify`**: Verify authentication code
- **`/custom/auth/poll`**: Poll authentication status
- **`/api/auth/*`**: Better Auth OAuth endpoints

## 🧪 Testing

```bash
# Run the test suite
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Docker

```bash
# Build the Docker image
docker build -t deploy-cli-web .

# Run the container
docker run -p 3000:3000 deploy-cli-web
```

### Manual Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. **Follow the main project** [Contributing Guide](../CONTRIBUTING.md)
2. **Test your changes** thoroughly
3. **Ensure responsive design** works on all screen sizes
4. **Maintain accessibility** standards

## 🐛 Troubleshooting

### Common Issues

**Authentication not working**
- Ensure the backend API server is running on port 3001
- Check CORS configuration in the backend
- Verify OAuth provider credentials

**Styling issues**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Build failures**
- Check Node.js version compatibility
- Ensure all environment variables are set
- Verify import paths and TypeScript types

## 📚 Related Documentation

- **[Main Project README](../README.md)** - Complete Deploy CLI documentation
- **[API Documentation](../docs/api/)** - Backend API specifications
- **[Architecture Guide](../docs/architecture.md)** - System design overview

---

<div align="center">
  <p>Part of <a href="https://github.com/abdulwasea89/DeployCli">Deploy CLI</a> | Built with ❤️ using Next.js</p>
</div>
