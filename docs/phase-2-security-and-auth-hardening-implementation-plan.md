# Phase 2 Security And Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden ClinicPulse auth, sessions, browser security, and pilot account lifecycle so staging and production no longer depend on visible demo credentials or manual SQL user management.

**Architecture:** Keep the existing Next.js frontend, same-origin API proxy, Go chi API, Postgres auth tables, and role model. Add focused security modules around runtime auth visibility, browser headers, CSRF/origin enforcement, in-process rate limiting, admin lifecycle store/API operations, audit evidence, and admin UI forms.

**Tech Stack:** Next.js 16, React 19, TypeScript, npm, Go chi API, Postgres, Docker, GitHub Actions, Playwright, Vitest, Go tests.

---

## File Map

Create:

- `lib/runtime/security-headers.ts`: frontend security header and CSP builder.
- `lib/runtime/security-headers.test.ts`: tests for required headers and environment-specific CSP behavior.
- `services/api/internal/security/ratelimit.go`: deterministic in-memory fixed-window limiter used by HTTP middleware.
- `services/api/internal/security/ratelimit_test.go`: limiter behavior tests.
- `services/api/internal/http/security_middleware.go`: CSRF/origin and mutation rate-limit middleware.
- `services/api/internal/http/security_middleware_test.go`: HTTP middleware tests for trusted origins, local dev, partner exemptions, and rate limits.
- `services/api/internal/service/admin_users.go`: admin lifecycle validation and audit input helpers.
- `services/api/internal/service/admin_users_test.go`: scope and secret-leak tests for admin lifecycle decisions.
- `services/api/migrations/0009_auth_hardening_admin_lifecycle.sql`: schema additions for user password lifecycle metadata.
- `app/(workspace)/admin/users-roles/actions.ts`: server actions for admin user lifecycle mutations.
- `components/product/admin-user-lifecycle.tsx`: client form/actions panel for create, disable/enable, role/scope change, and session revocation.
- `tests/e2e/security-auth-hardening.spec.ts`: E2E coverage for hidden demo credentials, disabled registration, admin lifecycle, and auth mutation safety.

Modify:

- `lib/runtime/frontend-env.ts`: expose auth/demo visibility and registration flags derived from deployment environment.
- `lib/runtime/frontend-env.test.ts`: cover local/staging/production auth visibility.
- `next.config.ts`: add `headers()` using `lib/runtime/security-headers.ts`.
- `app/(auth)/login/page.tsx`: hide demo credentials outside local/demo-marked environments.
- `app/(auth)/register/page.tsx`: keep public registration disabled in staging/production and remove production demo hints.
- `components/auth/signup-form.tsx`: support disabled/provisioned-account copy without public password fields in staging/production.
- `services/api/internal/config/config.go`: add trusted origins and rate-limit config.
- `services/api/internal/config/config_test.go`: validate trusted origins and production requirements.
- `services/api/internal/http/router.go`: install CSRF/origin and rate-limit middleware and add admin lifecycle/password routes.
- `services/api/internal/http/handlers.go`: add admin lifecycle and password-change handlers.
- `services/api/internal/http/handlers_test.go`: add HTTP handler tests for lifecycle, password change, session revocation, and secret safety.
- `services/api/internal/store/models.go`: add lifecycle fields and input models.
- `services/api/internal/store/auth_queries.go`: add user lifecycle, password update, membership update, and revoke-all-session queries.
- `services/api/internal/store/auth_queries_integration_test.go`: cover lifecycle database behavior.
- `services/api/seeds/local_phase3_auth_users.sql`: set lifecycle fields for local seeded users.
- `services/api/internal/store/migrations_test.go`: expect migration `0009`.
- `services/api/internal/http/auth_middleware.go`: preserve role selection while honoring disabled/session state already enforced by the store.
- `app/(workspace)/admin/users-roles/page.tsx`: replace read-only note with lifecycle panel while retaining evidence table.
- `app/(workspace)/admin/admin-loaders.ts`: add authenticated options helper reuse for mutation actions.
- `lib/workspace/api-client.ts`: add admin lifecycle client calls.
- `lib/workspace/api-types.ts`: add request/response types.
- `docs/api.md`: document new auth/admin endpoints and security responses.
- `docs/architecture.md`: document hardened auth/session/browser security model.
- `docs/database-schema.md`: document user lifecycle metadata.
- `docs/deployment.md`: document trusted origin, CSP, and rate-limit environment variables.
- `docs/release.md`: add Phase 2 security gate.
- `docs/production-readiness-execution-plan.md`: keep Phase 2 linked and update status during closeout.
- `.env.example`: add security configuration variables.

Reference:

- Phase 2 spec: `docs/phase-2-security-and-auth-hardening-spec.md`
- Existing auth handlers: `services/api/internal/http/handlers.go`
- Existing auth middleware: `services/api/internal/http/auth_middleware.go`
- Existing router: `services/api/internal/http/router.go`
- Existing store auth queries: `services/api/internal/store/auth_queries.go`
- Existing admin users page: `app/(workspace)/admin/users-roles/page.tsx`
- Existing frontend runtime env validation: `lib/runtime/frontend-env.ts`

## Task 0: Baseline And Branch

**Files:**

- Read: `docs/phase-2-security-and-auth-hardening-spec.md`
- Read: `services/api/internal/http/router.go`
- Read: `services/api/internal/store/auth_queries.go`
- Read: `app/(workspace)/admin/users-roles/page.tsx`

- [ ] **Step 1: Confirm clean starting state**

Run:

```bash
git status --short --branch
```

Expected: on the Phase 2 planning branch or `main`, with no uncommitted implementation changes.

- [ ] **Step 2: Create the Phase 2 implementation branch if needed**

Run:

```bash
git switch -c feature/phase-2-security-and-auth-hardening
```

Expected: branch switches to `feature/phase-2-security-and-auth-hardening`. If it already exists, run `git switch feature/phase-2-security-and-auth-hardening`.

- [ ] **Step 3: Run inherited gates**

Run:

```bash
make verify
make verify-security
```

Expected: both targets pass before security changes begin.

## Task 1: Runtime Auth Visibility Flags

**Files:**

- Modify: `lib/runtime/frontend-env.ts`
- Modify: `lib/runtime/frontend-env.test.ts`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`
- Modify: `components/auth/signup-form.tsx`

- [ ] **Step 1: Write failing frontend runtime tests**

Add to `lib/runtime/frontend-env.test.ts`:

```ts
it("shows demo credentials only in local deployments", () => {
  expect(
    validateFrontendRuntimeEnv({
      CLINICPULSE_DEPLOY_ENV: "local",
    }).showSeedCredentials,
  ).toBe(true);

  expect(
    validateFrontendRuntimeEnv({
      CLINICPULSE_DEPLOY_ENV: "staging",
      CLINICPULSE_API_BASE_URL: "https://api.clinicpulse.test",
      NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
      CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
    }).showSeedCredentials,
  ).toBe(false);
});

