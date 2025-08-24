.PHONY: help up down restart build logs shell test migrate clean

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo '${YELLOW}Usage:${NC}'
	@echo '  ${GREEN}make${NC} ${YELLOW}[target]${NC}'
	@echo ''
	@echo '${YELLOW}Targets:${NC}'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${GREEN}%-15s${NC} %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start all services
	docker-compose up -d
	@echo "${GREEN}✓ Services started${NC}"

up-tools: ## Start all services including tools (pgadmin, redis-commander, mailhog)
	docker-compose --profile tools up -d
	@echo "${GREEN}✓ All services and tools started${NC}"
	@echo "${YELLOW}Access points:${NC}"
	@echo "  API:             http://localhost:3000"
	@echo "  PgAdmin:         http://localhost:5050"
	@echo "  Redis Commander: http://localhost:8081"
	@echo "  MailHog:         http://localhost:8025"

down: ## Stop all services
	docker-compose down
	@echo "${GREEN}✓ Services stopped${NC}"

down-volumes: ## Stop all services and remove volumes
	docker-compose down -v
	@echo "${GREEN}✓ Services stopped and volumes removed${NC}"

restart: ## Restart all services
	docker-compose restart
	@echo "${GREEN}✓ Services restarted${NC}"

build: ## Build or rebuild services
	docker-compose build --no-cache
	@echo "${GREEN}✓ Services built${NC}"

build-prod: ## Build production image
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
	@echo "${GREEN}✓ Production image built${NC}"

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View logs from API service only
	docker-compose logs -f api

shell: ## Access API container shell
	docker-compose exec api sh

shell-db: ## Access PostgreSQL shell
	docker-compose exec postgres psql -U connectabil -d connectabil_db

redis-cli: ## Access Redis CLI
	docker-compose exec redis redis-cli -a redis123

test: ## Run tests inside container
	docker-compose exec api yarn test

test-watch: ## Run tests in watch mode
	docker-compose exec api yarn test:watch

test-cov: ## Run tests with coverage
	docker-compose exec api yarn test:cov

test-e2e: ## Run e2e tests
	docker-compose exec api yarn test:e2e

migrate: ## Run database migrations
	docker-compose exec api yarn migrate

migrate-down: ## Rollback last migration
	docker-compose exec api yarn migrate:down

seed: ## Seed database with sample data
	docker-compose exec api yarn seed

lint: ## Run linter
	docker-compose exec api yarn lint

format: ## Format code
	docker-compose exec api yarn format

clean: ## Clean up Docker system
	docker system prune -f
	@echo "${GREEN}✓ Docker system cleaned${NC}"

backup-db: ## Backup database
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U connectabil connectabil_db | gzip > backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
	@echo "${GREEN}✓ Database backed up to backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz${NC}"

restore-db: ## Restore database from backup (usage: make restore-db FILE=backup_file.sql.gz)
	@if [ -z "$(FILE)" ]; then \
		echo "${RED}Error: Please specify backup file. Usage: make restore-db FILE=backup_file.sql.gz${NC}"; \
		exit 1; \
	fi
	gunzip < backups/$(FILE) | docker-compose exec -T postgres psql -U connectabil connectabil_db
	@echo "${GREEN}✓ Database restored from backups/$(FILE)${NC}"

status: ## Show status of all services
	@docker-compose ps

install: ## Initial setup - build and start services
	@echo "${YELLOW}Setting up Connectabil Hub API...${NC}"
	cp .env.docker .env 2>/dev/null || true
	docker-compose build
	docker-compose up -d
	@echo "${YELLOW}Waiting for services to be ready...${NC}"
	@sleep 10
	docker-compose exec api yarn migrate
	@echo "${GREEN}✓ Setup complete!${NC}"
	@echo "${YELLOW}Access the API at: http://localhost:3000${NC}"

prod: ## Start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
	@echo "${GREEN}✓ Production environment started${NC}"

dev: ## Start development environment (default)
	docker-compose up -d
	@echo "${GREEN}✓ Development environment started${NC}"
	@echo "${YELLOW}API running at: http://localhost:3000${NC}"