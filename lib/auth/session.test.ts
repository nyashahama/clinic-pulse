import { describe, expect, it, vi } from "vitest";

import {
  type AuthApiFetch,
  type AuthLoginResponse,
  type AuthRole,
  login,
  logout,
  me,
} from "@/lib/auth/api";
import {
  ADMIN_WORKFLOW_ROLES,
  DISTRICT_WORKFLOW_ROLES,
  FIELD_WORKFLOW_ROLES,
  type AuthSession,
  getWorkflowInsufficientRoleRedirectPath,
  requireWorkflowRole,
  requireRole,
  toAuthSession,
  toClientAuthSession,
} from "@/lib/auth/session";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

function authUser() {
  return {
    id: 42,
    email: "manager@example.test",
    displayName: "District Manager",
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
  };
}

function membership(
  role: AuthRole,
  overrides: Partial<AuthLoginResponse["memberships"][number]> = {},
) {
  return {
    id: overrides.id ?? 7,
    organisationId: overrides.organisationId ?? 3,
    userId: 42,
    role,
    district: overrides.district,
    createdAt: "2026-05-01T08:00:00.000Z",
    ...overrides,
  };
}

function authSession(role: AuthRole): AuthSession {
  const response = {
    user: authUser(),
    session: {
      id: 100,
      userId: 42,
      createdAt: "2026-05-01T08:00:00.000Z",
      expiresAt: "2026-05-08T08:00:00.000Z",
    },
    memberships: [membership(role)],
  };

  const session = toAuthSession(response);
  if (!session) {
    throw new Error("expected test session to resolve");
  }

  return session;
}

