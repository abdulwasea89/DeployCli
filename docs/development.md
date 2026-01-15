# Development Setup Guide

This guide explains how to run the application in development mode.

## Prerequisites

- Node.js (v18 or higher recommended)
- Docker and Docker Compose
- npm

## Getting Started

### 1. Environment Configuration

Ensure you have a `.env` file in the root directory. You can copy it from `.env.example` if available.

### 2. Start the Database

The application uses PostgreSQL running in a Docker container.

```bash
docker-compose up -d db
```

### 3. Initialize the Database Schema

Run the following command to create the necessary tables:

```bash
npm run db:init
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

#### Start the Server (Backend)

The backend server manages authentication and API routing.

```bash
npm run server
```

#### Start the UI (Development Mode)

The web UI is used for user authentication and authorization.

```bash
npm run dev
```

### 6. Authentication Workflow

To authenticate the CLI:

1.  Run the CLI (`npm run dev` in the root).
2.  Type `/login`. This will generate an auth code and open your browser to `http://localhost:3000/login?CODE=...`.
3.  Sign in or sign up on the web page.
4.  Once the web page shows "Authenticated Successfully", return to your terminal.
5.  The CLI will automatically detect the session and synchronize your profile.

---

## Environment Variables

| Variable          | Description                            | Default                                              |
| :---------------- | :------------------------------------- | :--------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string           | `postgresql://user:password@localhost:5433/database` |
| `AUTH_SERVER_URL` | Base URL for the authentication server | `http://localhost:3001`                              |
| `GROQ_API_KEY`    | API key for Groq AI services           | (Required)                                           |

---

## Troubleshooting

- **Database Connection Error**: Ensure the database container is running (`docker ps`) and the port `5433` is not being used by another process.
- **Port 5433**: If you need to change the port, update `docker-compose.yml` and your `.env` file.
