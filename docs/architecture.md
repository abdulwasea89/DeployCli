# Architecture Overview

This project follows a modular React architecture adapted for Terminal User Interfaces (TUI) using the `ink` library.

## Components
- **Header**: Displays the CLI title, branding, and session status (Authenticated/Guest).
- **ChatHistory**: Renders the conversation stream, including AI reasoning blocks with distinct styling.
- **ChatInput**: An interactive text input field for user commands and messages.

## Logic (Hooks)
- **useChat**: Manages the state of messages, authentication status, and provides a `sendMessage` function that handles streaming responses from the AI API via Groq.

## Styling
Styling is handled via Ink's Flexbox-based layout system. We use gradients and specific hex codes (`#d97706` for brand primary) to maintain a premium look.

## AI Integration
We utilize the `ai` SDK with `@ai-sdk/groq` to interface with high-performance reasoning models like `gpt-oss-120b`.
