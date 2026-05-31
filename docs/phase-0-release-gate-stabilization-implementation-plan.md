# Phase 0 Release Gate Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current ClinicPulse alpha release-gate clean by fixing dependency scans, Go vulnerability scans, E2E flake, runtime warnings, and CI enforcement.

**Architecture:** Keep Phase 0 as a stabilization layer over the existing Next.js, Go, and Playwright structure. Prefer small dependency, test-helper, workflow, and warning fixes over feature work. The phase is complete when local and CI release gates match and pass without reruns.

**Tech Stack:** Next.js 16, React 19, TypeScript, npm, Vitest, Playwright, Go chi API, Postgres, govulncheck, GitHub Actions.

---

## File Map

Modify:

- `package.json`: remove CLI-only runtime dependencies and align patched Next.js packages.
- `package-lock.json`: lock the audited dependency graph.
- `services/api/go.mod`: align Go target/toolchain to a patched Go 1.25 release.
- `services/api/go.sum`: update if `go mod tidy` changes checksums.
- `.github/workflows/ci.yml`: add blocking npm audit and govulncheck gates.
- `Makefile`: add explicit security verification targets if useful for local and CI parity.
- `tests/e2e/phase-3-report-review.spec.ts`: stabilize login/navigation waits for the report-review flow.
- `tests/e2e/phase-4-admin-governance.spec.ts`: stabilize admin sidebar navigation waits.
- `tests/e2e/helpers/auth.ts`: create shared E2E auth helper if it reduces duplicate brittle login code.
- `tests/e2e/helpers/navigation.ts`: create shared E2E path/content wait helper if repeated route waits remain brittle.
- `components/landing/motion/scroll-reveal.tsx`: make reduced-motion rendering hydration-stable.
- `app/layout.tsx`: add the supported smooth-scroll document marker.
- `app/globals.css`: keep smooth-scroll behavior consistent with the document marker.
- Landing image components that trigger LCP warnings after verification, likely one or more of:
  - `components/landing/live-incident-hero.tsx`
  - `components/landing/scenario-hero.tsx`
  - `components/landing/problem-contrast.tsx`
  - `components/landing/proof-strip.tsx`
  - `components/landing/status-gap-story.tsx`
- `docs/release.md`: list the final release-gate commands.
- `docs/production-readiness-execution-plan.md`: mark Phase 0 complete during closeout.

Create:

- `docs/phase-0-release-gate-stabilization-closeout.md`: record final commands, outputs, and residual risks.

## Reference Context

- Readiness roadmap: `docs/production-readiness-execution-plan.md`
- Phase 0 spec: `docs/phase-0-release-gate-stabilization-spec.md`
- Current release checklist: `docs/release.md`
- Current CI workflow: `.github/workflows/ci.yml`
- Current E2E config: `playwright.config.ts`
- Current E2E specs: `tests/e2e/phase-3-report-review.spec.ts`, `tests/e2e/phase-4-admin-governance.spec.ts`
- Current landing motion helper: `components/landing/motion/scroll-reveal.tsx`

## Task 0: Confirm Baseline And Branch

**Files:**

- Read: `docs/phase-0-release-gate-stabilization-spec.md`
- Read: `package.json`
- Read: `services/api/go.mod`
- Read: `.github/workflows/ci.yml`

- [ ] **Step 1: Confirm clean starting state**

Run:

```bash
git status --short --branch
```

Expected: current branch is shown and there are no uncommitted changes except work already approved for Phase 0.

- [ ] **Step 2: Create a Phase 0 branch if not already on one**

Run:

```bash
git checkout -b feature/phase-0-release-gate-stabilization
```

Expected: Git switches to `feature/phase-0-release-gate-stabilization`. If the branch already exists, switch to it with `git switch feature/phase-0-release-gate-stabilization`.

- [ ] **Step 3: Reproduce current security failures**

Run:

```bash
npm audit --audit-level=moderate
```

Expected before fixes: FAIL with vulnerabilities including `next`, `postcss`, `fast-uri`, `hono`, `express-rate-limit`, and `ip-address`.

Run:

```bash
cd services/api && govulncheck ./...
```

Expected before fixes: FAIL with reachable Go standard library vulnerabilities fixed in later Go 1.25 patch releases.

## Task 1: Clean Frontend Dependency Audit

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Verify shadcn is CLI-only**

Run:

```bash
rg -n "from ['\"]shadcn|require\\(['\"]shadcn|import .*shadcn" app components lib tests
```

