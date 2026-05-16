#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://localhost:8080";
const MAX_DURATION_SECONDS = 300;
const MAX_CONCURRENCY = 64;
const MAX_REQUEST_TIMEOUT_MS = 30000;
const baseUrl = normalizeBaseUrl(process.env.CLINICPULSE_LOAD_BASE_URL ?? DEFAULT_BASE_URL);
const durationSeconds = positiveNumber(process.env.CLINICPULSE_LOAD_DURATION_SECONDS, 30, MAX_DURATION_SECONDS);
const concurrency = Math.max(1, Math.floor(positiveNumber(process.env.CLINICPULSE_LOAD_CONCURRENCY, 4, MAX_CONCURRENCY)));
const p95ThresholdMs = positiveNumber(process.env.CLINICPULSE_LOAD_P95_MS, 1000);
const failureRateThreshold = nonNegativeNumber(process.env.CLINICPULSE_LOAD_FAILURE_RATE, 0.01);
const requestTimeoutMs = positiveNumber(process.env.CLINICPULSE_LOAD_TIMEOUT_MS, 5000, MAX_REQUEST_TIMEOUT_MS);

const endpoints = [
  "/healthz",
  "/readyz",
  "/v1/public/clinics",
  "/v1/public/alternatives?clinicId=clinic-mamelodi-east&service=Primary%20care",
];

const deadline = Date.now() + durationSeconds * 1000;
const durations = [];
let total = 0;
let failures = 0;
let cursor = 0;

await Promise.all(Array.from({ length: concurrency }, () => worker()));

const sortedDurations = durations.toSorted((left, right) => left - right);
const p50 = percentile(sortedDurations, 0.5);
const p95 = percentile(sortedDurations, 0.95);
const max = sortedDurations.at(-1) ?? 0;
const failureRate = total === 0 ? 1 : failures / total;

console.log(`total=${total} failures=${failures} failureRate=${failureRate.toFixed(4)} p50=${p50}ms p95=${p95}ms max=${max}ms`);

if (failureRate > failureRateThreshold) {
  console.error(`FAIL failureRate ${failureRate.toFixed(4)} > ${failureRateThreshold}`);
  process.exitCode = 1;
}

if (p95 > p95ThresholdMs) {
  console.error(`FAIL p95 ${p95}ms > ${p95ThresholdMs}ms`);
  process.exitCode = 1;
}

async function worker() {
  while (Date.now() < deadline) {
    const path = endpoints[cursor % endpoints.length];
    cursor += 1;
    const result = await request(path);
    total += 1;
    durations.push(result.durationMs);
    if (!result.ok) failures += 1;
  }
}

async function request(path) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(new URL(path, `${baseUrl}/`).toString(), {
      method: "GET",
      signal: controller.signal,
    });
    return {
      durationMs: Math.round(performance.now() - startedAt),
      ok: response.ok,
    };
  } catch {
    return {
      durationMs: Math.round(performance.now() - startedAt),
      ok: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function positiveNumber(value, fallback, max = Number.POSITIVE_INFINITY) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function nonNegativeNumber(value, fallback) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function percentile(sortedValues, rank) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.ceil(sortedValues.length * rank) - 1);
  return sortedValues[index];
}
