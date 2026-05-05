DATABASE_URL ?= postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable
NEXT_PUBLIC_CLINICPULSE_API_BASE_URL ?= http://localhost:8080

API_DIR := services/api
MIGRATIONS := $(sort $(wildcard $(API_DIR)/migrations/*.sql))
AUTH_SEED := $(API_DIR)/seeds/local_phase3_auth_users.sql

.PHONY: db-up db-migrate db-seed-auth db-bootstrap dev-api dev-web test-api test-web lint build verify

db-up:
	docker compose up -d postgres

db-migrate:
	@for file in $(MIGRATIONS); do \
		echo "Applying $$file"; \
		psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$$file"; \
	done

db-seed-auth:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$(AUTH_SEED)"

db-bootstrap: db-migrate db-seed-auth

dev-api:
	cd "$(API_DIR)" && DATABASE_URL="$(DATABASE_URL)" go run ./cmd/api

dev-web:
	NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="$(NEXT_PUBLIC_CLINICPULSE_API_BASE_URL)" npm run dev

test-api:
	cd "$(API_DIR)" && go test ./...

test-web:
	npm test

lint:
	npm run lint

build:
	npm run build

verify: test-web lint test-api build