Expected: no output. The source tree does not import the `shadcn` package.

- [ ] **Step 2: Remove the CLI-only shadcn runtime dependency**

Run:

```bash
npm uninstall shadcn
```

Expected: `package.json` no longer lists `shadcn`, and `package-lock.json` removes the `@modelcontextprotocol/sdk` dependency tree that introduced `hono`, `express-rate-limit`, `ip-address`, and `fast-uri` audit findings.

- [ ] **Step 3: Upgrade Next.js packages to the audited patch**

Run:

```bash
npm install next@16.2.6 eslint-config-next@16.2.6
```

Expected: `package.json` lists `next` and `eslint-config-next` at `16.2.6`; `package-lock.json` resolves Next's nested `postcss` to a non-vulnerable version.

- [ ] **Step 4: Run frontend install and audit**

Run:

```bash
npm ci
npm audit --audit-level=moderate
```

Expected: install succeeds and audit exits 0 with no moderate, high, or critical vulnerabilities.

- [ ] **Step 5: Run frontend regression checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands pass after dependency updates.

- [ ] **Step 6: Commit dependency cleanup**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: clean frontend dependency audit"
```

Expected: one commit contains only package manifest and lockfile changes.

## Task 2: Align Go Toolchain And govulncheck

**Files:**

- Modify: `services/api/go.mod`
- Modify: `services/api/go.sum`
- Modify: `.github/workflows/ci.yml`
- Modify: `Makefile`

- [ ] **Step 1: Update Go module target**

Edit `services/api/go.mod` so the header is:

```go
module clinicpulse/services/api

go 1.25.10

toolchain go1.25.10
```

Expected: the API module targets the patched Go release identified by the current vulnerability scan.

- [ ] **Step 2: Tidy the API module with the target toolchain**

Run:

```bash
cd services/api && go mod tidy
```

Expected: command exits 0. `services/api/go.sum` changes only if the Go toolchain updates module checksum ordering or required sums.

- [ ] **Step 3: Verify API tests and vet**

Run:

```bash
cd services/api && go test ./...
cd services/api && go vet ./...
```

Expected: both commands pass.

- [ ] **Step 4: Install and run govulncheck**

Run:

```bash
go install golang.org/x/vuln/cmd/govulncheck@latest
cd services/api && govulncheck ./...
```

Expected: govulncheck exits 0 with no reachable vulnerabilities.

- [ ] **Step 5: Add local security targets**

Modify `Makefile` by adding these phony targets:

```makefile
.PHONY: audit-web audit-api verify-security

audit-web:
	npm audit --audit-level=moderate

audit-api:
	cd "$(API_DIR)" && govulncheck ./...

verify-security: audit-web audit-api
```

Expected: `make verify-security` runs both security scans.

- [ ] **Step 6: Add blocking CI security gates**

Modify `.github/workflows/ci.yml`:

In the `frontend` job, after `Install dependencies`, add:

```yaml
      - name: Audit dependencies
        run: npm audit --audit-level=moderate
```

In the `backend` job, after `Vet`, add:

```yaml
      - name: Install govulncheck
        run: go install golang.org/x/vuln/cmd/govulncheck@latest

      - name: Govulncheck
        run: govulncheck ./...
```

Expected: pull requests and pushes fail when npm audit or govulncheck fails.

- [ ] **Step 7: Commit Go and CI security gates**

Run:

```bash
git add services/api/go.mod services/api/go.sum Makefile .github/workflows/ci.yml
git commit -m "chore: enforce security release gates"
```

Expected: one commit contains Go target, local Makefile gates, and CI security gates.

## Task 3: Stabilize E2E Auth And Navigation

**Files:**

- Modify: `tests/e2e/phase-3-report-review.spec.ts`
- Modify: `tests/e2e/phase-4-admin-governance.spec.ts`
- Create if useful: `tests/e2e/helpers/auth.ts`
- Create if useful: `tests/e2e/helpers/navigation.ts`

- [ ] **Step 1: Reproduce full-suite behavior**

Run:

```bash
make test-e2e
```

Expected before fixes: either the suite fails with the known URL/content timing mismatch or passes. If it passes once, run it a second time before changing tests:

```bash
make test-e2e
```

Expected: the suite must pass twice in a row before deciding no E2E stabilization code is needed.

- [ ] **Step 2: Create a shared stable path helper if URL assertions remain brittle**

Create `tests/e2e/helpers/navigation.ts`:

```ts
import { expect, type Page } from "@playwright/test";

