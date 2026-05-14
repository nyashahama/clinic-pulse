import { describe, expect, it } from "vitest";

import { validateFrontendRuntimeEnv } from "@/lib/runtime/frontend-env";

describe("validateFrontendRuntimeEnv", () => {
  it("allows local defaults", () => {
    expect(validateFrontendRuntimeEnv({})).toEqual({
      deployEnv: "local",
      apiBaseUrl: "http://localhost:8080",
      browserApiBaseUrl: "/api/clinicpulse",
    });
  });

  it("accepts safe staging runtime configuration", () => {
    expect(
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_DEMO_FALLBACK: "false",
      }),
    ).toEqual({
      deployEnv: "staging",
      apiBaseUrl: "https://api.staging.clinicpulse.example",
      browserApiBaseUrl: "/api/clinicpulse",
    });
  });

  it("rejects unsafe staging runtime configuration with all relevant env vars", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "http://localhost:8080",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        CLINICPULSE_ALLOW_DEMO_FALLBACK: "true",
      }),
    ).toThrowError(
      /CLINICPULSE_API_BASE_URL[\s\S]*NEXT_PUBLIC_CLINICPULSE_API_BASE_URL[\s\S]*CLINICPULSE_ALLOW_DEMO_FALLBACK/,
    );
  });

  it("rejects staging runtime configuration without an explicit browser API base URL", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        CLINICPULSE_ALLOW_DEMO_FALLBACK: "false",
      }),
    ).toThrowError(/NEXT_PUBLIC_CLINICPULSE_API_BASE_URL/);
  });

  it("rejects staging runtime configuration without an explicit demo fallback opt-out", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
      }),
    ).toThrowError(/CLINICPULSE_ALLOW_DEMO_FALLBACK/);
  });

  it("rejects malformed staging API base URLs", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_DEMO_FALLBACK: "false",
      }),
    ).toThrowError(/CLINICPULSE_API_BASE_URL/);
  });
});
