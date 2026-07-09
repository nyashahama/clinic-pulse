export type WalkthroughInput = {
  name?: unknown;
  work_email?: unknown;
  organization?: unknown;
  role?: unknown;
  interest?: unknown;
  note?: unknown;
  requested_date?: unknown;
  requested_time?: unknown;
  duration_minutes?: unknown;
  company?: unknown;
};

const INTERESTS = new Set(["clinic_operator", "government", "ngo", "investor", "other"]);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SubmitResult = { status: number; body: unknown };

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export function validateWalkthroughInput(body: WalkthroughInput):
  | { ok: true; value: { name: string; workEmail: string; organization: string; role: string; interest: string; note: string; requestedDate: string; requestedTime: string; durationMinutes: number } }
  | { ok: false; fields: string[] } {
  const fields: string[] = [];
  const name = String(body.name ?? "").trim();
  const workEmail = String(body.work_email ?? "").trim();
  const organization = String(body.organization ?? "").trim();
  const role = String(body.role ?? "").trim();
  const interest = String(body.interest ?? "");
  const note = String(body.note ?? "").trim();
  const requestedDate = String(body.requested_date ?? "");
  const requestedTime = String(body.requested_time ?? "");
  const durationMinutes = Number(body.duration_minutes);

  if (!name) fields.push("name");
  if (!EMAIL_RE.test(workEmail)) fields.push("work_email");
  if (!organization) fields.push("organization");
  if (!role) fields.push("role");
  if (!INTERESTS.has(interest)) fields.push("interest");
  if (!DATE_RE.test(requestedDate)) fields.push("requested_date");
  if (!TIME_RE.test(requestedTime)) fields.push("requested_time");
  if (durationMinutes !== 30 && durationMinutes !== 45) fields.push("duration_minutes");

  if (fields.length) return { ok: false, fields };
  return { ok: true, value: { name, workEmail, organization, role, interest, note, requestedDate, requestedTime, durationMinutes } };
}

export async function submitWalkthroughRequest(
  body: WalkthroughInput,
  opts: {
    fetchImpl: typeof fetch;
    sendEmail: (msg: EmailMessage) => Promise<unknown>;
    env: Record<string, string | undefined>;
  },
): Promise<SubmitResult> {
  if (typeof body.company === "string" && body.company.length > 0) {
    return { status: 201, body: { ok: true } };
  }

  const validated = validateWalkthroughInput(body);
  if (!validated.ok) {
    return { status: 400, body: { error: { code: "validation_error", message: "validation failed", fields: validated.fields } } };
  }
  const v = validated.value;

  const baseUrl = opts.env.CLINICPULSE_API_BASE_URL || "http://localhost:8080";
  try {
    const upstream = await opts.fetchImpl(`${baseUrl}/v1/public/walkthrough-requests`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-ClinicPulse-Server-Mutation": "1" },
      body: JSON.stringify({
        name: v.name,
        work_email: v.workEmail,
        organization: v.organization,
        role: v.role,
        interest: v.interest,
        note: v.note,
        requested_date: v.requestedDate,
        requested_time: v.requestedTime,
        duration_minutes: v.durationMinutes,
      }),
    });
    if (!upstream.ok) {
      return { status: 502, body: { error: { code: "upstream_error", message: "could not save request" } } };
    }
  } catch {
    return { status: 502, body: { error: { code: "upstream_error", message: "could not save request" } } };
  }

  const from = opts.env.WALKTHROUGH_FROM_EMAIL || "Clinic Pulse <onboarding@resend.dev>";
  const notifyTo = opts.env.WALKTHROUGH_NOTIFY_EMAIL || "";
  try {
    if (notifyTo) {
      await opts.sendEmail({
        from,
        to: notifyTo,
        subject: `New walkthrough request from ${v.name} (${v.organization})`,
        text: `New walkthrough request\n\nName: ${v.name}\nEmail: ${v.workEmail}\nOrganization: ${v.organization}\nRole: ${v.role}\nFocus: ${v.interest}\nPreferred: ${v.requestedDate} at ${v.requestedTime} (${v.durationMinutes}m)\n\nNotes:\n${v.note}`,
      });
    }
    await opts.sendEmail({
      from,
      to: v.workEmail,
      subject: "Your Clinic Pulse walkthrough request",
      text: `Hi ${v.name},\n\nThanks for requesting a Clinic Pulse operations walkthrough. We'll confirm your preferred slot (${v.requestedDate} at ${v.requestedTime}, ${v.durationMinutes} minutes) by email with a Google Meet link.\n\n— The Clinic Pulse team`,
    });
  } catch {
    // email is best-effort; the request is already persisted
  }

  return { status: 201, body: { ok: true } };
}
