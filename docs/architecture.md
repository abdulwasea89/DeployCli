# Architecture Overview

This project follows a modular React architecture adapted for Terminal User Interfaces (TUI) using the `ink` library.

## Components

- **Header**: Displays the CLI title, branding, and session status (Authenticated/Guest).
- **ChatHistory**: Renders the conversation stream, including AI reasoning blocks with distinct styling.
- **ChatInput**: An interactive text input field for user commands and messages.

## Authentication System

The project implements a stateful, cross-platform authentication system designed for seamless synchronization between the CLI and the web.

### 1. CLI/Web Synchronization Flow

- **Initiation**: The CLI generates a unique 8-character code via `/custom/auth/initiate` and opens the browser to a login URL containing this code.
- **Web Authorization**: The user authenticates on the web (via Better Auth). Upon success, the web app calls `/custom/auth/verify` to link the session token with the unique code.
- **Polling**: The CLI polls `/custom/auth/poll` until it receives the session token associated with its code.
- **Validation**: Once a token is received, the CLI calls `/custom/auth/validate`. To ensure reliability across environments, this endpoint performs a direct database join between the `session` and `user` tables.

### 2. Secure Storage Layer

The CLI uses a hybrid storage approach managed by `AuthManager`:

- **Keychain**: Primary storage using the OS-level secure keychain (via `keytar`).
- **File Fallback**: If a keychain is unavailable, it falls back to a secure file (`.session.json`) with restricted permissions (`0600`).

### 3. Session Persistence

Sessions are configured for long-term persistence (e.g., 8 months) in the `Better Auth` configuration, with periodic health checks initiated by the CLI to ensure validity.

## Logic (Hooks)

- **useChat**: Manages the state of messages and provides a `sendMessage` function.
- **Auth Management**: Orchestrated by the `AuthManager` service, which handles login, logout, and session lifecycle.

## Styling

Styling is handled via Ink's Flexbox-based layout system. We use gradients and specific hex codes (`#d97706` for brand primary) to maintain a premium look.

## AI Integration

We utilize the `ai` SDK with `@ai-sdk/groq` to interface with high-performance reasoning models like `gpt-oss-120b`.
