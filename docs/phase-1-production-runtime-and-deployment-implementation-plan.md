# Phase 1 Production Runtime And Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ClinicPulse deployable to staging with a Vercel frontend, Dockerized Go API backend, managed Postgres, runtime safety checks, migration tracking, and container smoke verification.

**Architecture:** Keep Vercel as the frontend runtime and build the Go API as a provider-neutral Docker image suitable for Render or Railway. Add explicit deploy-environment validation, HTTP server runtime controls, a database migration ledger, and CI smoke checks that prove the container can migrate and serve health/readiness endpoints.

**Tech Stack:** Next.js 16, React 19, TypeScript, npm, Go chi API, Postgres, Docker, GitHub Actions, Vercel frontend deployment, Render/Railway-compatible API container deployment.

---

## File Map

Create:

- `services/api/Dockerfile`: multi-stage production image for the Go API and migration binary.
- `services/api/.dockerignore`: keep local build artifacts and test outputs out of the API image build context.
- `services/api/cmd/migrate/main.go`: migration command used by local, CI, and Docker-hosted deployments.
- `services/api/internal/migrations/runner.go`: migration ledger and SQL application logic.
- `services/api/internal/migrations/runner_test.go`: unit tests for pending, applied, and checksum-mismatch behavior.
- `services/api/internal/runtime/server.go`: API server construction, timeout defaults, and graceful shutdown helper.
- `services/api/internal/runtime/server_test.go`: timeout and address selection tests.
- `lib/runtime/frontend-env.ts`: frontend deploy-environment validation shared by tests and Next config.
- `lib/runtime/frontend-env.test.ts`: frontend validation tests for local, staging, and production-like environments.
- `docs/deployment.md`: Vercel frontend, Docker API, managed Postgres, migration, backup, restore, and rollback runbook.
- `vercel.json`: minimal Vercel project contract for install and build commands.

Modify:

- `services/api/internal/config/config.go`: add deploy environment, port fallback, validation, and safe production-like defaults.
- `services/api/internal/config/config_test.go`: test local defaults and staging/production rejection cases.
- `services/api/cmd/api/main.go`: use validated config and runtime server helper.
- `next.config.ts`: validate frontend deployment variables before building rewrites.
- `Makefile`: route local migrations through the new migrator and add API container smoke targets.
- `.github/workflows/ci.yml`: build and smoke-test the API container.
- `.github/workflows/api-smoke.yml`: use the migration command instead of replaying raw SQL.
- `.github/workflows/pr-hygiene.yml`: allow tracked Phase 1 deployment docs.
- `.gitignore`: allow the tracked Phase 1 deployment runbook.
- `docs/release.md`: add the Phase 1 staging/runtime gate.
- `docs/production-readiness-execution-plan.md`: link the Phase 1 spec and plan, and mark Phase 1 as planned.
- `docs/database-schema.md`: document the migration ledger table.
- `.env.example`: add `CLINICPULSE_DEPLOY_ENV` and API timeout variables.

Reference:

- Phase 1 spec: `docs/phase-1-production-runtime-and-deployment-spec.md`
- Existing API config: `services/api/internal/config/config.go`
- Existing API entrypoint: `services/api/cmd/api/main.go`
- Existing health handlers: `services/api/internal/http/handlers.go`
- Existing migrations: `services/api/migrations/*.sql`
- Current CI: `.github/workflows/ci.yml`, `.github/workflows/api-smoke.yml`

## Task 0: Confirm Baseline And Branch

**Files:**

- Read: `docs/phase-1-production-runtime-and-deployment-spec.md`
- Read: `docs/production-readiness-execution-plan.md`
- Read: `services/api/internal/config/config.go`
- Read: `Makefile`

- [ ] **Step 1: Confirm clean starting state**

Run:

```bash
git status --short --branch
```

Expected: current branch is shown and there are no uncommitted changes except approved planning documents.

- [ ] **Step 2: Create the Phase 1 implementation branch if needed**

Run:

```bash
git switch -c feature/phase-1-production-runtime-deployment
```

Expected: Git switches to `feature/phase-1-production-runtime-deployment`. If the branch already exists, run `git switch feature/phase-1-production-runtime-deployment`.

- [ ] **Step 3: Run the inherited release gate**

Run:

```bash
make verify
make verify-security
```

Expected: both targets pass before runtime deployment work begins.

## Task 1: Add Runtime Environment Validation

**Files:**

- Modify: `services/api/internal/config/config.go`
- Create or modify: `services/api/internal/config/config_test.go`
- Modify: `.env.example`

