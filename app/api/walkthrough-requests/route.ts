import { NextResponse } from "next/server";
import { Resend } from "resend";

import { submitWalkthroughRequest, type EmailMessage } from "@/lib/walkthrough/submit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: { code: "invalid_json", message: "invalid body" } }, { status: 400 });
  }

  const result = await submitWalkthroughRequest(body as any, {
    fetchImpl: fetch,
    sendEmail: (msg: EmailMessage) => new Resend(process.env.RESEND_API_KEY).emails.send(msg),
    env: process.env,
  });

  return NextResponse.json(result.body, { status: result.status });
}
