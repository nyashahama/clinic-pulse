# Phase 3 First Real Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement the canonical plan task-by-task. The executable checklist lives in the root plan linked below.

**Goal:** Build the first real ClinicPulse product handoff: reporter report submission, district review, accepted status update, audit evidence, and admin review context.

**Architecture:** Reuse the existing Go API/Postgres report and review endpoints. Add typed frontend API helpers, product review view models, authenticated server loaders/actions, and role-specific UI integration in `/field`, `/district`, and `/admin`. Keep `/demo` as showcase/sandbox and do not add new roles.

**Tech Stack:** Next.js App Router, React 19, TypeScript, server actions, Go chi API, Postgres, Vitest, Playwright.

---

## Canonical Plan

Use the root implementation plan as the source of truth:

- [Phase 3 First Real Vertical Slice Implementation Plan](../../phase-3-first-real-vertical-slice-implementation-plan.md)

## Why This File Exists

The full implementation plan lives in root `docs/` next to the Phase 1 and Phase 2 product docs because it is durable project memory. This pointer keeps the `docs/superpowers/plans/` index aligned with the Superpowers workflow without duplicating the plan content.

## Execution Rule

When implementing Phase 3, open and execute the canonical root plan. If the implementation plan changes, update the root plan first and keep this pointer as a stable index entry.