- [ ] **Step 1: Write failing config tests**

Create `services/api/internal/config/config_test.go` if it does not exist, then add:

```go
package config

import (
	"strings"
	"testing"
)

func TestLoadAllowsLocalDefaults(t *testing.T) {
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("CLINICPULSE_API_ADDR", "")
	t.Setenv("PORT", "")
	t.Setenv("CLINICPULSE_API_KEY_PEPPER", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected local defaults to load, got %v", err)
	}
	if cfg.DeployEnv != "local" {
		t.Fatalf("expected local deploy env, got %q", cfg.DeployEnv)
	}
	if cfg.Addr != ":8080" {
		t.Fatalf("expected default addr :8080, got %q", cfg.Addr)
	}
}

func TestLoadUsesProviderPortWhenAddressIsUnset(t *testing.T) {
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "local")
	t.Setenv("CLINICPULSE_API_ADDR", "")
	t.Setenv("PORT", "3131")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected config to load, got %v", err)
	}
	if cfg.Addr != ":3131" {
		t.Fatalf("expected provider port addr, got %q", cfg.Addr)
	}
}

func TestLoadRejectsUnsafeStagingConfig(t *testing.T) {
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "staging")
	t.Setenv("DATABASE_URL", "")
	t.Setenv("CLINICPULSE_API_KEY_PEPPER", "short")

	_, err := Load()
	if err == nil {
		t.Fatal("expected staging config error")
	}
	message := err.Error()
	for _, want := range []string{"DATABASE_URL", "CLINICPULSE_API_KEY_PEPPER"} {
		if !strings.Contains(message, want) {
			t.Fatalf("expected error to mention %s, got %q", want, message)
		}
	}
}

func TestLoadRejectsLocalDatabaseInProduction(t *testing.T) {
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "production")
	t.Setenv("DATABASE_URL", "postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable")
	t.Setenv("CLINICPULSE_API_KEY_PEPPER", strings.Repeat("p", 32))

	_, err := Load()
	if err == nil {
		t.Fatal("expected production config error")
	}
	if !strings.Contains(err.Error(), "localhost") {
		t.Fatalf("expected localhost rejection, got %q", err.Error())
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/config
```

Expected: FAIL because `Load` still returns only `Config` and does not validate production-like environments.

- [ ] **Step 3: Implement validated config**

Replace `services/api/internal/config/config.go` with:

```go
package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"
)

const (
	DeployEnvLocal      = "local"
	DeployEnvStaging    = "staging"
	DeployEnvProduction = "production"
)

type Config struct {
	DeployEnv              string
	Addr                   string
	DatabaseURL            string
	APIKeyPepper           string
	WebhookDeliveryEnabled bool
	ReadTimeout            time.Duration
	WriteTimeout           time.Duration
	IdleTimeout            time.Duration
	ShutdownTimeout        time.Duration
}

func Load() (Config, error) {
	cfg := Config{
		DeployEnv:              envOrDefault("CLINICPULSE_DEPLOY_ENV", DeployEnvLocal),
		Addr:                   apiAddr(),
		DatabaseURL:            envOrDefault("DATABASE_URL", "postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable"),
		APIKeyPepper:           os.Getenv("CLINICPULSE_API_KEY_PEPPER"),
		WebhookDeliveryEnabled: os.Getenv("CLINICPULSE_WEBHOOK_DELIVERY_ENABLED") == "true",
		ReadTimeout:            durationEnv("CLINICPULSE_API_READ_TIMEOUT", 10*time.Second),
		WriteTimeout:           durationEnv("CLINICPULSE_API_WRITE_TIMEOUT", 20*time.Second),
		IdleTimeout:            durationEnv("CLINICPULSE_API_IDLE_TIMEOUT", 60*time.Second),
		ShutdownTimeout:        durationEnv("CLINICPULSE_API_SHUTDOWN_TIMEOUT", 10*time.Second),
	}
	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (c Config) Validate() error {
	var problems []string
	switch c.DeployEnv {
	case DeployEnvLocal, DeployEnvStaging, DeployEnvProduction:
	default:
		problems = append(problems, "CLINICPULSE_DEPLOY_ENV must be local, staging, or production")
	}
	if c.DeployEnv != DeployEnvLocal {
		if os.Getenv("DATABASE_URL") == "" {
			problems = append(problems, "DATABASE_URL is required outside local development")
		}
		if isLocalDatabaseURL(c.DatabaseURL) {
			problems = append(problems, "DATABASE_URL must not point to localhost outside local development")
		}
		if len(c.APIKeyPepper) < 32 {
			problems = append(problems, "CLINICPULSE_API_KEY_PEPPER must be at least 32 characters outside local development")
		}
	}
	if c.ReadTimeout <= 0 || c.WriteTimeout <= 0 || c.IdleTimeout <= 0 || c.ShutdownTimeout <= 0 {
		problems = append(problems, "API timeout values must be positive durations")
	}
	if len(problems) > 0 {
		return errors.New(strings.Join(problems, "; "))
	}
	return nil
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func apiAddr() string {
	if addr := os.Getenv("CLINICPULSE_API_ADDR"); addr != "" {
		return addr
	}
	if port := os.Getenv("PORT"); port != "" {
		return ":" + strings.TrimPrefix(port, ":")
	}
	return ":8080"
}

func durationEnv(key string, fallback time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	duration, err := time.ParseDuration(value)
	if err != nil {
		return -1
	}
	return duration
}

func isLocalDatabaseURL(value string) bool {
	parsed, err := url.Parse(value)
	if err != nil {
		return false
	}
	host := parsed.Hostname()
	return host == "localhost" || host == "127.0.0.1" || host == "::1"
}

func MustLoad() Config {
	cfg, err := Load()
	if err != nil {
		panic(fmt.Sprintf("invalid ClinicPulse API configuration: %v", err))
	}
	return cfg
}
```

