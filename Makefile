POSTGRES_PORT ?= 5432
E2E_POSTGRES_PORT ?= 55432
DATABASE_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(POSTGRES_PORT)/clinicpulse?sslmode=disable
DATABASE_ADMIN_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(POSTGRES_PORT)/postgres?sslmode=disable
E2E_DATABASE_NAME ?= clinicpulse_e2e
E2E_DATABASE_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(E2E_POSTGRES_PORT)/$(E2E_DATABASE_NAME)?sslmode=disable
E2E_DATABASE_ADMIN_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(E2E_POSTGRES_PORT)/postgres?sslmode=disable
NEXT_PUBLIC_CLINICPULSE_API_BASE_URL ?= http://localhost:8080

API_DIR := services/api
MIGRATIONS := $(sort $(wildcard $(API_DIR)/migrations/*.sql))
AUTH_SEED := $(API_DIR)/seeds/local_phase3_auth_users.sql

.PHONY: db-up db-up-e2e db-wait db-wait-e2e db-migrate db-seed-auth db-bootstrap db-create-e2e db-reset-e2e dev-api dev-web test-api test-web test-e2e lint build verify

db-up:
	CLINICPULSE_POSTGRES_PORT="$(POSTGRES_PORT)" docker compose up -d postgres

db-up-e2e:
	CLINICPULSE_POSTGRES_PORT="$(E2E_POSTGRES_PORT)" docker compose up -d postgres

db-wait:
	@for attempt in $$(seq 1 30); do \
		if psql "$(DATABASE_ADMIN_URL)" -tAc "SELECT 1" >/dev/null 2>&1; then \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "Postgres did not become ready at $(DATABASE_ADMIN_URL)" >&2; \
	exit 1

db-wait-e2e:
	@for attempt in $$(seq 1 30); do \
		if psql "$(E2E_DATABASE_ADMIN_URL)" -tAc "SELECT 1" >/dev/null 2>&1; then \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "Postgres did not become ready at $(E2E_DATABASE_ADMIN_URL)" >&2; \
	exit 1

db-migrate:
	@for file in $(MIGRATIONS); do \
		echo "Applying $$file"; \
		psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$$file"; \
	done

db-seed-auth:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$(AUTH_SEED)"

db-bootstrap: db-migrate db-seed-auth

db-create-e2e: db-wait-e2e
	psql "$(E2E_DATABASE_ADMIN_URL)" -tAc "SELECT 1 FROM pg_database WHERE datname = '$(E2E_DATABASE_NAME)'" | grep -q 1 || psql "$(E2E_DATABASE_ADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(E2E_DATABASE_NAME)"

db-reset-e2e: db-create-e2e
	psql "$(E2E_DATABASE_URL)" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) DATABASE_URL="$(E2E_DATABASE_URL)" db-bootstrap

dev-api:
	cd "$(API_DIR)" && DATABASE_URL="$(DATABASE_URL)" go run ./cmd/api

dev-web:
	NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="$(NEXT_PUBLIC_CLINICPULSE_API_BASE_URL)" npm run dev

test-api:
	cd "$(API_DIR)" && go test ./...

test-web:
	npm test

test-e2e: db-up-e2e db-reset-e2e
	E2E_DATABASE_URL="$(E2E_DATABASE_URL)" npm run test:e2e

lint:
	npm run lint

build:
	npm run build

verify: test-web lint test-api build
