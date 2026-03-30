# Symfony Playground

Symfony 7 + PostgreSQL 16, fully containerised with Docker Compose.

## Stack

| Service    | Image                | Exposed        |
|------------|----------------------|----------------|
| PHP        | php:8.3-fpm          | internal        |
| Nginx      | nginx:1.25-alpine    | http://localhost:8080 |
| PostgreSQL | postgres:16-alpine   | localhost:5432  |

## Quick Start

```bash
# 1. Build images and bootstrap a fresh Symfony project (run once)
make init

# 2. Open the app
open http://localhost:8080
```

`make init` will:
- Build Docker images
- Run `composer create-project symfony/skeleton`
- Install `symfony/orm-pack` + `symfony/maker-bundle`
- Create the `app` database on the PostgreSQL instance
- Write a `.env.local` with the correct `DATABASE_URL`

## Common Commands

| Command                           | Description                          |
|-----------------------------------|--------------------------------------|
| `make up`                         | Start containers                     |
| `make down`                       | Stop containers                      |
| `make bash`                       | Shell into the PHP container         |
| `make logs`                       | Follow all container logs            |
| `make console c="about"`          | Run a Symfony console command        |
| `make composer c="req vendor/pkg"`| Run a Composer command               |
| `make cc`                         | Clear Symfony cache                  |
| `make db-migrate`                 | Run pending migrations               |
| `make db-diff`                    | Generate a migration from entities   |
| `make db-reset`                   | Drop → recreate → migrate            |
| `make build`                      | Rebuild Docker images                |

## Database credentials (Docker)

```
Host:     db (from inside containers) / localhost (from host)
Port:     5432
Database: app
User:     app
Password: app
```

## Generating code

```bash
# Inside the PHP container (make bash) or via make console:
make console c="make:controller HomeController"
make console c="make:entity Product"
make console c="make:migration"
make db-migrate
```