it("keeps public registration disabled outside local deployments", () => {
  expect(validateFrontendRuntimeEnv({ CLINICPULSE_DEPLOY_ENV: "local" }).allowPublicRegistration).toBe(false);

  expect(
    validateFrontendRuntimeEnv({
      CLINICPULSE_DEPLOY_ENV: "production",
      CLINICPULSE_API_BASE_URL: "https://api.clinicpulse.example",
      NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
      CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
    }).allowPublicRegistration,
  ).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- lib/runtime/frontend-env.test.ts
```

Expected: FAIL because `showSeedCredentials` and `allowPublicRegistration` do not exist yet.

- [ ] **Step 3: Add runtime flags**

In `lib/runtime/frontend-env.ts`, extend `FrontendRuntimeConfig`:

```ts
type FrontendRuntimeConfig = {
  deployEnv: DeployEnv;
  apiBaseUrl: string;
  browserApiBaseUrl: string;
  showSeedCredentials: boolean;
  allowPublicRegistration: boolean;
};
```

Return the flags from `validateFrontendRuntimeEnv`:

```ts
const allowPublicRegistration = env.CLINICPULSE_ALLOW_PUBLIC_REGISTRATION === "true";

if (deployEnv !== "local" && allowPublicRegistration) {
  problems.push(
    "CLINICPULSE_ALLOW_PUBLIC_REGISTRATION must not be true outside local deployments in Phase 2.",
  );
}

return {
  deployEnv,
  apiBaseUrl,
  browserApiBaseUrl,
  showSeedCredentials: deployEnv === "local",
  allowPublicRegistration: deployEnv === "local" && allowPublicRegistration,
};
```

- [ ] **Step 4: Hide demo credentials on login page**

In `app/(auth)/login/page.tsx`, import the validator:

```ts
import { validateFrontendRuntimeEnv } from "@/lib/runtime/frontend-env";
```

Inside `LoginPage`, compute:

```ts
const frontendEnv = validateFrontendRuntimeEnv();
```

Wrap the demo credential panel with:

```tsx
{frontendEnv.showSeedCredentials ? (
  <div className="mt-6 rounded-2xl border border-[#0D7A6B]/15 bg-[#ecf7f4] p-4 dark:border-primary/30 dark:bg-primary/10">
    {/* keep the existing local demo credential content here */}
  </div>
) : null}
```

- [ ] **Step 5: Keep registration provisioned-only**

In `app/(auth)/register/page.tsx`, use `validateFrontendRuntimeEnv()` and pass `allowPublicRegistration` into `SignupForm`.

In `components/auth/signup-form.tsx`, change the component signature:

```ts
export function SignupForm({
  action,
  allowPublicRegistration,
}: {
  action: SignupAction;
  allowPublicRegistration: boolean;
}) {
```

When `allowPublicRegistration` is false, render the existing request fields without password fields and with the button label `Request access review`.

- [ ] **Step 6: Verify frontend runtime and auth UI tests**

Run:

```bash
npm test -- lib/runtime/frontend-env.test.ts
npm run lint
```

Expected: tests and lint pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add lib/runtime/frontend-env.ts lib/runtime/frontend-env.test.ts 'app/(auth)/login/page.tsx' 'app/(auth)/register/page.tsx' components/auth/signup-form.tsx
git commit -m "fix: hide demo auth affordances outside local"
```

## Task 2: Security Headers And CSP

**Files:**

- Create: `lib/runtime/security-headers.ts`
- Create: `lib/runtime/security-headers.test.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Write failing security header tests**

Create `lib/runtime/security-headers.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "./security-headers";

describe("security headers", () => {
  it("builds required browser security headers", () => {
    const headers = buildSecurityHeaders({ deployEnv: "production" });
    const headerMap = new Map(headers.map((header) => [header.key, header.value]));

    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerMap.get("Permissions-Policy")).toContain("camera=()");
    expect(headerMap.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(headerMap.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });

  it("keeps local development compatible with Next dev assets", () => {
    const csp = new Map(buildSecurityHeaders({ deployEnv: "local" }).map((header) => [header.key, header.value])).get(
      "Content-Security-Policy",
    );

    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- lib/runtime/security-headers.test.ts
```

Expected: FAIL because `lib/runtime/security-headers.ts` does not exist.

- [ ] **Step 3: Implement header builder**

Create `lib/runtime/security-headers.ts`:

```ts
type DeployEnv = "local" | "staging" | "production";

export type SecurityHeaderInput = {
  deployEnv: DeployEnv;
};

function contentSecurityPolicy(deployEnv: DeployEnv) {
  const scriptSrc =
    deployEnv === "local"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "connect-src 'self' https:",
    "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "font-src 'self' data:",
  ].join("; ");
}

export function buildSecurityHeaders({ deployEnv }: SecurityHeaderInput) {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: contentSecurityPolicy(deployEnv) },
  ];
}
```

- [ ] **Step 4: Wire Next headers**

In `next.config.ts`, import:

```ts
import { buildSecurityHeaders } from "./lib/runtime/security-headers";
```

Add to `nextConfig`:

```ts
async headers() {
  return [
    {
      source: "/:path*",
      headers: buildSecurityHeaders({ deployEnv: frontendEnv.deployEnv }),
    },
  ];
},
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- lib/runtime/security-headers.test.ts
npm run build
```

Expected: tests and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add lib/runtime/security-headers.ts lib/runtime/security-headers.test.ts next.config.ts
git commit -m "feat: add browser security headers"
```

## Task 3: API Security Config

**Files:**

- Modify: `services/api/internal/config/config.go`
- Modify: `services/api/internal/config/config_test.go`
- Modify: `.env.example`

- [ ] **Step 1: Write failing config tests**

Add to `services/api/internal/config/config_test.go`:

```go
func TestLoadRequiresTrustedOriginsOutsideLocal(t *testing.T) {
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "staging")
	t.Setenv("DATABASE_URL", "postgres://clinicpulse.example/staging")
	t.Setenv("CLINICPULSE_API_KEY_PEPPER", strings.Repeat("p", 32))
	t.Setenv("CLINICPULSE_TRUSTED_ORIGINS", "")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "CLINICPULSE_TRUSTED_ORIGINS") {
		t.Fatalf("expected trusted origin validation error, got %v", err)
	}
}

func TestLoadParsesTrustedOrigins(t *testing.T) {
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "local")
	t.Setenv("CLINICPULSE_TRUSTED_ORIGINS", "http://localhost:3000, https://clinicpulse.example")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected config to load, got %v", err)
	}
	if len(cfg.TrustedOrigins) != 2 || cfg.TrustedOrigins[1] != "https://clinicpulse.example" {
		t.Fatalf("unexpected trusted origins: %#v", cfg.TrustedOrigins)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/config
```

Expected: FAIL because `TrustedOrigins` is not in `Config`.

- [ ] **Step 3: Add config fields**

In `services/api/internal/config/config.go`, add to `Config`:

```go
TrustedOrigins       []string
LoginRateLimit       int
MutationRateLimit    int
RateLimitWindow      time.Duration
```

In `Load`, parse values:

```go
trustedOrigins := splitCSV(os.Getenv("CLINICPULSE_TRUSTED_ORIGINS"))
rateLimitWindow, err := durationFromEnv("CLINICPULSE_RATE_LIMIT_WINDOW", time.Minute)
if err != nil {
	return Config{}, err
}
cfg.TrustedOrigins = trustedOrigins
cfg.LoginRateLimit = intEnv("CLINICPULSE_LOGIN_RATE_LIMIT", 8)
cfg.MutationRateLimit = intEnv("CLINICPULSE_MUTATION_RATE_LIMIT", 60)
cfg.RateLimitWindow = rateLimitWindow
```

Add helper functions:

```go
func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, strings.TrimRight(part, "/"))
		}
	}
	return result
}

func intEnv(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
```

Update `Validate`:

```go
if c.DeployEnv != DeployEnvLocal && len(c.TrustedOrigins) == 0 {
	problems = append(problems, "CLINICPULSE_TRUSTED_ORIGINS is required outside local deploy env")
}
if c.LoginRateLimit <= 0 || c.MutationRateLimit <= 0 || c.RateLimitWindow <= 0 {
	problems = append(problems, "rate limit settings must be positive")
}
```

- [ ] **Step 4: Update `.env.example`**

Add:

```dotenv
CLINICPULSE_TRUSTED_ORIGINS=http://localhost:3000
CLINICPULSE_LOGIN_RATE_LIMIT=8
CLINICPULSE_MUTATION_RATE_LIMIT=60
CLINICPULSE_RATE_LIMIT_WINDOW=1m
```

- [ ] **Step 5: Verify**

Run:

```bash
cd services/api && go test ./internal/config
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add services/api/internal/config/config.go services/api/internal/config/config_test.go .env.example
git commit -m "feat: validate api security runtime config"
```

## Task 4: In-Memory Rate Limiter

**Files:**

- Create: `services/api/internal/security/ratelimit.go`
- Create: `services/api/internal/security/ratelimit_test.go`

- [ ] **Step 1: Write failing limiter tests**

Create `services/api/internal/security/ratelimit_test.go`:

```go
package security

import (
	"testing"
	"time"
)

func TestFixedWindowLimiterAllowsConfiguredAttempts(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(2, time.Minute, func() time.Time { return now })

	if !limiter.Allow("login:person@example.test") {
		t.Fatal("expected first attempt to pass")
	}
	if !limiter.Allow("login:person@example.test") {
		t.Fatal("expected second attempt to pass")
	}
	if limiter.Allow("login:person@example.test") {
		t.Fatal("expected third attempt to be blocked")
	}
}

func TestFixedWindowLimiterResetsAfterWindow(t *testing.T) {
	now := time.Date(2026, 5, 14, 8, 0, 0, 0, time.UTC)
	limiter := NewFixedWindowLimiter(1, time.Minute, func() time.Time { return now })

	if !limiter.Allow("mutation:admin") {
		t.Fatal("expected first attempt to pass")
	}
	now = now.Add(time.Minute + time.Second)
	if !limiter.Allow("mutation:admin") {
		t.Fatal("expected attempt after window to pass")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/security
```

Expected: FAIL because package/functions do not exist.

- [ ] **Step 3: Implement limiter**

Create `services/api/internal/security/ratelimit.go`:

```go
package security

import (
	"sync"
	"time"
)

type Clock func() time.Time

type FixedWindowLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	clock   Clock
	buckets map[string]bucket
}

type bucket struct {
	count      int
	windowEnd  time.Time
	lastAccess time.Time
}

func NewFixedWindowLimiter(limit int, window time.Duration, clock Clock) *FixedWindowLimiter {
	if clock == nil {
		clock = time.Now
	}
	return &FixedWindowLimiter{
		limit:   limit,
		window:  window,
		clock:   clock,
		buckets: map[string]bucket{},
	}
}

func (l *FixedWindowLimiter) Allow(key string) bool {
	if l.limit <= 0 || l.window <= 0 {
		return true
	}
	now := l.clock().UTC()

	l.mu.Lock()
	defer l.mu.Unlock()

	entry := l.buckets[key]
	if entry.windowEnd.IsZero() || !now.Before(entry.windowEnd) {
		entry = bucket{windowEnd: now.Add(l.window)}
	}
	entry.count++
	entry.lastAccess = now
	l.buckets[key] = entry

	return entry.count <= l.limit
}
```

- [ ] **Step 4: Verify**

Run:

```bash
cd services/api && go test ./internal/security
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add services/api/internal/security/ratelimit.go services/api/internal/security/ratelimit_test.go
git commit -m "feat: add fixed window rate limiter"
```

## Task 5: CSRF, Origin, And Mutation Rate Middleware

**Files:**

- Create: `services/api/internal/http/security_middleware.go`
- Create: `services/api/internal/http/security_middleware_test.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `services/api/cmd/api/main.go`

- [ ] **Step 1: Write failing middleware tests**

Create `services/api/internal/http/security_middleware_test.go`:

```go
package http_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/security"
)

func TestCSRFProtectionRejectsUntrustedCookieMutationOrigin(t *testing.T) {
	router := apihttp.NewRouter(successfulLoginStore(t),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{}`))
	req.Header.Set("Origin", "https://evil.example")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected forbidden, got %d with body %s", rec.Code, rec.Body.String())
	}
}

func TestCSRFProtectionAllowsTrustedCookieMutationOrigin(t *testing.T) {
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithTrustedOrigins([]string{"https://app.clinicpulse.example"}),
	)
	req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
	req.Header.Set("Origin", "https://app.clinicpulse.example")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code == http.StatusForbidden {
		t.Fatalf("expected trusted origin not to be rejected, body %s", rec.Body.String())
	}
}

func TestMutationRateLimitReturns429(t *testing.T) {
	limiter := security.NewFixedWindowLimiter(1, time.Minute, time.Now)
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{}),
		apihttp.WithMutationRateLimiter(limiter),
	)

	for attempt := 0; attempt < 2; attempt++ {
		req := httptest.NewRequest(http.MethodPost, "/v1/reports", strings.NewReader(`{"clinicId":"clinic-1","status":"operational"}`))
		req.Header.Set("Origin", "http://localhost:3000")
		req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if attempt == 1 && rec.Code != http.StatusTooManyRequests {
			t.Fatalf("expected second attempt to rate-limit, got %d", rec.Code)
		}
	}
}
```

Use existing helpers from `handlers_test.go` where possible; if a helper is local to that file, move it into a shared test helper in the same package.

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestCSRFProtection|TestMutationRateLimit'
```

Expected: FAIL because router options and middleware do not exist.

- [ ] **Step 3: Implement router options**

In `services/api/internal/http/router.go`, extend `RouterConfig`:

```go
TrustedOrigins       []string
LoginRateLimiter     *security.FixedWindowLimiter
MutationRateLimiter  *security.FixedWindowLimiter
```

Add options:

```go
func WithTrustedOrigins(origins []string) RouterOption {
	return func(config *RouterConfig) {
		config.TrustedOrigins = append([]string(nil), origins...)
	}
}

func WithLoginRateLimiter(limiter *security.FixedWindowLimiter) RouterOption {
	return func(config *RouterConfig) {
		config.LoginRateLimiter = limiter
	}
}

func WithMutationRateLimiter(limiter *security.FixedWindowLimiter) RouterOption {
	return func(config *RouterConfig) {
		config.MutationRateLimiter = limiter
	}
}
```

- [ ] **Step 4: Implement middleware**

Create `services/api/internal/http/security_middleware.go`:

```go
package http

import (
	nethttp "net/http"
	"strings"

	"clinicpulse/services/api/internal/security"
)

func ProtectCookieMutations(trustedOrigins []string) func(nethttp.Handler) nethttp.Handler {
	trusted := map[string]struct{}{}
	for _, origin := range trustedOrigins {
		trusted[strings.TrimRight(strings.ToLower(strings.TrimSpace(origin)), "/")] = struct{}{}
	}
	trusted["http://localhost:3000"] = struct{}{}
	trusted["http://127.0.0.1:3000"] = struct{}{}

	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			if !unsafeMethod(r.Method) || !hasSessionCookie(r) || strings.HasPrefix(r.URL.Path, "/v1/partner/") {
				next.ServeHTTP(w, r)
				return
			}

			origin := strings.TrimRight(strings.ToLower(strings.TrimSpace(r.Header.Get("Origin"))), "/")
			if origin == "" {
				origin = originFromReferer(r.Header.Get("Referer"))
			}
			if _, ok := trusted[origin]; !ok {
				RespondError(w, nethttp.StatusForbidden, "csrf_rejected", "request origin is not allowed")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func RateLimitMutations(limiter *security.FixedWindowLimiter) func(nethttp.Handler) nethttp.Handler {
	return func(next nethttp.Handler) nethttp.Handler {
		return nethttp.HandlerFunc(func(w nethttp.ResponseWriter, r *nethttp.Request) {
			if limiter == nil || !unsafeMethod(r.Method) {
				next.ServeHTTP(w, r)
				return
			}
			key := "mutation:" + remoteIPAddress(r.RemoteAddr) + ":" + r.URL.Path
			if !limiter.Allow(key) {
				RespondError(w, nethttp.StatusTooManyRequests, "rate_limited", "too many requests")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func unsafeMethod(method string) bool {
	return method == nethttp.MethodPost || method == nethttp.MethodPut || method == nethttp.MethodPatch || method == nethttp.MethodDelete
}

func hasSessionCookie(r *nethttp.Request) bool {
	cookie, err := r.Cookie(sessionCookieName)
	return err == nil && cookie.Value != ""
}

func originFromReferer(value string) string {
	if value == "" {
		return ""
	}
	if parsed, err := url.Parse(value); err == nil && parsed.Scheme != "" && parsed.Host != "" {
		return strings.ToLower(parsed.Scheme + "://" + parsed.Host)
	}
	return ""
}
```

Add `net/url` to imports when implementing `originFromReferer`.

- [ ] **Step 5: Install middleware in router**

In `NewRouter`, after request logging:

```go
router.Use(ProtectCookieMutations(config.TrustedOrigins))
router.Use(RateLimitMutations(config.MutationRateLimiter))
```

- [ ] **Step 6: Wire config in API main**

In `services/api/cmd/api/main.go`, pass router options:

```go
router := apihttp.NewRouter(store,
	apihttp.WithAPIKeyPepper(cfg.APIKeyPepper),
	apihttp.WithWebhookDeliveryEnabled(cfg.WebhookDeliveryEnabled),
	apihttp.WithTrustedOrigins(cfg.TrustedOrigins),
	apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(cfg.LoginRateLimit, cfg.RateLimitWindow, time.Now)),
	apihttp.WithMutationRateLimiter(security.NewFixedWindowLimiter(cfg.MutationRateLimit, cfg.RateLimitWindow, time.Now)),
)
```

- [ ] **Step 7: Verify**

Run:

```bash
cd services/api && go test ./internal/http ./internal/security ./cmd/api
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add services/api/internal/http/security_middleware.go services/api/internal/http/security_middleware_test.go services/api/internal/http/router.go services/api/cmd/api/main.go
git commit -m "feat: protect cookie mutations"
```

## Task 6: Login Throttling

**Files:**

- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/handlers_test.go`
- Modify: `services/api/internal/http/router.go`

- [ ] **Step 1: Write failing login throttle test**

Add to `services/api/internal/http/handlers_test.go` near login tests:

```go
func TestLoginRateLimitReturnsGenericUnauthorized(t *testing.T) {
	router := apihttp.NewRouter(successfulLoginStore(t),
		apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(1, time.Minute, time.Now)),
	)

	for attempt := 0; attempt < 2; attempt++ {
		req := httptest.NewRequest(http.MethodPost, "/v1/auth/login", strings.NewReader(`{"email":"manager@example.test","password":"wrong-password"}`))
		req.RemoteAddr = "203.0.113.10:41234"
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("expected generic unauthorized, got %d with body %s", rec.Code, rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "rate") || strings.Contains(rec.Body.String(), "throttle") {
			t.Fatalf("login throttle response leaked throttle state: %s", rec.Body.String())
		}
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd services/api && go test ./internal/http -run TestLoginRateLimitReturnsGenericUnauthorized
```

Expected: FAIL because login handler does not consult `LoginRateLimiter`.

- [ ] **Step 3: Add limiter to handler config**

In `services/api/internal/http/handlers.go`, extend `HandlerConfig`:

```go
LoginRateLimiter *security.FixedWindowLimiter
```

Pass it from `NewRouter` into `NewHandler`.

- [ ] **Step 4: Throttle login before password verification**

In `Login`, after email/password validation and before `GetUserByEmail`:

```go
if h.config.LoginRateLimiter != nil {
	key := "login:" + remoteIPAddress(r.RemoteAddr) + ":" + email
	if !h.config.LoginRateLimiter.Allow(key) {
		respondUnauthorized(w)
		return
	}
}
```

- [ ] **Step 5: Verify**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestLogin|TestAuthMe|TestLogout'
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add services/api/internal/http/handlers.go services/api/internal/http/handlers_test.go services/api/internal/http/router.go
git commit -m "feat: throttle login attempts"
```

## Task 7: Auth Lifecycle Schema And Store

**Files:**

- Create: `services/api/migrations/0009_auth_hardening_admin_lifecycle.sql`
- Modify: `services/api/internal/store/models.go`
- Modify: `services/api/internal/store/auth_queries.go`
- Modify: `services/api/internal/store/auth_queries_integration_test.go`
- Modify: `services/api/internal/store/migrations_test.go`
- Modify: `services/api/seeds/local_phase3_auth_users.sql`

- [ ] **Step 1: Write failing integration tests**

Add to `services/api/internal/store/auth_queries_integration_test.go`:

```go
func TestAdminLifecycleQueriesCreateDisableAndRevokeSessions(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:                 "pilot@example.test",
		DisplayName:           "Pilot User",
		PasswordHash:          &passwordHash,
		PasswordResetRequired: true,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	if user.ID == 0 || !user.PasswordResetRequired {
		t.Fatalf("expected created user with password reset required, got %+v", user)
	}

	session := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    user.ID,
		TokenHash: "token-hash-pilot",
		ExpiresAt: time.Now().UTC().Add(time.Hour),
	})

	if err := store.DisableUser(ctx, user.ID, time.Now().UTC()); err != nil {
		t.Fatalf("DisableUser returned error: %v", err)
	}
	if count, err := store.RevokeActiveSessionsForUser(ctx, user.ID); err != nil || count != 1 {
		t.Fatalf("expected one revoked session, count=%d err=%v", count, err)
	}
	if _, _, err := store.GetSessionByTokenHash(ctx, session.TokenHash); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected revoked session to be unusable, got %v", err)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && MIGRATIONS_TEST_DATABASE_URL="$MIGRATIONS_TEST_DATABASE_URL" AUTH_STORE_TEST_DATABASE_URL="$AUTH_STORE_TEST_DATABASE_URL" go test ./internal/store -run TestAdminLifecycleQueries
```

Expected: FAIL because store methods and schema fields do not exist.

- [ ] **Step 3: Add migration**

Create `services/api/migrations/0009_auth_hardening_admin_lifecycle.sql`:

```sql
ALTER TABLE users
    ADD COLUMN password_changed_at TIMESTAMPTZ,
    ADD COLUMN password_reset_required BOOLEAN NOT NULL DEFAULT false;

UPDATE users
SET password_changed_at = updated_at
WHERE password_hash IS NOT NULL
    AND password_changed_at IS NULL;

CREATE INDEX users_disabled_at_idx ON users (disabled_at)
    WHERE disabled_at IS NOT NULL;

CREATE INDEX users_password_reset_required_idx ON users (password_reset_required)
    WHERE password_reset_required = true;
```

- [ ] **Step 4: Extend store models**

In `services/api/internal/store/models.go`, add to `User`:

```go
PasswordChangedAt     *time.Time `json:"passwordChangedAt,omitempty"`
PasswordResetRequired bool       `json:"passwordResetRequired"`
```

Add input types:

```go
type CreateUserInput struct {
	Email                 string
	DisplayName           string
	PasswordHash          *string
	PasswordResetRequired bool
}

type UpsertMembershipInput struct {
	UserID         int64
	OrganisationID *int64
	Role           string
	District        *string
}

type UpdateUserLifecycleInput struct {
	UserID      int64
	DisplayName *string
	Disabled    *bool
	UpdatedAt   time.Time
}
```

- [ ] **Step 5: Implement store queries**

In `services/api/internal/store/auth_queries.go`, update user SELECT lists to include `password_changed_at` and `password_reset_required`, update `scanUser`, and add:

```go
func (s Store) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, createUserSQL,
		strings.ToLower(strings.TrimSpace(input.Email)),
		strings.TrimSpace(input.DisplayName),
		input.PasswordHash,
		input.PasswordResetRequired,
	))
}

func (s Store) DisableUser(ctx context.Context, userID int64, disabledAt time.Time) error {
	tag, err := s.pool.Exec(ctx, disableUserSQL, userID, disabledAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s Store) EnableUser(ctx context.Context, userID int64) error {
	tag, err := s.pool.Exec(ctx, enableUserSQL, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s Store) RevokeActiveSessionsForUser(ctx context.Context, userID int64) (int64, error) {
	tag, err := s.pool.Exec(ctx, revokeActiveSessionsForUserSQL, userID)
	return tag.RowsAffected(), err
}

func (s Store) GetUserByID(ctx context.Context, userID int64) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, getUserByIDSQL, userID))
}

func (s Store) GetAdminUserAccessByUserID(ctx context.Context, userID int64) (AdminUserAccessRow, error) {
	return scanAdminUserAccessRow(s.pool.QueryRow(ctx, getAdminUserAccessByUserIDSQL, userID))
}

func (s Store) UpdateUserLifecycle(ctx context.Context, input UpdateUserLifecycleInput) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, updateUserLifecycleSQL,
		input.UserID,
		input.DisplayName,
		input.Disabled,
		input.UpdatedAt,
	))
}

func (s Store) UpsertOrganisationMembership(ctx context.Context, input UpsertMembershipInput) (OrganisationMembership, error) {
	return scanOrganisationMembership(s.pool.QueryRow(ctx, upsertOrganisationMembershipSQL,
		input.UserID,
		input.OrganisationID,
		input.Role,
		input.District,
	))
}
```

Use SQL constants:

```sql
INSERT INTO users (email, display_name, password_hash, password_reset_required, password_changed_at)
VALUES ($1, $2, $3, $4, CASE WHEN $3::text IS NULL THEN NULL ELSE now() END)
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at
```

```sql
UPDATE users SET disabled_at = $2, updated_at = now() WHERE id = $1 AND disabled_at IS NULL
```

```sql
UPDATE users SET disabled_at = NULL, updated_at = now() WHERE id = $1
```

```sql
UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
```

```sql
SELECT id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at
FROM users
WHERE id = $1
```

```sql
SELECT user_id, email, display_name, disabled_at, created_at, role, organisation_id, district, last_seen_at
FROM admin_user_access
WHERE user_id = $1
```

```sql
UPDATE users
SET
    display_name = COALESCE($2, display_name),
    disabled_at = CASE WHEN $3::boolean IS NULL THEN disabled_at WHEN $3 THEN COALESCE(disabled_at, $4) ELSE NULL END,
    updated_at = $4
WHERE id = $1
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at
```

```sql
INSERT INTO organisation_memberships (user_id, organisation_id, role, district)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, role, COALESCE(organisation_id, 0), COALESCE(district, ''))
DO UPDATE SET role = EXCLUDED.role, organisation_id = EXCLUDED.organisation_id, district = EXCLUDED.district
RETURNING id, user_id, organisation_id, role, district, created_at
```

- [ ] **Step 6: Update migration tests and seed**

In `services/api/internal/store/migrations_test.go`, include `0009_auth_hardening_admin_lifecycle.sql` in expected migration coverage.

In `services/api/seeds/local_phase3_auth_users.sql`, set `password_changed_at = now()` and `password_reset_required = false` for seeded users.

- [ ] **Step 7: Verify**

Run:

```bash
make db-up-e2e db-reset-e2e
cd services/api && AUTH_STORE_TEST_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" go test ./internal/store
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add services/api/migrations/0009_auth_hardening_admin_lifecycle.sql services/api/internal/store/models.go services/api/internal/store/auth_queries.go services/api/internal/store/auth_queries_integration_test.go services/api/internal/store/migrations_test.go services/api/seeds/local_phase3_auth_users.sql
git commit -m "feat: add auth lifecycle persistence"
```

## Task 8: Admin Lifecycle Service And API

**Files:**

- Create: `services/api/internal/service/admin_users.go`
- Create: `services/api/internal/service/admin_users_test.go`
- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/handlers_test.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `lib/workspace/api-types.ts`
- Modify: `lib/workspace/api-client.ts`

- [ ] **Step 1: Write failing service tests**

Create `services/api/internal/service/admin_users_test.go`:

```go
package service

import "testing"

func TestCanManageUserScopePreventsOrgAdminChangingSystemAdmin(t *testing.T) {
	organisationID := int64(10)
	actor := AdminActor{Role: "org_admin", OrganisationID: &organisationID}
	target := AdminUserAccess{Role: "system_admin"}

	if CanManageUserAccess(actor, target, AdminUserAccessChange{Role: "system_admin"}) {
		t.Fatal("expected org admin not to manage system admin access")
	}
}

func TestCanManageUserScopeAllowsOrgAdminInsideOrganisation(t *testing.T) {
	organisationID := int64(10)
	district := "Tshwane"
	actor := AdminActor{Role: "org_admin", OrganisationID: &organisationID}
	target := AdminUserAccess{Role: "reporter", OrganisationID: &organisationID}
	change := AdminUserAccessChange{Role: "district_manager", OrganisationID: &organisationID, District: &district}

	if !CanManageUserAccess(actor, target, change) {
		t.Fatal("expected org admin to manage access inside organisation")
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/service -run TestCanManageUserScope
```

Expected: FAIL because admin user service types do not exist.

- [ ] **Step 3: Implement service helpers**

Create `services/api/internal/service/admin_users.go`:

```go
package service

type AdminActor struct {
	UserID         int64
	Role           string
	OrganisationID *int64
}

type AdminUserAccess struct {
	UserID         int64
	Role           string
	OrganisationID *int64
	District        *string
}

type AdminUserAccessChange struct {
	Role           string
	OrganisationID *int64
	District        *string
}

func CanManageUserAccess(actor AdminActor, target AdminUserAccess, change AdminUserAccessChange) bool {
	if actor.Role == "system_admin" {
		return true
	}
	if actor.Role != "org_admin" || actor.OrganisationID == nil {
		return false
	}
	if target.Role == "system_admin" || change.Role == "system_admin" {
		return false
	}
	if change.OrganisationID == nil || *change.OrganisationID != *actor.OrganisationID {
		return false
	}
	if target.OrganisationID != nil && *target.OrganisationID != *actor.OrganisationID {
		return false
	}
	return change.Role == "org_admin" || change.Role == "district_manager" || change.Role == "reporter"
}
```

- [ ] **Step 4: Write failing handler tests**

Add to `services/api/internal/http/handlers_test.go`:

```go
func TestAdminCanCreateUserWithoutLeakingHash(t *testing.T) {
	var created store.CreateUserInput
	router := apihttp.NewRouter(authenticatedStore(t, "org_admin", fakeStore{createUserInput: &created}))
	req := httptest.NewRequest(http.MethodPost, "/v1/admin/users", strings.NewReader(`{"email":"pilot@example.test","displayName":"Pilot User","role":"reporter","organisationId":1}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected created, got %d with body %s", rec.Code, rec.Body.String())
	}
	if created.PasswordHash == nil || strings.Contains(rec.Body.String(), *created.PasswordHash) {
		t.Fatalf("response leaked password hash")
	}
	if !strings.Contains(rec.Body.String(), "temporaryPassword") {
		t.Fatalf("expected one-time temporary password in response, got %s", rec.Body.String())
	}
}

func TestAdminCanRevokeManagedUserSessions(t *testing.T) {
	revokedUserID := int64(0)
	router := apihttp.NewRouter(authenticatedStore(t, "org_admin", fakeStore{revokedSessionsUserID: &revokedUserID}))
	req := httptest.NewRequest(http.MethodPost, "/v1/admin/users/42/sessions/revoke", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected ok, got %d with body %s", rec.Code, rec.Body.String())
	}
	if revokedUserID != 42 {
		t.Fatalf("expected revoked sessions for user 42, got %d", revokedUserID)
	}
}
```

- [ ] **Step 5: Run handler tests to verify they fail**

Run:

```bash
cd services/api && go test ./internal/http -run 'TestAdminCanCreateUser|TestAdminCanRevokeManagedUserSessions'
```

Expected: FAIL because routes and fake store fields do not exist.

- [ ] **Step 6: Add routes**

In `services/api/internal/http/router.go`, add:

```go
router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/users", handler.CreateAdminUser)
router.With(requireAuth, orgAdminOrSystemAdmin).Patch("/v1/admin/users/{userId}", handler.UpdateAdminUser)
router.With(requireAuth, orgAdminOrSystemAdmin).Put("/v1/admin/users/{userId}/access", handler.UpdateAdminUserAccess)
router.With(requireAuth, orgAdminOrSystemAdmin).Post("/v1/admin/users/{userId}/sessions/revoke", handler.RevokeAdminUserSessions)
```

- [ ] **Step 7: Implement handlers**

In `services/api/internal/http/handlers.go`, extend `ClinicStore` with the store methods from Task 7 plus existing audit insertion:

```go
CreateUser(ctx context.Context, input store.CreateUserInput) (store.User, error)
GetUserByID(ctx context.Context, userID int64) (store.User, error)
GetAdminUserAccessByUserID(ctx context.Context, userID int64) (store.AdminUserAccessRow, error)
UpdateUserLifecycle(ctx context.Context, input store.UpdateUserLifecycleInput) (store.User, error)
UpsertOrganisationMembership(ctx context.Context, input store.UpsertMembershipInput) (store.OrganisationMembership, error)
RevokeActiveSessionsForUser(ctx context.Context, userID int64) (int64, error)
CreateAuditEvent(ctx context.Context, input store.CreateAuditEventInput) (store.AuditEvent, error)
```

Add request/response structs:

```go
type createAdminUserRequest struct {
	Email          string  `json:"email"`
	DisplayName    string  `json:"displayName"`
	Role           string  `json:"role"`
	OrganisationID *int64  `json:"organisationId"`
	District       *string `json:"district"`
}

type createAdminUserResponse struct {
	User              store.User                   `json:"user"`
	Memberships       []store.OrganisationMembership `json:"memberships"`
	TemporaryPassword string                       `json:"temporaryPassword"`
}

type updateAdminUserRequest struct {
	DisplayName *string `json:"displayName"`
	Disabled    *bool   `json:"disabled"`
}

type updateAdminUserAccessRequest struct {
	Role           string  `json:"role"`
	OrganisationID *int64  `json:"organisationId"`
	District       *string `json:"district"`
}

type revokeAdminUserSessionsResponse struct {
	RevokedSessions int64 `json:"revokedSessions"`
}
```

Add helpers:

```go
func adminActorForPrincipal(principal Principal) service.AdminActor {
	return service.AdminActor{
		UserID:         principal.UserID,
		Role:           principal.Role,
		OrganisationID: principal.OrganisationID,
	}
}

func adminAccessForRow(row store.AdminUserAccessRow) service.AdminUserAccess {
	return service.AdminUserAccess{
		UserID:         row.UserID,
		Role:           row.Role,
		OrganisationID: row.OrganisationID,
		District:        row.District,
	}
}

func generateTemporaryPassword() (string, error) {
	randomBytes := make([]byte, 18)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(randomBytes), nil
}

func lifecycleAuditInput(principal Principal, eventType string, summary string, targetUserID int64, metadata map[string]any) store.CreateAuditEventInput {
	entityType := "user"
	entityID := strconv.FormatInt(targetUserID, 10)
	return store.CreateAuditEventInput{
		EventType:      eventType,
		Summary:        summary,
		ActorUserID:    &principal.UserID,
		ActorRole:      &principal.Role,
		OrganisationID: principal.OrganisationID,
		EntityType:     &entityType,
		EntityID:       &entityID,
		Metadata:       metadata,
	}
}
```

Add handler methods with these response rules:

```go
func (h Handler) CreateAdminUser(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	var payload createAdminUserRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "request body must be valid JSON")
		return
	}
	payload.Email = strings.ToLower(strings.TrimSpace(payload.Email))
	payload.DisplayName = strings.TrimSpace(payload.DisplayName)
	payload.Role = strings.TrimSpace(payload.Role)
	change := service.AdminUserAccessChange{Role: payload.Role, OrganisationID: payload.OrganisationID, District: payload.District}
	if payload.Email == "" || payload.DisplayName == "" || !service.CanManageUserAccess(adminActorForPrincipal(principal), service.AdminUserAccess{}, change) {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "email, displayName, role, and allowed scope are required")
		return
	}

	temporaryPassword, err := generateTemporaryPassword()
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	passwordHash, err := auth.HashPassword(temporaryPassword)
	if err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}

	user, err := h.store.CreateUser(r.Context(), store.CreateUserInput{
		Email:                 payload.Email,
		DisplayName:           payload.DisplayName,
		PasswordHash:          &passwordHash,
		PasswordResetRequired: true,
	})
	if err != nil {
		respondStoreError(w, err, "failed to create user")
		return
	}
	membership, err := h.store.UpsertOrganisationMembership(r.Context(), store.UpsertMembershipInput{
		UserID:         user.ID,
		OrganisationID: payload.OrganisationID,
		Role:           payload.Role,
		District:        payload.District,
	})
	if err != nil {
		respondStoreError(w, err, "failed to create user access")
		return
	}
	if _, err := h.store.CreateAuditEvent(r.Context(), lifecycleAuditInput(principal, "admin.user.created", "Created pilot user account.", user.ID, map[string]any{"role": payload.Role})); err != nil {
		respondStoreError(w, err, "failed to write audit event")
		return
	}

	RespondJSON(w, nethttp.StatusCreated, createAdminUserResponse{User: user, Memberships: []store.OrganisationMembership{membership}, TemporaryPassword: temporaryPassword})
}
```

Use the same pattern for the remaining handlers:

```go
func (h Handler) UpdateAdminUser(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	userID, err := strconv.ParseInt(chi.URLParam(r, "userId"), 10, 64)
	if err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "userId must be a number")
		return
	}
	target, err := h.store.GetAdminUserAccessByUserID(r.Context(), userID)
	if err != nil {
		respondStoreError(w, err, "user not found")
		return
	}
	if !service.CanManageUserAccess(adminActorForPrincipal(principal), adminAccessForRow(target), service.AdminUserAccessChange{Role: target.Role, OrganisationID: target.OrganisationID, District: target.District}) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		return
	}
	var payload updateAdminUserRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "request body must be valid JSON")
		return
	}
	user, err := h.store.UpdateUserLifecycle(r.Context(), store.UpdateUserLifecycleInput{UserID: userID, DisplayName: payload.DisplayName, Disabled: payload.Disabled, UpdatedAt: time.Now().UTC()})
	if err != nil {
		respondStoreError(w, err, "failed to update user")
		return
	}
	if _, err := h.store.CreateAuditEvent(r.Context(), lifecycleAuditInput(principal, "admin.user.updated", "Updated pilot user account.", userID, map[string]any{"disabled": payload.Disabled != nil && *payload.Disabled})); err != nil {
		respondStoreError(w, err, "failed to write audit event")
		return
	}
	RespondJSON(w, nethttp.StatusOK, user)
}

func (h Handler) UpdateAdminUserAccess(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	userID, err := strconv.ParseInt(chi.URLParam(r, "userId"), 10, 64)
	if err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "userId must be a number")
		return
	}
	target, err := h.store.GetAdminUserAccessByUserID(r.Context(), userID)
	if err != nil {
		respondStoreError(w, err, "user not found")
		return
	}
	var payload updateAdminUserAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "request body must be valid JSON")
		return
	}
	change := service.AdminUserAccessChange{Role: payload.Role, OrganisationID: payload.OrganisationID, District: payload.District}
	if !service.CanManageUserAccess(adminActorForPrincipal(principal), adminAccessForRow(target), change) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		return
	}
	membership, err := h.store.UpsertOrganisationMembership(r.Context(), store.UpsertMembershipInput{UserID: userID, OrganisationID: payload.OrganisationID, Role: payload.Role, District: payload.District})
	if err != nil {
		respondStoreError(w, err, "failed to update user access")
		return
	}
	if _, err := h.store.CreateAuditEvent(r.Context(), lifecycleAuditInput(principal, "admin.user.access.updated", "Updated pilot user access.", userID, map[string]any{"role": payload.Role})); err != nil {
		respondStoreError(w, err, "failed to write audit event")
		return
	}
	RespondJSON(w, nethttp.StatusOK, membership)
}

func (h Handler) RevokeAdminUserSessions(w nethttp.ResponseWriter, r *nethttp.Request) {
	principal, ok := PrincipalFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}
	userID, err := strconv.ParseInt(chi.URLParam(r, "userId"), 10, 64)
	if err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "userId must be a number")
		return
	}
	target, err := h.store.GetAdminUserAccessByUserID(r.Context(), userID)
	if err != nil {
		respondStoreError(w, err, "user not found")
		return
	}
	if !service.CanManageUserAccess(adminActorForPrincipal(principal), adminAccessForRow(target), service.AdminUserAccessChange{Role: target.Role, OrganisationID: target.OrganisationID, District: target.District}) {
		RespondError(w, nethttp.StatusForbidden, "forbidden", "forbidden")
		return
	}
	revoked, err := h.store.RevokeActiveSessionsForUser(r.Context(), userID)
	if err != nil {
		respondStoreError(w, err, "failed to revoke sessions")
		return
	}
	if _, err := h.store.CreateAuditEvent(r.Context(), lifecycleAuditInput(principal, "admin.user.sessions.revoked", "Revoked pilot user sessions.", userID, map[string]any{"revokedSessions": revoked})); err != nil {
		respondStoreError(w, err, "failed to write audit event")
		return
	}
	RespondJSON(w, nethttp.StatusOK, revokeAdminUserSessionsResponse{RevokedSessions: revoked})
}
```

- [ ] **Step 8: Add TypeScript client types**

In `lib/workspace/api-types.ts`, change the auth import to `import type { AuthMembership, AuthRole } from "@/lib/auth/api";` and add:

```ts
export type AdminCreateUserRequest = {
  email: string;
  displayName: string;
  role: AuthRole;
  organisationId?: number;
  district?: string;
};

export type AdminCreateUserResponse = {
  user: {
    id: number;
    email: string;
    displayName: string;
    disabledAt?: string;
    passwordResetRequired?: boolean;
  };
  memberships: AuthMembership[];
  temporaryPassword: string;
};

export type AdminUpdateUserRequest = {
  displayName?: string;
  disabled?: boolean;
};

export type AdminUpdateUserAccessRequest = {
  role: AuthRole;
  organisationId?: number;
  district?: string;
};

export type AdminUpdateUserAccessResponse = AuthMembership;
```

In `lib/workspace/api-client.ts`, add `AdminCreateUserRequest`, `AdminCreateUserResponse`, `AdminUpdateUserAccessRequest`, `AdminUpdateUserAccessResponse`, and `AdminUpdateUserRequest` to the import list and add:

```ts
export function createAdminUser(
  input: AdminCreateUserRequest,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<AdminCreateUserResponse>(["v1", "admin", "users"], options, {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function updateAdminUser(
  userId: number | string,
  input: AdminUpdateUserRequest,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<AdminUserAccessApiResponse>(
    ["v1", "admin", "users", String(userId)],
    options,
    {
      body: JSON.stringify(input),
      method: "PATCH",
    },
  );
}

export function updateAdminUserAccess(
  userId: number | string,
  input: AdminUpdateUserAccessRequest,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<AdminUpdateUserAccessResponse>(
    ["v1", "admin", "users", String(userId), "access"],
    options,
    {
      body: JSON.stringify(input),
      method: "PUT",
    },
  );
}

export function revokeAdminUserSessions(
  userId: number | string,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<{ revokedSessions: number }>(
    ["v1", "admin", "users", String(userId), "sessions", "revoke"],
    options,
    { method: "POST" },
  );
}
```

- [ ] **Step 9: Verify**

Run:

```bash
cd services/api && go test ./internal/service ./internal/http
npm test -- lib/auth/session.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

Run:

```bash
git add services/api/internal/service/admin_users.go services/api/internal/service/admin_users_test.go services/api/internal/http/handlers.go services/api/internal/http/handlers_test.go services/api/internal/http/router.go lib/workspace/api-types.ts lib/workspace/api-client.ts
git commit -m "feat: add admin user lifecycle api"
```

## Task 9: Admin User Lifecycle UI

**Files:**

- Create: `app/(workspace)/admin/users-roles/actions.ts`
- Create: `components/product/admin-user-lifecycle.tsx`
- Create: `components/product/admin-user-lifecycle-source.test.ts`
- Modify: `app/(workspace)/admin/users-roles/page.tsx`
- Modify: `app/(workspace)/admin/admin-loaders.ts`

- [ ] **Step 1: Write failing component/source tests**

Create `components/product/admin-user-lifecycle-source.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("AdminUserLifecycle", () => {
  it("exposes the expected pilot lifecycle actions", () => {
    const source = readFileSync(
      join(process.cwd(), "components/product/admin-user-lifecycle.tsx"),
      "utf8",
    );

    expect(source).toContain("Create pilot user");
    expect(source).toContain("Disable or enable users");
    expect(source).toContain("Revoke active sessions");
    expect(source).toContain("Temporary password");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- components/product/admin-user-lifecycle-source.test.ts
```

Expected: FAIL because `components/product/admin-user-lifecycle.tsx` does not exist.

- [ ] **Step 3: Add server actions**

Create `app/(workspace)/admin/users-roles/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import {
  createAdminUser,
  revokeAdminUserSessions,
  updateAdminUser,
  updateAdminUserAccess,
} from "@/lib/workspace/api-client";
import { getAdminLoaderOptions } from "../admin-loaders";

export async function createPilotUserAction(formData: FormData) {
  const options = await getAdminLoaderOptions();
  const result = await createAdminUser(
    {
      email: String(formData.get("email") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      role: String(formData.get("role") ?? "reporter") as never,
      organisationId: Number(formData.get("organisationId") ?? 0) || undefined,
      district: String(formData.get("district") ?? "") || undefined,
    },
    options,
  );
  revalidatePath("/admin/users-roles");
  return result;
}

export async function setUserDisabledAction(userId: number, disabled: boolean) {
  await updateAdminUser(userId, { disabled }, await getAdminLoaderOptions());
  revalidatePath("/admin/users-roles");
}

export async function revokeUserSessionsAction(userId: number) {
  await revokeAdminUserSessions(userId, await getAdminLoaderOptions());
  revalidatePath("/admin/users-roles");
}
```

- [ ] **Step 4: Add lifecycle component**

Create `components/product/admin-user-lifecycle.tsx` as a client component with:

- a compact create-user form for email, display name, role, organisation ID, district
- a one-time temporary password result panel after creation
- per-user buttons for disable/enable and revoke sessions
- no nested cards; use existing `AdminFilterBar`, `StatusBadge`, and table layout patterns

- [ ] **Step 5: Wire users page**

In `app/(workspace)/admin/users-roles/page.tsx`, change the module description from read-only to pilot lifecycle management and render:

```tsx
<AdminUserLifecycle
  users={users}
  createUserAction={createPilotUserAction}
  updateUserAction={setUserDisabledAction}
  updateAccessAction={updateUserAccessAction}
  revokeSessionsAction={revokeUserSessionsAction}
/>
```

- [ ] **Step 6: Verify**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add 'app/(workspace)/admin/users-roles/actions.ts' components/product/admin-user-lifecycle.tsx components/product/admin-user-lifecycle-source.test.ts 'app/(workspace)/admin/users-roles/page.tsx' 'app/(workspace)/admin/admin-loaders.ts'
git commit -m "feat: add admin account lifecycle UI"
```

## Task 10: Change Own Password

**Files:**

- Modify: `services/api/internal/http/handlers.go`
- Modify: `services/api/internal/http/handlers_test.go`
- Modify: `services/api/internal/http/router.go`
- Modify: `services/api/internal/store/auth_queries.go`
- Modify: `services/api/internal/store/auth_queries_integration_test.go`

- [ ] **Step 1: Write failing password-change handler test**

Add to `services/api/internal/http/handlers_test.go`:

```go
func TestAuthenticatedUserCanChangeOwnPassword(t *testing.T) {
	oldHash := hashPasswordForTest(t, "old-password")
	var updatedHash string
	router := apihttp.NewRouter(authenticatedStore(t, "reporter", fakeStore{
		userPasswordHash: &oldHash,
		updatedPasswordHash: &updatedHash,
	}))
	req := httptest.NewRequest(http.MethodPost, "/v1/auth/password", strings.NewReader(`{"currentPassword":"old-password","newPassword":"new-secure-password-123"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://localhost:3000")
	req.AddCookie(&http.Cookie{Name: "clinicpulse_session", Value: sessionTokenForTest(t)})
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected no content, got %d with body %s", rec.Code, rec.Body.String())
	}
	if updatedHash == "" || strings.Contains(updatedHash, "new-secure-password-123") {
		t.Fatalf("expected hashed password update")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd services/api && go test ./internal/http -run TestAuthenticatedUserCanChangeOwnPassword
```

Expected: FAIL because route and fake store fields do not exist.

- [ ] **Step 3: Add store update method**

In `services/api/internal/store/auth_queries.go`, add:

```go
const updateUserPasswordSQL = `
UPDATE users
SET password_hash = $2,
    password_changed_at = now(),
    password_reset_required = false,
    updated_at = now()
WHERE id = $1
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at`

func (s Store) UpdateUserPassword(ctx context.Context, userID int64, passwordHash string) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, updateUserPasswordSQL, userID, passwordHash))
}
```

- [ ] **Step 4: Add handler and route**

In `router.go`:

```go
router.With(requireAuth).Post("/v1/auth/password", handler.ChangePassword)
```

In `handlers.go`, add:

```go
type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

func (h Handler) ChangePassword(w nethttp.ResponseWriter, r *nethttp.Request) {
	details, ok := authDetailsFromContext(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	var payload changePasswordRequest
	if !decodeSingleJSON(w, r, &payload) {
		return
	}
	if payload.CurrentPassword == "" || len(payload.NewPassword) < 12 {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "currentPassword and a 12+ character newPassword are required")
		return
	}
	if details.User.PasswordHash == nil {
		respondUnauthorized(w)
		return
	}
	okPassword, err := auth.VerifyPassword(payload.CurrentPassword, *details.User.PasswordHash)
	if err != nil || !okPassword {
		respondUnauthorized(w)
		return
	}
	hash, err := auth.HashPassword(payload.NewPassword)
	if err != nil {
		RespondError(w, nethttp.StatusBadRequest, "validation_error", "validation failed", "newPassword is invalid")
		return
	}
	if _, err := h.store.UpdateUserPassword(r.Context(), details.User.ID, hash); err != nil {
		RespondError(w, nethttp.StatusInternalServerError, "internal_error", "internal server error")
		return
	}
	w.WriteHeader(nethttp.StatusNoContent)
}
```

- [ ] **Step 5: Verify**

Run:

```bash
cd services/api && go test ./internal/http ./internal/store
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add services/api/internal/http/handlers.go services/api/internal/http/handlers_test.go services/api/internal/http/router.go services/api/internal/store/auth_queries.go services/api/internal/store/auth_queries_integration_test.go
git commit -m "feat: allow authenticated password changes"
```

## Task 11: E2E Security Coverage

**Files:**

- Create: `tests/e2e/security-auth-hardening.spec.ts`

- [ ] **Step 1: Write E2E tests**

Create `tests/e2e/security-auth-hardening.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

import { signInAs } from "./helpers/auth";

async function signIn(page: Page, email: string, homePath: string) {
  await signInAs(page, email, homePath);
}

test("login page hides demo credentials when demo fallback is disabled", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Local seeded credentials")).toBeHidden();
  await expect(page.getByText("ClinicPulseDemo123!")).toBeHidden();
});

test("register page stays provisioned-only when public registration is disabled", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel("Password")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Request access review" })).toBeVisible();
});

test("admin can create a pilot user and sees the one-time temporary password", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local", "/admin");
  await page.goto("/admin/users-roles");

  await page.getByRole("button", { name: "Create pilot user" }).click();
  await page.getByLabel("Work email").fill(`pilot-${Date.now()}@example.test`);
  await page.getByLabel("Display name").fill("Pilot User");
  await page.getByLabel("Role").selectOption("reporter");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Temporary password")).toBeVisible();
});

test("untrusted cookie mutation is rejected", async ({ page }) => {
  await signIn(page, "reporter@clinicpulse.local", "/field");
  const response = await page.request.post("/api/clinicpulse/v1/reports", {
    headers: { Origin: "https://evil.example" },
    data: { clinicId: "clinic-mamelodi-east", status: "operational" },
  });

  expect(response.status()).toBe(403);
});
```

The existing Playwright web server already sets `CLINICPULSE_ALLOW_SEEDED_FALLBACK="false"`, so the first test verifies that the new runtime flag hides the credential panel when local demo fallback is disabled.

- [ ] **Step 2: Run tests to verify they fail before implementation is complete**

Run:

```bash
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npm run test:e2e -- tests/e2e/security-auth-hardening.spec.ts
```

Expected: FAIL until admin UI and CSRF protections are wired.

- [ ] **Step 3: Verify E2E**

Run:

```bash
make db-up-e2e db-reset-e2e
E2E_DATABASE_URL="postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable" npm run test:e2e -- tests/e2e/security-auth-hardening.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add tests/e2e/security-auth-hardening.spec.ts
git commit -m "test: cover phase 2 auth hardening flows"
```

## Task 12: Docs, Gates, And Closeout

**Files:**

- Modify: `docs/api.md`
- Modify: `docs/architecture.md`
- Modify: `docs/database-schema.md`
- Modify: `docs/deployment.md`
- Modify: `docs/release.md`
- Modify: `docs/production-readiness-execution-plan.md`
- Create: `docs/phase-2-security-and-auth-hardening-closeout.md`
- Modify: `.gitignore`
- Modify: `.github/workflows/pr-hygiene.yml`

- [ ] **Step 1: Update docs**

Document:

- `POST /v1/auth/password`
- `POST /v1/admin/users`
- `PATCH /v1/admin/users/{userId}`
- `PUT /v1/admin/users/{userId}/access`
- `POST /v1/admin/users/{userId}/sessions/revoke`
- `429 rate_limited`
- `403 csrf_rejected`
- trusted origin and rate-limit environment variables
- `users.password_changed_at` and `users.password_reset_required`

- [ ] **Step 2: Add closeout**

Create `docs/phase-2-security-and-auth-hardening-closeout.md`:

```md
# Phase 2 Security And Auth Hardening Closeout

Date: 2026-05-14
Status: Complete

## Completed Outcomes

- Demo credentials are hidden outside local deployments.
- Cookie-authenticated mutations reject untrusted origins.
- Login attempts and sensitive mutations are rate-limited.
- Security headers and CSP are configured.
- Admins can create, disable, enable, update access, and revoke sessions for pilot users.
- Users can change their own password after admin provisioning.
- Audit evidence records lifecycle and session-security events.

## Verification

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

## Residual Risk

- Rate limiting is in-process and should move to shared storage before multi-instance production scale.
- Email invites, password reset emails, MFA, SSO, and legal/compliance launch work remain out of scope.

## Next Phase

Phase 3 - Pilot Data And Product Integrity.
```

- [ ] **Step 3: Update roadmap**

In `docs/production-readiness-execution-plan.md`:

- Set current phase to `Phase 3 - Pilot Data And Product Integrity`.
- Set Phase 2 status to `Complete`.
- Add closeout link under Phase 2.

- [ ] **Step 4: Update tracked-doc allowlists**

In `.gitignore`, add:

```gitignore
!docs/phase-2-security-and-auth-hardening-implementation-plan.md
!docs/phase-2-security-and-auth-hardening-closeout.md
```

In `.github/workflows/pr-hygiene.yml`, extend `allowed_tracked_docs` with:

```bash
phase-2-security-and-auth-hardening-(spec|implementation-plan|closeout)
```

- [ ] **Step 5: Run full local verification**

Run:

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git diff --check
git status --short
```

Expected:

- All commands pass.
- `git status --short` shows only intended Phase 2 changes before the final commit.

- [ ] **Step 6: Commit**

Run:

```bash
git add docs/api.md docs/architecture.md docs/database-schema.md docs/deployment.md docs/release.md docs/production-readiness-execution-plan.md docs/phase-2-security-and-auth-hardening-closeout.md .gitignore .github/workflows/pr-hygiene.yml
git commit -m "docs: close phase 2 security hardening"
```

## Final Review Checklist

- [ ] No production-facing UI shows `ClinicPulseDemo123!`.
- [ ] No response body includes plaintext passwords, password hashes, session tokens, or CSRF tokens.
- [ ] Every new unsafe cookie-authenticated route is protected by origin/CSRF middleware.
- [ ] Partner API-key routes still work without browser CSRF headers.
- [ ] Admin lifecycle mutations enforce `org_admin` and `system_admin` scope limits.
- [ ] `make verify`, `make test-e2e`, `make verify-security`, and `make test-api-container` pass.
- [ ] `gh pr checks <phase-2-pr> --watch` is green before merge.
