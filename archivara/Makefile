.PHONY: help install dev-start dev-stop backend frontend test lint clean

help:
	@echo "Available commands:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev-start   - Start development environment"
	@echo "  make dev-stop    - Stop development environment"
	@echo "  make backend     - Start backend API server"
	@echo "  make frontend    - Start frontend dev server"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linters"
	@echo "  make clean       - Clean up generated files"

install:
	@echo "Installing backend dependencies..."
	cd backend && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev-start:
	./start-dev.sh

dev-stop:
	docker-compose down

backend:
	cd backend && . venv/bin/activate && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && . venv/bin/activate && pytest

lint:
	cd backend && . venv/bin/activate && ruff check . && mypy .
	cd frontend && npm run lint

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf backend/venv
	rm -rf frontend/node_modules
	rm -rf frontend/.next 