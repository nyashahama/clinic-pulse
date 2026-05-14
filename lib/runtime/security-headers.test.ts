import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "./security-headers";

describe("security headers", () => {
  it("builds required browser security headers", () => {
    const headers = buildSecurityHeaders({ deployEnv: "production" });
    const headerMap = new Map(
      headers.map((header) => [header.key, header.value]),
    );

    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headerMap.get("Permissions-Policy")).toContain("camera=()");
    expect(headerMap.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
    expect(headerMap.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  it("keeps local development compatible with Next dev assets", () => {
    const csp = new Map(
      buildSecurityHeaders({ deployEnv: "local" }).map((header) => [
        header.key,
        header.value,
      ]),
    ).get("Content-Security-Policy");

    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });
});