export async function expectStablePath(page: Page, path: string) {
  await page.waitForURL(new RegExp(`${path.replace("/", "\\/")}$`), {
    waitUntil: "networkidle",
  });
  await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
}
```

Expected: tests can wait for a committed route instead of asserting immediately after a click.

- [ ] **Step 3: Create a shared auth helper if duplicated login code remains brittle**

Create `tests/e2e/helpers/auth.ts`:

```ts
import { expect, type Page } from "@playwright/test";
import { expectStablePath } from "./navigation";

const password = "ClinicPulseDemo123!";

export async function signInAs(page: Page, email: string, homePath: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL(new RegExp(`${homePath.replace("/", "\\/")}$`)),
    page.getByRole("button", { name: "Log in" }).click(),
  ]);
  await expectStablePath(page, homePath);
  await expect(page.getByRole("main").or(page.locator("body"))).toBeVisible();
}
```

Expected: login waits for route completion and visible document content.

- [ ] **Step 4: Update Phase 3 report-review spec**

In `tests/e2e/phase-3-report-review.spec.ts`, replace the local `signInAs` helper with the shared helper or update it to use `Promise.all` with `page.waitForURL`.

Expected: the line that previously expected `/district` no longer races with login navigation.

- [ ] **Step 5: Update Phase 4 admin navigation spec**

In `tests/e2e/phase-4-admin-governance.spec.ts`, update `clickSidebarLink` to wait for navigation and content together:

```ts
await Promise.all([
  page.waitForURL(new RegExp(`${path.replace("/", "\\/")}$`)),
  link.click(),
]);
await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
await expect(page.locator("[data-admin-module]").first()).toBeVisible();
```

Expected: the previous `/admin/security` versus `/admin` mismatch no longer appears while security page content is visible.

- [ ] **Step 6: Run targeted specs**

Run:

```bash
make db-reset-e2e
E2E_DATABASE_URL='postgres://clinicpulse:clinicpulse@localhost:55432/clinicpulse_e2e?sslmode=disable' npx playwright test tests/e2e/phase-3-report-review.spec.ts tests/e2e/phase-4-admin-governance.spec.ts --project=desktop-chrome
```

Expected: targeted desktop specs pass.

- [ ] **Step 7: Run full E2E twice**

Run:

```bash
make test-e2e
make test-e2e
```

Expected: both full-suite runs pass without needing targeted reruns.

- [ ] **Step 8: Stop the E2E database**

Run:

```bash
docker compose stop postgres
```

Expected: the local E2E Postgres container stops cleanly.

- [ ] **Step 9: Commit E2E stabilization**

Run:

```bash
git add tests/e2e
git commit -m "test: stabilize release gate e2e navigation"
```

Expected: one commit contains only E2E helper/spec changes.

## Task 4: Fix Landing Runtime Warnings

**Files:**

- Modify: `components/landing/motion/scroll-reveal.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify landing image components identified during warning verification.

- [ ] **Step 1: Capture current landing warnings**

Run:

```bash
npx playwright test tests/e2e/landing-page.spec.ts tests/e2e/landing-motion.spec.ts --project=desktop-chrome
```

Expected before fixes: tests may pass while console output includes hydration, smooth-scroll, reduced-motion, or LCP warnings.

- [ ] **Step 2: Make ScrollReveal hydration-stable**

Modify `components/landing/motion/scroll-reveal.tsx` so reduced motion changes animation values but not the rendered element type. Keep a single `motion.div` render path and avoid returning a plain `div` only on the client.

Expected structure:

```tsx
const shouldReduceMotion = useReducedMotion();
const visible = { opacity: 1, y: 0, filter: "blur(0px)" };
const hidden = shouldReduceMotion ? visible : { opacity: 0, y: 18, filter: "blur(6px)" };

return (
  <motion.div
    initial={hidden}
    animate={visible}
    whileInView={visible}
    transition={{
      duration: shouldReduceMotion ? 0 : 0.5,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1],
    }}
    viewport={{ once: true, margin: "-12% 0px" }}
    className={cn("will-change-transform", className)}
    {...props}
  >
    {children}
  </motion.div>
);
```

Expected: server and client render the same element/class structure.

- [ ] **Step 3: Add Next-supported smooth-scroll marker**

Modify `app/layout.tsx`:

```tsx
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${satoshi.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
```

Expected: the existing `html { scroll-behavior: smooth; }` style no longer triggers the Next warning.

