DOCKER_COMP  = docker compose
PHP_CONT     = $(DOCKER_COMP) exec php
FRONT_CONT   = $(DOCKER_COMP) exec frontend

.DEFAULT_GOAL := help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?##.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ——— Docker ————————————————————————————————————————————————————————————

build: ## Build or rebuild Docker images
	$(DOCKER_COMP) build --no-cache

up: ## Start all containers in background
	$(DOCKER_COMP) up -d

down: ## Stop and remove containers
	$(DOCKER_COMP) down

down-v: ## Stop containers and remove named volumes
	$(DOCKER_COMP) down -v

restart: ## Restart all containers
	$(DOCKER_COMP) restart

logs: ## Follow logs for all services
	$(DOCKER_COMP) logs -f

logs-php: ## Follow PHP container logs only
	$(DOCKER_COMP) logs -f php

logs-front: ## Follow frontend container logs only
	$(DOCKER_COMP) logs -f frontend

# ——— Frontend ——————————————————————————————————————————————————————

front-bash: ## Open shell in the frontend container
	$(DOCKER_COMP) exec frontend sh

npm: ## Run npm command  (usage: make npm c="install react-query")
	$(FRONT_CONT) npm $(c)

# ——— PHP / Symfony ——————————————————————————————————————————————————

bash: ## Open bash shell in the PHP container
	$(DOCKER_COMP) exec php bash

composer: ## Run Composer  (usage: make composer c="require vendor/pkg")
	$(PHP_CONT) composer $(c)

console: ## Run bin/console  (usage: make console c="cache:clear")
	$(PHP_CONT) php bin/console $(c)

cc: ## Clear Symfony cache
	$(PHP_CONT) php bin/console cache:clear

# ——— Database ——————————————————————————————————————————————————————————

db-create: ## Create the database
	$(PHP_CONT) php bin/console doctrine:database:create --if-not-exists

db-migrate: ## Run all pending migrations
	$(PHP_CONT) php bin/console doctrine:migrations:migrate --no-interaction

db-diff: ## Generate a new migration from entity changes
	$(PHP_CONT) php bin/console doctrine:migrations:diff

db-reset: ## Drop, recreate and migrate the database
	$(PHP_CONT) php bin/console doctrine:database:drop --force --if-exists
	$(PHP_CONT) php bin/console doctrine:database:create
	$(PHP_CONT) php bin/console doctrine:migrations:migrate --no-interaction

# ——— Setup ———————————————————————————————————————————————————————————

init: ## First-time setup: build, start all containers, create DB
	$(DOCKER_COMP) up -d --wait
	@echo 'DATABASE_URL="postgresql://app:app@db:5432/app?serverVersion=16&charset=utf8"' > backend/.env.local
	$(PHP_CONT) composer require symfony/orm-pack
	$(PHP_CONT) composer require --dev symfony/maker-bundle
	$(PHP_CONT) php bin/console doctrine:database:create --if-not-exists
	@echo ""
	@echo "Symfony playground is ready → http://localhost:8080"
	@echo "Run 'make bash' to get a shell inside the PHP container."

.PHONY: help build up down down-v restart logs logs-php logs-front front-bash npm \
        bash composer console cc db-create db-migrate db-diff db-reset init
