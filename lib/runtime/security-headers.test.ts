import { describe, expect, it } from "vitest";

import { buildSecurityHeaders } from "./security-headers";

type DeployEnv = "local" | "staging" | "production";

function headerMapFor(deployEnv: DeployEnv) {
  return new Map(
    buildSecurityHeaders({ deployEnv }).map((header) => [
      header.key,
      header.value,
    ]),
  );
}

function cspDirectivesFor(deployEnv: DeployEnv) {
  const csp = headerMapFor(deployEnv).get("Content-Security-Policy");

  if (!csp) {
    throw new Error("Missing Content-Security-Policy header.");
  }

  return new Map(
    csp.split("; ").map((directive) => {
      const [name, ...value] = directive.split(" ");

      return [name, value.join(" ")];
    }),
  );
}

describe("security headers", () => {
  it("builds required browser security headers", () => {
    const headerMap = headerMapFor("production");

    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headerMap.get("Permissions-Policy")).toContain("camera=()");
    expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    expect(headerMap.get("Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
    expect(headerMap.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  it("locks production script and network CSP directives to self-hosted assets", () => {
    const directives = cspDirectivesFor("production");
    const scriptSrc = directives.get("script-src");

    expect(scriptSrc).toBe("'self' 'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain("https:");
    expect(scriptSrc).not.toContain("http:");
    expect(scriptSrc).not.toContain("*");
    expect(directives.get("connect-src")).toBe("'self'");
  });

  it.each(["production", "staging"] as const)(
    "keeps %s API connections self-hosted",
    (deployEnv) => {
      expect(cspDirectivesFor(deployEnv).get("connect-src")).toBe("'self'");
    },
  );

  it("keeps local development compatible with Next dev assets", () => {
    const csp = headerMapFor("local").get("Content-Security-Policy");

    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });
});
