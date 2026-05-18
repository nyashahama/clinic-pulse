POSTGRES_PORT ?= 5432
E2E_POSTGRES_PORT ?= 55432
DATABASE_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(POSTGRES_PORT)/clinicpulse?sslmode=disable
DATABASE_ADMIN_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(POSTGRES_PORT)/postgres?sslmode=disable
E2E_DATABASE_NAME ?= clinicpulse_e2e
E2E_DATABASE_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(E2E_POSTGRES_PORT)/$(E2E_DATABASE_NAME)?sslmode=disable
E2E_DATABASE_ADMIN_URL ?= postgres://clinicpulse:clinicpulse@localhost:$(E2E_POSTGRES_PORT)/postgres?sslmode=disable
CLINICPULSE_API_BASE_URL ?= http://localhost:8080
NEXT_PUBLIC_CLINICPULSE_API_BASE_URL ?= /api/clinicpulse
API_IMAGE ?= clinicpulse-api:local
DOCKER_BUILD_ATTEMPTS ?= 3

API_DIR := services/api
AUTH_SEED := $(API_DIR)/seeds/local_phase3_auth_users.sql
REVIEW_SEED := $(API_DIR)/seeds/local_phase3_review_evidence.sql

.PHONY: db-up db-up-e2e db-wait db-wait-e2e db-migrate db-seed-auth db-seed-review db-bootstrap db-create-e2e db-reset-e2e-empty db-reset-e2e db-reset-review dev-api dev-api-review dev-web dev-web-review test-api test-web test-e2e smoke load-smoke lint build verify audit-web audit-api verify-security build-api-container migrate-api-container test-api-container

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
	cd "$(API_DIR)" && DATABASE_URL="$(DATABASE_URL)" CLINICPULSE_DEPLOY_ENV="local" go run ./cmd/migrate

db-seed-auth:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$(AUTH_SEED)"

db-seed-review:
	psql "$(DATABASE_URL)" -v ON_ERROR_STOP=1 -f "$(REVIEW_SEED)"

db-bootstrap: db-migrate db-seed-auth

db-create-e2e: db-wait-e2e
	psql "$(E2E_DATABASE_ADMIN_URL)" -tAc "SELECT 1 FROM pg_database WHERE datname = '$(E2E_DATABASE_NAME)'" | grep -q 1 || psql "$(E2E_DATABASE_ADMIN_URL)" -v ON_ERROR_STOP=1 -c "CREATE DATABASE $(E2E_DATABASE_NAME)"

db-reset-e2e-empty: db-create-e2e
	psql "$(E2E_DATABASE_URL)" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

db-reset-e2e: db-reset-e2e-empty
	$(MAKE) DATABASE_URL="$(E2E_DATABASE_URL)" db-bootstrap

db-reset-review: db-reset-e2e
	$(MAKE) DATABASE_URL="$(E2E_DATABASE_URL)" db-seed-review

dev-api:
	cd "$(API_DIR)" && DATABASE_URL="$(DATABASE_URL)" go run ./cmd/api

dev-api-review:
	cd "$(API_DIR)" && DATABASE_URL="$(E2E_DATABASE_URL)" CLINICPULSE_API_ADDR=":18080" go run ./cmd/api

dev-web:
	CLINICPULSE_API_BASE_URL="$(CLINICPULSE_API_BASE_URL)" NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="$(NEXT_PUBLIC_CLINICPULSE_API_BASE_URL)" npm run dev

dev-web-review:
	CLINICPULSE_API_BASE_URL="http://localhost:18080" NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="$(NEXT_PUBLIC_CLINICPULSE_API_BASE_URL)" npm run dev -- --port 3000

test-api:
	cd "$(API_DIR)" && go test ./...

test-web:
	npm test

audit-web:
	npm audit --audit-level=moderate

audit-api:
	cd "$(API_DIR)" && govulncheck ./...

test-e2e: db-up-e2e db-reset-review
	E2E_DATABASE_URL="$(E2E_DATABASE_URL)" npm run test:e2e

smoke:
	CLINICPULSE_API_BASE_URL="$(CLINICPULSE_API_BASE_URL)" npm run smoke

load-smoke:
	CLINICPULSE_LOAD_BASE_URL="$(CLINICPULSE_API_BASE_URL)" npm run load:smoke

build-api-container:
	@for attempt in $$(seq 1 "$(DOCKER_BUILD_ATTEMPTS)"); do \
		if docker build -t "$(API_IMAGE)" -f "$(API_DIR)/Dockerfile" "$(API_DIR)"; then \
			exit 0; \
		fi; \
		if [ "$$attempt" -eq "$(DOCKER_BUILD_ATTEMPTS)" ]; then \
			exit 1; \
		fi; \
		echo "docker build failed on attempt $$attempt/$(DOCKER_BUILD_ATTEMPTS); retrying..." >&2; \
		sleep $$((attempt * 5)); \
	done

migrate-api-container: build-api-container db-up-e2e db-reset-e2e-empty
	docker run --rm --network host \
		-e CLINICPULSE_DEPLOY_ENV=local \
		-e DATABASE_URL="$(E2E_DATABASE_URL)" \
		-e CLINICPULSE_API_KEY_PEPPER=local-development-pepper \
		"$(API_IMAGE)" /app/clinicpulse-migrate

test-api-container: migrate-api-container
	@docker rm -f clinicpulse-api-smoke >/dev/null 2>&1 || true
	docker run --rm -d --network host --name clinicpulse-api-smoke \
		-e CLINICPULSE_DEPLOY_ENV=local \
		-e DATABASE_URL="$(E2E_DATABASE_URL)" \
		-e CLINICPULSE_API_ADDR=:18080 \
		-e CLINICPULSE_API_KEY_PEPPER=local-development-pepper \
		"$(API_IMAGE)"
	@trap 'docker rm -f clinicpulse-api-smoke >/dev/null 2>&1 || true' EXIT; \
	for attempt in $$(seq 1 30); do \
		if curl -fsS http://localhost:18080/healthz >/dev/null && curl -fsS http://localhost:18080/readyz >/dev/null; then \
			docker rm -f clinicpulse-api-smoke >/dev/null; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	docker logs clinicpulse-api-smoke; \
	docker rm -f clinicpulse-api-smoke >/dev/null; \
	exit 1

lint:
	npm run lint

build:
	npm run build

verify: test-web lint test-api build

verify-security: audit-web audit-api
