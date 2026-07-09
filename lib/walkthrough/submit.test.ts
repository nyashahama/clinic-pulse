import { describe, expect, it, vi } from "vitest";

import { submitWalkthroughRequest, validateWalkthroughInput } from "./submit";

const validBody = {
  name: "Thabo",
  work_email: "thabo@gov.za",
  organization: "Tshwane",
  role: "Lead",
  interest: "government",
  note: "pilot",
  requested_date: "2030-07-27",
  requested_time: "10:30",
  duration_minutes: 30,
};

describe("validateWalkthroughInput", () => {
  it("accepts a valid body", () => {
    expect(validateWalkthroughInput(validBody).ok).toBe(true);
  });
  it("rejects bad email and duration", () => {
    const r = validateWalkthroughInput({ ...validBody, work_email: "bad", duration_minutes: 99 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fields).toEqual(expect.arrayContaining(["work_email", "duration_minutes"]));
  });
});

describe("submitWalkthroughRequest", () => {
  it("traps honeypot as success without calling upstream", async () => {
    const fetchImpl = vi.fn();
    const sendEmail = vi.fn();
    const res = await submitWalkthroughRequest({ ...validBody, company: "spam" } as any, { fetchImpl: fetchImpl as any, sendEmail, env: {} });
    expect(res.status).toBe(201);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("persists and sends two emails on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    const sendEmail = vi.fn().mockResolvedValue({});
    const res = await submitWalkthroughRequest(validBody as any, {
      fetchImpl: fetchImpl as any,
      sendEmail,
      env: { CLINICPULSE_API_BASE_URL: "http://api", WALKTHROUGH_NOTIFY_EMAIL: "founder@x.com", WALKTHROUGH_FROM_EMAIL: "cp <a@b.com>" },
    });
    expect(res.status).toBe(201);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("returns 400 on invalid input", async () => {
    const res = await submitWalkthroughRequest({ ...validBody, work_email: "bad" } as any, { fetchImpl: vi.fn() as any, sendEmail: vi.fn(), env: {} });
    expect(res.status).toBe(400);
  });

  it("returns 502 when upstream fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false });
    const res = await submitWalkthroughRequest(validBody as any, { fetchImpl: fetchImpl as any, sendEmail: vi.fn(), env: { CLINICPULSE_API_BASE_URL: "http://api" } });
    expect(res.status).toBe(502);
  });
});
