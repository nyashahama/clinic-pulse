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
  type AuthSession,
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

  it("creates a client-safe session DTO without session or membership metadata", () => {
    const session = authSession("org_admin");

    expect(toClientAuthSession(session)).toEqual({
      displayName: "District Manager",
      email: "manager@example.test",
      role: "org_admin",
    });
  });
});
