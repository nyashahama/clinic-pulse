import { NextResponse } from "next/server";
import { Resend } from "resend";

import { submitWalkthroughRequest, type EmailMessage, type WalkthroughInput } from "@/lib/walkthrough/submit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: { code: "invalid_json", message: "invalid body" } }, { status: 400 });
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!resend) {
    console.warn("RESEND_API_KEY is not set; walkthrough request emails will not be sent");
  }

  const result = await submitWalkthroughRequest(body as WalkthroughInput, {
    fetchImpl: fetch,
    sendEmail: resend ? (msg: EmailMessage) => resend.emails.send(msg) : async () => ({}),
    env: process.env,
  });

  return NextResponse.json(result.body, { status: result.status });
}