describe("auth API client", () => {
  it("login calls the backend login endpoint with credentials", async () => {
    const fetchImpl = vi.fn<AuthApiFetch>().mockResolvedValue(
      jsonResponse({
        user: authUser(),
        memberships: [membership("district_manager")],
      }),
    );

    await login("manager@example.test", "correct-password", {
      baseUrl: "https://api.example.test/root/",
      fetch: fetchImpl,
    });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.example.test/root/v1/auth/login");
    expect(init).toMatchObject({
      body: JSON.stringify({
        email: "manager@example.test",
        password: "correct-password",
      }),
      method: "POST",
    });
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
  });

  it("me calls the backend current-session endpoint with forwarded cookies", async () => {
    const fetchImpl = vi.fn<AuthApiFetch>().mockResolvedValue(
      jsonResponse({
        user: authUser(),
        session: {
          id: 100,
          userId: 42,
          createdAt: "2026-05-01T08:00:00.000Z",
          expiresAt: "2026-05-08T08:00:00.000Z",
        },
        memberships: [membership("district_manager")],
      }),
    );

    await me({
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
      init: {
        headers: {
          cookie: "clinicpulse_session=session-token",
        },
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/v1/auth/me",
      expect.objectContaining({
        method: "GET",
      }),
    );
    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("cookie")).toBe("clinicpulse_session=session-token");
    expect(headers.get("x-request-id")).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(headers.get("traceparent")).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it("preserves explicit observability headers for auth API calls", async () => {
    const fetchImpl = vi.fn<AuthApiFetch>().mockResolvedValue(
      jsonResponse({
        user: authUser(),
        memberships: [membership("district_manager")],
      }),
    );

    await login("manager@example.test", "correct-password", {
      baseUrl: "https://api.example.test/root/",
      fetch: fetchImpl,
      init: {
        headers: {
          traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
          "x-request-id": "auth-login-req-1",
        },
      },
    });

    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("traceparent")).toBe(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
    );
    expect(headers.get("x-request-id")).toBe("auth-login-req-1");
  });

  it("logout calls the backend logout endpoint", async () => {
    const fetchImpl = vi.fn<AuthApiFetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await logout({
      baseUrl: "https://api.example.test",
      fetch: fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.example.test/v1/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("uses the private API base URL by default for server-side auth calls", async () => {
    const previousPrivateBaseUrl = process.env.CLINICPULSE_API_BASE_URL;
    const previousPublicBaseUrl = process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
    process.env.CLINICPULSE_API_BASE_URL = "https://server-api.example.test/root";
    process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = "/api/clinicpulse";
    const fetchImpl = vi.fn<AuthApiFetch>().mockResolvedValue(
      jsonResponse({
        user: authUser(),
        session: {
          id: 100,
          userId: 42,
          createdAt: "2026-05-01T08:00:00.000Z",
          expiresAt: "2026-05-08T08:00:00.000Z",
        },
        memberships: [membership("district_manager")],
      }),
    );

    try {
      await me({ fetch: fetchImpl });
    } finally {
      if (previousPrivateBaseUrl === undefined) {
        delete process.env.CLINICPULSE_API_BASE_URL;
      } else {
        process.env.CLINICPULSE_API_BASE_URL = previousPrivateBaseUrl;
      }
      if (previousPublicBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = previousPublicBaseUrl;
      }
    }

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://server-api.example.test/root/v1/auth/me",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("supports relative public API base URLs for browser auth calls with observability headers", async () => {
    const previousBaseUrl = process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
    process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = "/api/clinicpulse";
    vi.stubGlobal("window", {});
    const fetchImpl = vi.fn<AuthApiFetch>().mockResolvedValue(
      jsonResponse({
        user: authUser(),
        session: {
          id: 100,
          userId: 42,
          createdAt: "2026-05-01T08:00:00.000Z",
          expiresAt: "2026-05-08T08:00:00.000Z",
        },
        memberships: [membership("district_manager")],
      }),
    );

    try {
      await me({ fetch: fetchImpl });
    } finally {
      vi.unstubAllGlobals();
      if (previousBaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL = previousBaseUrl;
      }
    }

    expect(fetchImpl.mock.calls[0][0]).toBe("/api/clinicpulse/v1/auth/me");
    const headers = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    expect(headers.get("x-request-id")).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(headers.get("traceparent")).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });
});

describe("auth session role guard", () => {
  it("uses the highest ranked membership as the active role", () => {
    const session = toAuthSession({
      user: authUser(),
      memberships: [
        membership("reporter", { id: 30 }),
        membership("district_manager", { id: 20 }),
        membership("system_admin", {
          id: 10,
          district: undefined,
          organisationId: undefined,
        }),
      ],
    });

    expect(session?.role).toBe("system_admin");
  });

  it("allows sessions whose active role is included", () => {
    const session = authSession("district_manager");

    expect(requireRole(session, ["district_manager", "org_admin"])).toBe(session);
  });

  it("rejects missing sessions and sessions without an allowed role", () => {
    const session = authSession("reporter");

    expect(() => requireRole(null, ["reporter"])).toThrow("Authentication required");
    expect(() => requireRole(session, ["district_manager", "org_admin"])).toThrow(
      "Insufficient role",
    );
  });

  it("creates a client-safe session DTO with district context and without raw metadata", () => {
    const session = authSession("org_admin");

    expect(toClientAuthSession(session)).toEqual({
      displayName: "District Manager",
      district: undefined,
      email: "manager@example.test",
      name: "District Manager",
      organisationId: 3,
      organisationName: undefined,
      role: "org_admin",
      userId: 42,
    });
  });
});

describe("auth workflow role guards", () => {
  it("allows reporter access to the field workflow", () => {
    const session = authSession("reporter");

    expect(FIELD_WORKFLOW_ROLES).toEqual([
      "reporter",
      "org_admin",
      "system_admin",
    ]);
    expect(requireWorkflowRole(session, "field")).toBe(session);
  });

  it("keeps district managers in district command workflows", () => {
    const session = authSession("district_manager");

    expect(DISTRICT_WORKFLOW_ROLES).toEqual([
      "district_manager",
      "org_admin",
      "system_admin",
    ]);
    expect(() => requireWorkflowRole(session, "field")).toThrow("Insufficient role");
    expect(requireWorkflowRole(session, "district")).toBe(session);
    expect(requireWorkflowRole(session, "demo")).toBe(session);
  });

  it("rejects reporter access to the admin workflow", () => {
    const session = authSession("reporter");

    expect(ADMIN_WORKFLOW_ROLES).toEqual(["org_admin", "system_admin"]);
    expect(() => requireWorkflowRole(session, "admin")).toThrow("Insufficient role");
  });

  it("allows org admin access to the admin workflow", () => {
    const session = authSession("org_admin");

    expect(requireWorkflowRole(session, "admin")).toBe(session);
  });

  it("uses stable fallback destinations for insufficient workflow roles", () => {
    expect(getWorkflowInsufficientRoleRedirectPath("field")).toBe("/district");
    expect(getWorkflowInsufficientRoleRedirectPath("district")).toBe("/field");
    expect(getWorkflowInsufficientRoleRedirectPath("demo")).toBe("/field");
    expect(getWorkflowInsufficientRoleRedirectPath("admin")).toBe("/district");
  });
});
