#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://localhost:8080";
const MAX_REQUEST_TIMEOUT_MS = 30000;
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.CLINICPULSE_SMOKE_TIMEOUT_MS ?? "5000", 10);
const baseUrl = normalizeBaseUrl(process.env.CLINICPULSE_API_BASE_URL ?? DEFAULT_BASE_URL);
const email = process.env.CLINICPULSE_SMOKE_EMAIL;
const password = process.env.CLINICPULSE_SMOKE_PASSWORD;

const cookieJar = new Map();
let authHeader;
let failures = 0;

const requiredPublicChecks = [
  { method: "GET", path: "/healthz" },
  { method: "GET", path: "/readyz" },
  { method: "GET", path: "/v1/public/clinics" },
];

for (const check of requiredPublicChecks) {
  const result = await request(check.method, check.path);
  printResult(check.method, check.path, result);
  if (!result.ok) failures += 1;
}

if (email && password) {
  const loginResult = await request("POST", "/v1/auth/login", {
    body: JSON.stringify({ email, password }),
    headers: { "content-type": "application/json" },
  });
  captureAuth(loginResult);
  printResult("POST", "/v1/auth/login", loginResult);

  if (!loginResult.ok) {
    failures += 1;
  } else {
    const meResult = await request("GET", "/v1/auth/me", authOptions());
    printResult("GET", "/v1/auth/me", meResult);
    if (!meResult.ok) failures += 1;

    const role = resolveRole(meResult.body ?? loginResult.body);

    for (const check of [
      { method: "GET", path: "/v1/reports/pending" },
      { method: "GET", path: "/v1/sync/summary" },
    ]) {
      const result = await request(check.method, check.path, authOptions());
      printResult(check.method, check.path, result);
      if (!result.ok) failures += 1;
    }

    if (role === "org_admin" || role === "system_admin") {
      const adminResult = await request("GET", "/v1/admin/partner-readiness", authOptions());
      printResult("GET", "/v1/admin/partner-readiness", adminResult);
      if (!adminResult.ok) failures += 1;
    } else {
      printSkip("GET", "/v1/admin/partner-readiness", `role=${role ?? "unknown"}`);
    }
  }
} else {
  printSkip("POST", "/v1/auth/login", "CLINICPULSE_SMOKE_EMAIL and CLINICPULSE_SMOKE_PASSWORD not set");
}

process.exitCode = failures > 0 ? 1 : 0;

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function buildUrl(path) {
  return new URL(path, `${baseUrl}/`).toString();
}

function authOptions() {
  const headers = {};
  const cookieHeader = serializeCookies();
  if (cookieHeader) headers.cookie = cookieHeader;
  if (authHeader) headers.authorization = authHeader;
  return { headers };
}

async function request(method, path, options = {}) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), saneTimeoutMs());

  try {
    const headers = new Headers(options.headers ?? {});
    const response = await fetch(buildUrl(path), {
      body: options.body,
      headers,
      method,
      signal: controller.signal,
    });
    const durationMs = Math.round(performance.now() - startedAt);
    captureCookies(response.headers);

    return {
      body: await readJson(response),
      durationMs,
      ok: response.ok,
      requestId: response.headers.get("x-request-id"),
      status: response.status,
    };
  } catch (error) {
    return {
      durationMs: Math.round(performance.now() - startedAt),
      error: error?.name === "AbortError" ? "timeout" : "request_error",
      ok: false,
      requestId: null,
      status: "FAIL",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function saneTimeoutMs() {
  return Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0
    ? Math.min(REQUEST_TIMEOUT_MS, MAX_REQUEST_TIMEOUT_MS)
    : 5000;
}

async function readJson(response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined;

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function captureCookies(headers) {
  const setCookies = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : splitSetCookie(headers.get("set-cookie"));

  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(";");
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    cookieJar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }
}

function splitSetCookie(value) {
  if (!value) return [];
  return value.split(/,(?=\s*[^;,\s]+=)/g).map((entry) => entry.trim()).filter(Boolean);
}

function serializeCookies() {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function captureAuth(result) {
  const token = result.body?.accessToken ?? result.body?.token ?? result.body?.sessionToken;
  if (typeof token === "string" && token.length > 0) {
    authHeader = `Bearer ${token}`;
  }
}

function resolveRole(body) {
  if (!body || typeof body !== "object") return undefined;

  const directRole = body.role ?? body.activeMembership?.role;
  if (typeof directRole === "string") return directRole;

  if (Array.isArray(body.memberships)) {
    const ranks = new Map([
      ["system_admin", 4],
      ["org_admin", 3],
      ["district_manager", 2],
      ["reporter", 1],
    ]);
    return body.memberships
      .map((membership) => membership?.role)
      .filter((role) => typeof role === "string")
      .sort((left, right) => (ranks.get(right) ?? 0) - (ranks.get(left) ?? 0))[0];
  }

  return undefined;
}

function printResult(method, path, result) {
  const status = result.status ?? "FAIL";
  const requestId = result.requestId ? `request-id=${result.requestId}` : "request-id=-";
  const suffix = result.ok ? "" : ` error=${result.error ?? "http_error"}`;
  console.log(`${method} ${path} ${status} ${result.durationMs}ms ${requestId}${suffix}`);
}

function printSkip(method, path, reason) {
  console.log(`${method} ${path} SKIP 0ms request-id=- reason=${reason}`);
}
