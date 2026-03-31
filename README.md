# SubTracker

A personal subscription tracking application. Import your bank transactions via CSV, automatically detect recurring charges, and manage your subscriptions by category.

## Stack

| Service    | Technology                         | Exposed                   |
|------------|------------------------------------|---------------------------|
| API        | Symfony 8 + API Platform 4 (PHP 8.4-fpm) | http://localhost:8080 |
| Frontend   | Next.js 15 + React 19 + Tailwind 4 | http://localhost:3000     |
| Database   | PostgreSQL 16                      | localhost:5432            |
| Web server | Nginx 1.25                         | internal                  |

## Prerequisites

- Docker & Docker Compose

## Quick Start

```bash
make init
```

That single command will: start containers, install Composer dependencies, generate a fresh `APP_SECRET`, create `backend/.env.local`, generate the JWT key pair, and run all migrations.

The API docs are available at http://localhost:8080/api/docs once running.

## Environment Variables

All backend configuration lives in `backend/.env` (committed defaults) and `backend/.env.local` (local overrides, gitignored). See [backend/.env](backend/.env) for the full reference.

Key variables to set in `.env.local`:

| Variable        | Description                              |
|-----------------|------------------------------------------|
| `APP_SECRET`    | Symfony app secret (32-char random hex)  |
| `DATABASE_URL`  | PostgreSQL DSN                           |
| `JWT_PASSPHRASE`| Passphrase used when generating JWT keys |
| `MAILER_DSN`    | Transport DSN for outgoing mail          |

## Make Commands

### Docker

| Command          | Description                           |
|------------------|---------------------------------------|
| `make up`        | Start all containers in background    |
| `make down`      | Stop and remove containers            |
| `make down-v`    | Stop containers and remove volumes    |
| `make restart`   | Restart all containers                |
| `make build`     | Rebuild Docker images (no cache)      |
| `make logs`      | Follow logs for all services          |
| `make logs-php`  | Follow PHP container logs             |
| `make logs-front`| Follow frontend container logs        |

### Backend (PHP / Symfony)

| Command                              | Description                        |
|--------------------------------------|------------------------------------|
| `make bash`                          | Shell into the PHP container       |
| `make console c="<cmd>"`             | Run a Symfony console command      |
| `make composer c="<cmd>"`            | Run a Composer command             |
| `make cc`                            | Clear Symfony cache                |

### Frontend

| Command                   | Description                        |
|---------------------------|------------------------------------|
| `make front-bash`         | Shell into the frontend container  |
| `make npm c="<cmd>"`      | Run an npm command                 |

### Database

| Command          | Description                             |
|------------------|-----------------------------------------|
| `make db-migrate`| Run all pending migrations              |
| `make db-diff`   | Generate a migration from entity changes|
| `make db-reset`  | Drop → recreate → migrate               |

## Database Credentials (Docker)

```
Host:     db (inside containers) / localhost (from host)
Port:     5432
Database: app
User:     app
Password: app
```

## Authentication

The API uses JWT. Obtain a token pair via the login endpoint and pass the access token as a `Bearer` header. The refresh token endpoint lets you rotate tokens without re-authenticating.

| Endpoint              | Access  | Description          |
|-----------------------|---------|----------------------|
| `POST /api/login`     | Public  | Obtain JWT tokens    |
| `POST /api/token/refresh` | Public | Refresh access token |
| `POST /api/users`     | Public  | Register a new user  |
| `GET  /api/docs`      | Public  | OpenAPI documentation|
