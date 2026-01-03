# Deploy CLI

A professional AI-powered Command Line Interface (CLI) built with Ink, React, and Groq.

## Features
- **Real-time AI Chat**: Powered by GPT-OSS-120b for deep reasoning and assistance.
- **Modern CLI UI**: Built with `ink` for a rich terminal experience.
- **Secure Authentication**: Basic `/login` command to unlock full capabilities.
- **Context Aware**: Tracks current working directory and provides relevant status updates.

## Project Structure

```text
.
├── bin/          # Executable binaries
├── config/       # Configuration files
├── docs/         # Project documentation
├── scripts/      # Build and automation scripts
├── src/          # Source code
│   ├── components/ # React components (UI)
│   ├── hooks/      # Custom React hooks (Logic)
│   ├── types.ts    # TypeScript definitions
│   └── source.tsx  # Main entry point
├── tests/        # Unit and integration tests
└── README.md     # This file
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file in the root and add your Groq API key:
   ```env
   GROQ_API_KEY=your_api_key_here
   ```

### Running the App
To start the CLI in development mode:
```bash
npm start
```
Or using `tsx`:
```bash
npx tsx src/source.tsx
```

## Usage
- Type `/login` to authenticate.
- Type your messages to interact with the AI.
- Use `Ctrl+C` to exit the application.

## Professional Web Aesthetics
This CLI is designed with high-end ASCII art, consistent color themes, and clear visual hierarchy to provide a premium feel directly in your terminal.
