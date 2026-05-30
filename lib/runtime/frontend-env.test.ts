import { describe, expect, it } from "vitest";

import { validateFrontendRuntimeEnv } from "@/lib/runtime/frontend-env";

describe("validateFrontendRuntimeEnv", () => {
  it("allows local defaults", () => {
    expect(validateFrontendRuntimeEnv({})).toEqual({
      deployEnv: "local",
      apiBaseUrl: "http://localhost:8080",
      browserApiBaseUrl: "/api/clinicpulse",
      showSeedCredentials: true,
      allowPublicRegistration: false,
    });
  });

  it("accepts safe staging runtime configuration", () => {
    expect(
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }),
    ).toEqual({
      deployEnv: "staging",
      apiBaseUrl: "https://api.staging.clinicpulse.example",
      browserApiBaseUrl: "/api/clinicpulse",
      showSeedCredentials: false,
      allowPublicRegistration: false,
    });
  });

  it("rejects unsafe staging runtime configuration with all relevant env vars", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "http://localhost:8080",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "true",
      }),
    ).toThrowError(
      /CLINICPULSE_API_BASE_URL[\s\S]*NEXT_PUBLIC_CLINICPULSE_API_BASE_URL[\s\S]*CLINICPULSE_ALLOW_SEEDED_FALLBACK/,
    );
  });

  it("rejects staging runtime configuration without an explicit browser API base URL", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }),
    ).toThrowError(/NEXT_PUBLIC_CLINICPULSE_API_BASE_URL/);
  });

  it("rejects staging runtime configuration without an explicit seeded fallback opt-out", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.staging.clinicpulse.example",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
      }),
    ).toThrowError(/CLINICPULSE_ALLOW_SEEDED_FALLBACK/);
  });

  it("rejects malformed staging API base URLs", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }),
    ).toThrowError(/CLINICPULSE_API_BASE_URL/);
  });

  it("shows local seed credentials only in local deployments", () => {
    expect(
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "local",
      }).showSeedCredentials,
    ).toBe(true);

    expect(
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "local",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }).showSeedCredentials,
    ).toBe(false);

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
    expect(
      validateFrontendRuntimeEnv({ CLINICPULSE_DEPLOY_ENV: "local" })
        .allowPublicRegistration,
    ).toBe(false);

    expect(
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "production",
        CLINICPULSE_API_BASE_URL: "https://api.clinicpulse.example",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
      }).allowPublicRegistration,
    ).toBe(false);
  });

  it("rejects public registration outside local deployments", () => {
    expect(() =>
      validateFrontendRuntimeEnv({
        CLINICPULSE_DEPLOY_ENV: "staging",
        CLINICPULSE_API_BASE_URL: "https://api.clinicpulse.test",
        NEXT_PUBLIC_CLINICPULSE_API_BASE_URL: "/api/clinicpulse",
        CLINICPULSE_ALLOW_SEEDED_FALLBACK: "false",
        CLINICPULSE_ALLOW_PUBLIC_REGISTRATION: "true",
      }),
    ).toThrowError(/CLINICPULSE_ALLOW_PUBLIC_REGISTRATION/);
  });
});
