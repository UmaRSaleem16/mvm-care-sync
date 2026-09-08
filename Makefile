.PHONY: help up down seed build shell

BACKEND=caresync-backend
FRONTEND=caresync-frontend

help:
	@echo ""
	@echo "MVMCareSync — Available commands"
	@echo "─────────────────────────────────────────────────"
	@echo "  make build   Build all Docker images"
	@echo "  make up      Start all services with live logs"
	@echo "  make down    Stop and remove containers"
	@echo "  make seed    Seed database (run once after first up)"
	@echo "  make shell   Open a shell in the backend container"
	@echo "─────────────────────────────────────────────────"

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

seed:
	docker compose exec backend python manage.py seed_data

shell:
	docker compose exec backend sh
