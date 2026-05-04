import { NextResponse } from "next/server";

import {
  createGoogleCalendarBooking,
  getGoogleCalendarBookingConfig,
  GoogleCalendarBookingError,
  parseBookingRequestBody,
} from "@/lib/landing/google-calendar-booking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = parseBookingRequestBody(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const config = getGoogleCalendarBookingConfig();

  if (!config) {
    return NextResponse.json(
      {
        error:
          "Google Calendar booking is not configured. Add Google OAuth calendar credentials before accepting bookings.",
      },
      { status: 503 },
    );
  }

  try {
    const booking = await createGoogleCalendarBooking(parsed.input, config);

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Google Calendar booking failed", error);

    if (error instanceof GoogleCalendarBookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Google Calendar booking failed." },
      { status: 502 },
    );
  }
}