- [ ] **Step 4: Fix LCP image warnings**

Run the landing specs and inspect which image paths still emit LCP priority warnings. For images that are visible in the first viewport, add `priority` or `preload={true}` consistently with the component's existing Next image API usage.

Expected examples:

```tsx
<Image
  src={workspaceImages["district-operations-room"].src}
  alt={workspaceImages["district-operations-room"].alt}
  fill
  priority
  sizes="(min-width: 1024px) 22rem, 100vw"
  className="object-cover"
/>
```

For images below the first viewport, keep them lazy and confirm they no longer trigger a first-viewport LCP warning after layout changes.

- [ ] **Step 5: Re-run landing checks**

Run:

```bash
npx playwright test tests/e2e/landing-page.spec.ts tests/e2e/landing-motion.spec.ts --project=desktop-chrome
npm run build
```

Expected: landing tests and production build pass. Known hydration, smooth-scroll, and LCP warnings from the readiness review are gone.

- [ ] **Step 6: Commit landing warning fixes**

Run:

```bash
git add components/landing app/layout.tsx app/globals.css
git commit -m "fix: remove landing release warnings"
```

Expected: one commit contains warning-related frontend fixes only.

## Task 5: Update Release Documentation

**Files:**

- Modify: `docs/release.md`
- Modify: `docs/production-readiness-execution-plan.md`
- Create: `docs/phase-0-release-gate-stabilization-closeout.md`

- [ ] **Step 1: Update release checklist commands**

Modify `docs/release.md` so the verification command block includes:

```bash
npm ci
make verify
make test-e2e
npm audit --audit-level=moderate
cd services/api && govulncheck ./...
git status --short
```

Expected: release docs match the Phase 0 acceptance criteria.

- [ ] **Step 2: Create Phase 0 closeout document**

Create `docs/phase-0-release-gate-stabilization-closeout.md`:

```markdown
# Phase 0 Release Gate Stabilization Closeout

Date: 2026-05-12
Status: Complete

## Completed Outcomes

- Frontend dependency audit passes.
- Go vulnerability scan passes.
- Full Playwright E2E passes without targeted reruns.
- Landing runtime warnings from the readiness review are resolved.
- CI blocks on release-gate checks.

## Verification

```bash
npm ci
make verify
make test-e2e
npm audit --audit-level=moderate
cd services/api && govulncheck ./...
git status --short
```

## Residual Risk

- Production deployment, auth hardening, data governance, and observability remain scheduled for later phases.

## Next Phase

Phase 1 - Production Runtime And Deployment.
```

Expected: the closeout records evidence rather than new scope.

- [ ] **Step 3: Update roadmap status**

Modify `docs/production-readiness-execution-plan.md`:

- Change `Current phase` to `Phase 1 - Production Runtime And Deployment`.
- Change Phase 0 status from `Planned` to `Complete`.
- Add the closeout link under the Phase 0 section.

Expected: the roadmap points to the next phase after Phase 0 is complete.

- [ ] **Step 4: Commit documentation updates**

Run:

```bash
git add docs/release.md docs/production-readiness-execution-plan.md docs/phase-0-release-gate-stabilization-closeout.md
git commit -m "docs: close phase 0 release gate stabilization"
```

Expected: one commit contains release and roadmap documentation updates.

## Task 6: Final Phase 0 Verification

**Files:**

- Read: all modified files from previous tasks.

- [ ] **Step 1: Run the full release gate**

Run:

```bash
npm ci
make verify
make test-e2e
npm audit --audit-level=moderate
cd services/api && govulncheck ./...
git status --short
```

Expected: every command exits 0. `git status --short` shows no uncommitted changes after final commits.

- [ ] **Step 2: Confirm CI workflow syntax**

Run:

```bash
rg -n "Audit dependencies|Govulncheck|verify-security|audit-web|audit-api" .github/workflows/ci.yml Makefile
```

Expected: output shows the blocking security gates in CI and local Makefile targets.

- [ ] **Step 3: Confirm Phase 1 is the next roadmap phase**

Run:

```bash
rg -n "Current phase|Phase 0|Phase 1" docs/production-readiness-execution-plan.md
```

Expected: `Current phase` points to Phase 1 and Phase 0 is marked complete.

- [ ] **Step 4: Push branch for review**

Run:

```bash
git status --short --branch
git log --oneline --max-count=6
```

Expected: branch is clean and recent commits show Phase 0 dependency, security, E2E, warning, and documentation work.