- [ ] **Step 4: Update `.env.example`**

Add:

```bash
CLINICPULSE_DEPLOY_ENV=local
CLINICPULSE_API_READ_TIMEOUT=10s
CLINICPULSE_API_WRITE_TIMEOUT=20s
CLINICPULSE_API_IDLE_TIMEOUT=60s
CLINICPULSE_API_SHUTDOWN_TIMEOUT=10s
```

- [ ] **Step 5: Run config tests**

Run:

```bash
cd services/api && go test ./internal/config
```

Expected: PASS.

- [ ] **Step 6: Commit runtime config validation**

Run:

```bash
git add services/api/internal/config/config.go services/api/internal/config/config_test.go .env.example
git commit -m "feat: validate api runtime configuration"
```

Expected: one commit with config validation and example env updates.

## Task 2: Add Frontend Runtime Validation

**Files:**

- Create: `lib/runtime/frontend-env.ts`
- Create: `lib/runtime/frontend-env.test.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write failing frontend validation tests**

Create `lib/runtime/frontend-env.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { validateFrontendRuntimeEnv } from "@/lib/runtime/frontend-env";

describe("frontend runtime env", () => {
  it("allows local defaults", () => {
    expect(validateFrontendRuntimeEnv({ NODE_ENV: "development" })).toEqual({
      deployEnv: "local",
      apiBaseUrl: "http://localhost:8080",
      browserApiBaseUrl: "/api/clinicpulse",
    });
  });

  it("accepts staging with an https API and same-origin browser proxy", () => {
    expect(
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://clinicpulse-api.example.test",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }),
    ).toEqual({
      deployEnv: "staging",
      apiBaseUrl: "https://clinicpulse-api.example.test",
      browserApiBaseUrl: "/api/clinicpulse",
    });
  });

  it("rejects unsafe staging frontend config", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "http://localhost:8080",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "https://api.example.test",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "true",
      }),
    ).toThrow(/CLINICPULSE_API_BASE_URL|NEXT_PUBLIC_CLINICPULSE_API_BASE_URL|CLINICPULSE_ALLOW_SEEDED_FALLBACK/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- lib/runtime/frontend-env.test.ts
```

Expected: FAIL because `lib/runtime/frontend-env.ts` does not exist.

- [ ] **Step 3: Implement frontend validation**

Create `lib/runtime/frontend-env.ts`:

```ts
type FrontendEnv = {
  CLINICPULSE_DEPLOY_ENV?: string;
  CLINICPULSE_API_BASE_URL?: string;
  NEXT_PUBLIC_CLINICPULSE_API_BASE_URL?: string;
  CLINICPULSE_ALLOW_SEEDED_FALLBACK?: string;
  NODE_ENV?: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_BROWSER_API_BASE_URL = "/api/clinicpulse";
const DEPLOY_ENVS = new Set(["local", "staging", "production"]);

export function validateFrontendRuntimeEnv(env: FrontendEnv = process.env) {
  const deployEnv = env.CLINICPULSE_DEPLOY_ENV || "local";
  const apiBaseUrl = env.CLINICPULSE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const browserApiBaseUrl =
    env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL || DEFAULT_BROWSER_API_BASE_URL;
  const problems: string[] = [];

  if (!DEPLOY_ENVS.has(deployEnv)) {
    problems.push("CLINICPULSE_DEPLOY_ENV must be local, staging, or production");
  }

  if (deployEnv !== "local") {
    if (!env.CLINICPULSE_API_BASE_URL) {
      problems.push("CLINICPULSE_API_BASE_URL is required outside local development");
    }
    if (!apiBaseUrl.startsWith("https://")) {
      problems.push("CLINICPULSE_API_BASE_URL must use https outside local development");
    }
    if (isLocalUrl(apiBaseUrl)) {
      problems.push("CLINICPULSE_API_BASE_URL must not point to localhost outside local development");
    }
    if (browserApiBaseUrl !== DEFAULT_BROWSER_API_BASE_URL) {
      problems.push("NEXT_PUBLIC_CLINICPULSE_API_BASE_URL must remain /api/clinicpulse outside local development");
    }
    if (env.CLINICPULSE_ALLOW_SEEDED_FALLBACK === "true") {
      problems.push("CLINICPULSE_ALLOW_SEEDED_FALLBACK must be false outside local development");
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid ClinicPulse frontend environment: ${problems.join("; ")}`);
  }

  return {
    deployEnv,
    apiBaseUrl,
    browserApiBaseUrl,
  };
}

function isLocalUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Use validation in Next config**

Modify `next.config.ts`:

```ts
import type { NextConfig } from "next";

import { validateFrontendRuntimeEnv } from "./lib/runtime/frontend-env";

const frontendEnv = validateFrontendRuntimeEnv();
const clinicPulseApiBaseUrl = frontendEnv.apiBaseUrl;
```

Keep the existing `rewrites()` implementation, but read from `clinicPulseApiBaseUrl`.

- [ ] **Step 5: Run frontend validation tests and build**

Run:

```bash
npm test -- lib/runtime/frontend-env.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit frontend runtime validation**

Run:

```bash
git add lib/runtime/frontend-env.ts lib/runtime/frontend-env.test.ts next.config.ts
git commit -m "feat: validate frontend deployment environment"
```

Expected: one commit with frontend environment validation and Next config wiring.

## Task 3: Add API Server Timeouts And Graceful Shutdown

**Files:**

- Create: `services/api/internal/runtime/server.go`
- Create: `services/api/internal/runtime/server_test.go`
- Modify: `services/api/cmd/api/main.go`

- [ ] **Step 1: Write failing runtime tests**

Create `services/api/internal/runtime/server_test.go`:

```go
package runtime

import (
	"net/http"
	"testing"
	"time"
)

func TestNewServerAppliesTimeouts(t *testing.T) {
	handler := http.NewServeMux()
	cfg := ServerConfig{
		Addr:            ":9999",
		ReadTimeout:     3 * time.Second,
		WriteTimeout:    4 * time.Second,
		IdleTimeout:     5 * time.Second,
		ShutdownTimeout: 6 * time.Second,
	}

	server := NewServer(cfg, handler)

	if server.Addr != ":9999" {
		t.Fatalf("expected addr :9999, got %q", server.Addr)
	}
	if server.ReadTimeout != 3*time.Second {
		t.Fatalf("expected read timeout, got %s", server.ReadTimeout)
	}
	if server.WriteTimeout != 4*time.Second {
		t.Fatalf("expected write timeout, got %s", server.WriteTimeout)
	}
	if server.IdleTimeout != 5*time.Second {
		t.Fatalf("expected idle timeout, got %s", server.IdleTimeout)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/runtime
```

Expected: FAIL because `internal/runtime` does not exist.

- [ ] **Step 3: Implement runtime server helper**

Create `services/api/internal/runtime/server.go`:

```go
package runtime

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type ServerConfig struct {
	Addr            string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

func NewServer(config ServerConfig, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:         config.Addr,
		Handler:      handler,
		ReadTimeout:  config.ReadTimeout,
		WriteTimeout: config.WriteTimeout,
		IdleTimeout:  config.IdleTimeout,
	}
}

func Serve(ctx context.Context, server *http.Server, shutdownTimeout time.Duration, logger *log.Logger) error {
	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		errCh <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return err
		}
		logger.Printf("server stopped gracefully")
		return nil
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
```

- [ ] **Step 4: Update API entrypoint**

Replace `services/api/cmd/api/main.go` with:

```go
package main

import (
	"context"
	"log"
	"os"

	"clinicpulse/services/api/internal/config"
	apihttp "clinicpulse/services/api/internal/http"
	apiruntime "clinicpulse/services/api/internal/runtime"
	"clinicpulse/services/api/internal/store"
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)
	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("load config: %v", err)
	}

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("open database: %v", err)
	}
	defer pool.Close()

	router := apihttp.NewRouter(
		store.New(pool),
		apihttp.WithAPIKeyPepper(cfg.APIKeyPepper),
		apihttp.WithWebhookDeliveryEnabled(cfg.WebhookDeliveryEnabled),
	)
	server := apiruntime.NewServer(apiruntime.ServerConfig{
		Addr:            cfg.Addr,
		ReadTimeout:     cfg.ReadTimeout,
		WriteTimeout:    cfg.WriteTimeout,
		IdleTimeout:     cfg.IdleTimeout,
		ShutdownTimeout: cfg.ShutdownTimeout,
	}, router)

	logger.Printf("starting ClinicPulse API deploy_env=%s addr=%s", cfg.DeployEnv, cfg.Addr)
	if err := apiruntime.Serve(ctx, server, cfg.ShutdownTimeout, logger); err != nil {
		logger.Fatalf("serve api: %v", err)
	}
}
```

- [ ] **Step 5: Run runtime and API tests**

Run:

```bash
cd services/api && go test ./internal/runtime ./...
```

Expected: PASS.

- [ ] **Step 6: Commit API runtime server changes**

Run:

```bash
git add services/api/internal/runtime/server.go services/api/internal/runtime/server_test.go services/api/cmd/api/main.go
git commit -m "feat: add api server runtime controls"
```

Expected: one commit with timeout and graceful shutdown support.

## Task 4: Add Migration Ledger Command

**Files:**

- Create: `services/api/internal/migrations/runner.go`
- Create: `services/api/internal/migrations/runner_test.go`
- Create: `services/api/cmd/migrate/main.go`
- Modify: `Makefile`
- Modify: `docs/database-schema.md`

- [ ] **Step 1: Write failing migration runner tests**

Create `services/api/internal/migrations/runner_test.go`:

```go
package migrations

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestListFilesSortsSQLMigrations(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, "0002_second.sql"), "select 2;")
	writeFile(t, filepath.Join(dir, "0001_first.sql"), "select 1;")
	writeFile(t, filepath.Join(dir, "notes.txt"), "ignore")

	files, err := ListFiles(dir)
	if err != nil {
		t.Fatalf("list files: %v", err)
	}
	if len(files) != 2 {
		t.Fatalf("expected 2 files, got %d", len(files))
	}
	if filepath.Base(files[0]) != "0001_first.sql" || filepath.Base(files[1]) != "0002_second.sql" {
		t.Fatalf("expected sorted SQL files, got %#v", files)
	}
}

func TestChecksumChangesWithContent(t *testing.T) {
	left := Checksum([]byte("select 1;"))
	right := Checksum([]byte("select 2;"))
	if left == right {
		t.Fatal("expected different checksums for different migration content")
	}
	if left == "" || right == "" {
		t.Fatal("expected non-empty checksums")
	}
}

func TestRunRejectsMissingDirectory(t *testing.T) {
	err := Run(context.Background(), nil, Options{Dir: filepath.Join(t.TempDir(), "missing")})
	if err == nil {
		t.Fatal("expected missing directory error")
	}
}

func writeFile(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/migrations
```

Expected: FAIL because `internal/migrations` does not exist.

- [ ] **Step 3: Implement migration runner**

Create `services/api/internal/migrations/runner.go`:

```go
package migrations

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const ledgerTableSQL = `
create table if not exists schema_migrations (
	filename text primary key,
	checksum text not null,
	applied_at timestamptz not null default now()
);`

type Options struct {
	Dir string
	Now func() time.Time
}

func Run(ctx context.Context, pool *pgxpool.Pool, options Options) error {
	files, err := ListFiles(options.Dir)
	if err != nil {
		return err
	}
	if pool == nil {
		return fmt.Errorf("migration database pool is required")
	}
	if _, err := pool.Exec(ctx, ledgerTableSQL); err != nil {
		return fmt.Errorf("create migration ledger: %w", err)
	}
	for _, file := range files {
		if err := applyFile(ctx, pool, file, options); err != nil {
			return err
		}
	}
	return nil
}

func ListFiles(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read migrations dir %s: %w", dir, err)
	}
	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}
		files = append(files, filepath.Join(dir, entry.Name()))
	}
	sort.Strings(files)
	return files, nil
}

func Checksum(content []byte) string {
	sum := sha256.Sum256(content)
	return hex.EncodeToString(sum[:])
}

func applyFile(ctx context.Context, pool *pgxpool.Pool, path string, options Options) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read migration %s: %w", path, err)
	}
	filename := filepath.Base(path)
	checksum := Checksum(content)

	var existing string
	err = pool.QueryRow(ctx, "select checksum from schema_migrations where filename = $1", filename).Scan(&existing)
	if err == nil {
		if existing != checksum {
			return fmt.Errorf("migration %s checksum mismatch", filename)
		}
		return nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("check migration %s: %w", filename, err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin migration %s: %w", filename, err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, string(content)); err != nil {
		return fmt.Errorf("apply migration %s: %w", filename, err)
	}
	appliedAt := time.Now().UTC()
	if options.Now != nil {
		appliedAt = options.Now().UTC()
	}
	if _, err := tx.Exec(ctx, "insert into schema_migrations (filename, checksum, applied_at) values ($1, $2, $3)", filename, checksum, appliedAt); err != nil {
		return fmt.Errorf("record migration %s: %w", filename, err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit migration %s: %w", filename, err)
	}
	return nil
}
```

- [ ] **Step 4: Add migration command**

Create `services/api/cmd/migrate/main.go`:

```go
package main

import (
	"context"
	"log"
	"os"

	"clinicpulse/services/api/internal/config"
	"clinicpulse/services/api/internal/migrations"
	"clinicpulse/services/api/internal/store"
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)
	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("load config: %v", err)
	}
	dir := os.Getenv("CLINICPULSE_MIGRATIONS_DIR")
	if dir == "" {
		dir = "migrations"
	}

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("open database: %v", err)
	}
	defer pool.Close()

	if err := migrations.Run(ctx, pool, migrations.Options{Dir: dir}); err != nil {
		logger.Fatalf("apply migrations: %v", err)
	}
	logger.Printf("migrations applied from %s", dir)
}
```

- [ ] **Step 5: Update Makefile migration targets**

Modify `Makefile`:

```make
db-migrate:
	cd "$(API_DIR)" && DATABASE_URL="$(DATABASE_URL)" CLINICPULSE_DEPLOY_ENV="local" go run ./cmd/migrate
```

Keep `db-bootstrap: db-migrate db-seed-auth`.

- [ ] **Step 6: Document the ledger table**

Add to `docs/database-schema.md` after the opening paragraph:

```markdown
## Migration Ledger

| Table | Purpose |
| --- | --- |
| `schema_migrations` | Records SQL migration filename, checksum, and applied timestamp so managed databases are migrated once and checksum drift fails fast |

`make db-migrate` and the API migration command create this ledger automatically before applying pending SQL files.
```

- [ ] **Step 7: Run migration tests**

Run:

```bash
cd services/api && go test ./internal/migrations ./...
```

Expected: PASS.

- [ ] **Step 8: Verify local migration path against a reset database**

Run:

```bash
make db-up
make db-wait
make db-migrate
```

Expected: migrations apply and create `schema_migrations`. If the existing local database already has tables without the ledger, use a disposable local database for this verification instead of dropping user data.

- [ ] **Step 9: Commit migration ledger**

Run:

```bash
git add services/api/internal/migrations services/api/cmd/migrate/main.go Makefile docs/database-schema.md
git commit -m "feat: add tracked database migrations"
```

Expected: one commit with the migration runner, command, Makefile path, and schema docs.

## Task 5: Add API Docker Image And Container Smoke Target

**Files:**

- Create: `services/api/Dockerfile`
- Create: `services/api/.dockerignore`
- Modify: `Makefile`

- [ ] **Step 1: Add API Dockerfile**

Create `services/api/Dockerfile`:

```dockerfile
FROM golang:1.25.10-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/clinicpulse-api ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o /out/clinicpulse-migrate ./cmd/migrate

FROM alpine:3.22

RUN addgroup -S clinicpulse && adduser -S -G clinicpulse clinicpulse
WORKDIR /app

COPY --from=build /out/clinicpulse-api /app/clinicpulse-api
COPY --from=build /out/clinicpulse-migrate /app/clinicpulse-migrate
COPY migrations /app/migrations

ENV CLINICPULSE_MIGRATIONS_DIR=/app/migrations
EXPOSE 8080

USER clinicpulse
CMD ["/app/clinicpulse-api"]
```

- [ ] **Step 2: Add Docker ignore file**

Create `services/api/.dockerignore`:

```text
.git
bin
coverage.out
tmp
*.test
```

- [ ] **Step 3: Add Makefile container targets**

Add these targets to `Makefile`:

```make
API_IMAGE ?= clinicpulse-api:local

.PHONY: build-api-container migrate-api-container test-api-container

build-api-container:
	docker build -t "$(API_IMAGE)" -f "$(API_DIR)/Dockerfile" "$(API_DIR)"

migrate-api-container: build-api-container db-up-e2e db-reset-e2e
	docker run --rm --network host \
		-e CLINICPULSE_DEPLOY_ENV=local \
		-e DATABASE_URL="$(E2E_DATABASE_URL)" \
		-e CLINICPULSE_API_KEY_PEPPER=local-development-pepper \
		"$(API_IMAGE)" /app/clinicpulse-migrate

test-api-container: migrate-api-container
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
```

- [ ] **Step 4: Build the image**

Run:

```bash
docker build -f services/api/Dockerfile services/api
```

Expected: Docker image builds successfully.

- [ ] **Step 5: Smoke-test the container**

Run:

```bash
make test-api-container
```

Expected: Postgres starts, the migration command applies pending migrations, the API container starts, and both `/healthz` and `/readyz` return `200`.

- [ ] **Step 6: Commit Docker runtime**

Run:

```bash
git add services/api/Dockerfile services/api/.dockerignore Makefile
git commit -m "feat: add docker api runtime"
```

Expected: one commit with the API Dockerfile and smoke targets.

## Task 6: Add Vercel And Deployment Runbook

**Files:**

- Create: `vercel.json`
- Create: `docs/deployment.md`
- Modify: `docs/release.md`
- Modify: `.github/workflows/pr-hygiene.yml`
- Modify: `.gitignore`

- [ ] **Step 1: Add Vercel project contract**

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build"
}
```

- [ ] **Step 2: Write deployment runbook**

Create `docs/deployment.md`:

```markdown
# Deployment Runbook

ClinicPulse staging uses Vercel for the Next.js frontend and a Docker host for the Go API.

## Frontend: Vercel

Required environment variables:

| Variable | Staging value |
| --- | --- |
| `CLINICPULSE_DEPLOY_ENV` | `staging` |
| `CLINICPULSE_API_BASE_URL` | HTTPS URL for the deployed Docker API |
| `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL` | `/api/clinicpulse` |
| `CLINICPULSE_ALLOW_SEEDED_FALLBACK` | `false` |

The browser should call `/api/clinicpulse/*`. The Next.js rewrite forwards those requests to `CLINICPULSE_API_BASE_URL`.

## Backend: Docker API

The API image builds from `services/api/Dockerfile`.

Required environment variables:

| Variable | Staging value |
| --- | --- |
| `CLINICPULSE_DEPLOY_ENV` | `staging` |
| `DATABASE_URL` | Managed Postgres connection URL |
| `CLINICPULSE_API_KEY_PEPPER` | At least 32 characters |
| `CLINICPULSE_WEBHOOK_DELIVERY_ENABLED` | `false` until webhook delivery is intentionally enabled |
| `PORT` | Supplied by Render, Railway, or the Docker host |

Start command:

```bash
/app/clinicpulse-api
```

Migration command:

```bash
/app/clinicpulse-migrate
```

Run migrations before starting a new API image against staging.

## Render Notes

Use a Docker web service with `services/api/Dockerfile`. Attach a managed Postgres database and set the environment variables above. Render supplies `PORT`, so `CLINICPULSE_API_ADDR` can remain unset.

## Railway Notes

Use a Docker service rooted at `services/api`. Attach a Railway Postgres database and set the environment variables above. Railway supplies `PORT`, so `CLINICPULSE_API_ADDR` can remain unset.

## Managed Postgres

Before applying migrations:

```bash
pg_dump "$DATABASE_URL" --format=custom --file "clinicpulse-staging-before-migration.dump"
```

Apply migrations:

```bash
docker run --rm \
  -e CLINICPULSE_DEPLOY_ENV=staging \
  -e DATABASE_URL="$DATABASE_URL" \
  -e CLINICPULSE_API_KEY_PEPPER="$CLINICPULSE_API_KEY_PEPPER" \
  clinicpulse-api:<tag> /app/clinicpulse-migrate
```

Restore from backup:

```bash
pg_restore --clean --if-exists --dbname "$DATABASE_URL" clinicpulse-staging-before-migration.dump
```

## Staging Recreation Checklist

1. Create managed Postgres.
2. Build and publish the API Docker image.
3. Set API environment variables.
4. Run `/app/clinicpulse-migrate`.
5. Start `/app/clinicpulse-api`.
6. Confirm `/healthz` and `/readyz` return `200`.
7. Create the Vercel project.
8. Set Vercel environment variables.
9. Deploy the frontend.
10. Confirm the frontend proxy reaches the API through `/api/clinicpulse/healthz` if a proxy health route is added, or through a product route that reads the API.

## Rollback

Frontend rollback: promote the previous Vercel deployment.

API rollback: restart the previous Docker image tag after confirming it is compatible with the current database schema.

Database rollback: restore the latest pre-migration backup when a migration causes data or schema breakage. Prefer a roll-forward corrective migration when the deployed API already depends on a migration that reached staging successfully.
```

- [ ] **Step 3: Update release docs**

Add to `docs/release.md` under verification commands:

```bash
make test-api-container
```

Add a sentence after the command block:

```markdown
For Phase 1 staging handoff, also confirm the Vercel frontend variables and Docker API variables in `docs/deployment.md`.
```

- [ ] **Step 4: Allow tracked deployment docs**

Update `.github/workflows/pr-hygiene.yml` so `allowed_tracked_docs` includes:

```text
deployment|phase-1-production-runtime-and-deployment-(spec|implementation-plan)
```

Update `.gitignore` so `docs/deployment.md` is intentionally tracked:

```text
!docs/deployment.md
```

- [ ] **Step 5: Commit deployment docs**

Run:

```bash
git add vercel.json docs/deployment.md docs/release.md .github/workflows/pr-hygiene.yml .gitignore
git commit -m "docs: add staging deployment runbook"
```

Expected: one commit with the Vercel contract, deployment runbook, release gate update, and hygiene allowance.

## Task 7: Add CI Container Smoke Verification

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/api-smoke.yml`

- [ ] **Step 1: Add Docker smoke job to CI**

Add this job to `.github/workflows/ci.yml`:

```yaml
  api-container:
    name: API Container
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version-file: services/api/go.mod
          cache-dependency-path: services/api/go.sum

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install --yes postgresql-client

      - name: Build and smoke-test API container
        run: make test-api-container
```

- [ ] **Step 2: Update API smoke migration command**

In `.github/workflows/api-smoke.yml`, replace the raw migration loop with:

```yaml
      - name: Apply migrations
        working-directory: services/api
        run: go run ./cmd/migrate
```

- [ ] **Step 3: Run workflow-adjacent local checks**

Run:

```bash
make test-api-container
cd services/api && go test ./...
```

Expected: both commands pass.

- [ ] **Step 4: Commit CI smoke verification**

Run:

```bash
git add .github/workflows/ci.yml .github/workflows/api-smoke.yml
git commit -m "ci: verify api container runtime"
```

Expected: one commit with container smoke verification.

## Task 8: Close Phase 1 Planning Docs And Verify

**Files:**

- Modify: `docs/production-readiness-execution-plan.md`
- Modify: `docs/release.md`

- [ ] **Step 1: Update readiness roadmap**

In `docs/production-readiness-execution-plan.md`:

- Keep `Current phase: Phase 1 - Production Runtime And Deployment`.
- Set the Phase 1 table status to `In progress` while implementation is active.
- Add these links under Phase 1:

```markdown
Spec: `docs/phase-1-production-runtime-and-deployment-spec.md`
Plan: `docs/phase-1-production-runtime-and-deployment-implementation-plan.md`
Deployment runbook: `docs/deployment.md`
```

- [ ] **Step 2: Run complete verification**

Run:

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

Expected: all commands pass. `git status --short` shows only intentional Phase 1 changes before the final commit.

- [ ] **Step 3: Commit roadmap and release closeout prep**

Run:

```bash
git add docs/production-readiness-execution-plan.md docs/release.md
git commit -m "docs: record phase 1 runtime deployment gate"
```

Expected: one commit with final roadmap and release checklist updates.

## Final Verification

Before opening the Phase 1 implementation PR, run:

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

Expected:

- Frontend tests, lint, and build pass.
- Go tests and vet pass.
- Playwright E2E passes.
- npm audit and govulncheck pass.
- API Docker image builds.
- API migration command runs against disposable Postgres.
- API container returns `200` for `/healthz` and `/readyz`.
- Working tree contains only intentional final changes.

## Execution Notes

- Keep Render and Railway details in docs, not code.
- Do not introduce Terraform, Kubernetes, or provider SDKs in this phase.
- Do not remove demo credentials or alter auth flows in this phase; that belongs to Phase 2.
- Preserve the existing Vercel-style frontend design and route structure.
