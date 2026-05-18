import { describe, expect, it } from "vitest";

import {
  createRequestId,
  createTraceparent,
  safeRequestId,
  safeTraceparent,
  withObservabilityHeaders,
} from "@/lib/observability/request-context";

const safeParent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

describe("request context observability headers", () => {
  it("preserves safe request IDs", () => {
    expect(safeRequestId("req_01HWCP7Y6K8H0S6GEA8QH0D7A9")).toBe(
      "req_01HWCP7Y6K8H0S6GEA8QH0D7A9",
    );
    expect(safeRequestId("  req-abc.123_edge  ")).toBe("req-abc.123_edge");
  });

  it("rejects unsafe request IDs so callers can replace them", () => {
    expect(safeRequestId(null)).toBeNull();
    expect(safeRequestId("")).toBeNull();
    expect(safeRequestId("short")).toBeNull();
    expect(safeRequestId("req-abc.123:edge")).toBeNull();
    expect(safeRequestId("manager@example.test")).toBeNull();
    expect(safeRequestId("/api/clinicpulse/v1/auth/me")).toBeNull();
    expect(safeRequestId("req-1\r\nx-forwarded-for: 127.0.0.1")).toBeNull();
    expect(safeRequestId("x".repeat(129))).toBeNull();
  });

  it("creates request IDs without user, path, or payload data", () => {
    const requestId = createRequestId();

    expect(safeRequestId(requestId)).toBe(requestId);
    expect(requestId).not.toContain("@");
    expect(requestId).not.toContain("/");
    expect(requestId).not.toContain("{");
  });

  it("preserves valid traceparent values and rejects malformed values", () => {
    expect(safeTraceparent(safeParent)).toBe(safeParent);
    expect(safeTraceparent(safeParent.toUpperCase())).toBe(safeParent);
    expect(safeTraceparent(null)).toBeNull();
    expect(safeTraceparent("00-00000000000000000000000000000000-00f067aa0ba902b7-01")).toBeNull();
    expect(safeTraceparent("00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01")).toBeNull();
    expect(safeTraceparent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-deadbeef")).toBeNull();
    expect(safeTraceparent("manager@example.test")).toBeNull();
  });

  it("creates valid traceparent values", () => {
    expect(safeTraceparent(createTraceparent())).toMatch(
      /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/,
    );
  });

  it("merges headers, preserves safe observability values, and replaces unsafe ones", () => {
    const headers = withObservabilityHeaders({
      authorization: "Bearer token",
      traceparent: safeParent,
      "x-request-id": "/api/clinicpulse/v1/reports",
    });

    expect(headers.get("authorization")).toBe("Bearer token");
    expect(headers.get("traceparent")).toBe(safeParent);
    expect(headers.get("x-request-id")).not.toBe("/api/clinicpulse/v1/reports");
    expect(safeRequestId(headers.get("x-request-id"))).toBe(headers.get("x-request-id"));
  });

  it("replaces traceparent values that include extra segments", () => {
    const headers = withObservabilityHeaders({
      traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-deadbeef",
      "x-request-id": "safe-request-id",
    });

    expect(headers.get("traceparent")).not.toBe(
      "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01-deadbeef",
    );
    expect(safeTraceparent(headers.get("traceparent"))).toBe(headers.get("traceparent"));
    expect(headers.get("x-request-id")).toBe("safe-request-id");
  });

  it("generates missing observability headers", () => {
    const headers = withObservabilityHeaders();

    expect(safeRequestId(headers.get("x-request-id"))).toBe(headers.get("x-request-id"));
    expect(safeTraceparent(headers.get("traceparent"))).toBe(headers.get("traceparent"));
  });
});
