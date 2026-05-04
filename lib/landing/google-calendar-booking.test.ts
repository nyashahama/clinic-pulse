import { describe, expect, it, vi } from "vitest";

import {
  buildGoogleCalendarEvent,
  createGoogleCalendarBooking,
  parseBookingRequestBody,
  parseGoogleCalendarBookingResponse,
  resolveBookingDateTime,
} from "@/lib/landing/google-calendar-booking";

const lead = {
  name: "Nyasha Hama",
  workEmail: "nyasha@example.com",
  organization: "Clinic Pulse",
  role: "Founder",
  interest: "clinic_operator" as const,
  note: "Focus on district rollout.",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("Google Calendar booking helpers", () => {
  it("resolves the selected landing slot into Calendar date-time fields", () => {
    expect(resolveBookingDateTime({ day: 4, time: "10:30", duration: 45 })).toEqual({
      endDateTime: "2026-05-04T11:15:00",
      startDateTime: "2026-05-04T10:30:00",
      timeZone: "Africa/Johannesburg",
    });
  });

  it("builds a Google Calendar event that requests a Meet link and invites the lead", () => {
    const event = buildGoogleCalendarEvent(
      {
        lead,
        slot: { day: 4, time: "10:30", duration: 30 },
      },
      "request-123",
    );

    expect(event.summary).toBe("Clinic Pulse demo with Nyasha Hama");
    expect(event.attendees).toEqual([
      { displayName: "Nyasha Hama", email: "nyasha@example.com" },
    ]);
    expect(event.start).toEqual({
      dateTime: "2026-05-04T10:30:00",
      timeZone: "Africa/Johannesburg",
    });
    expect(event.end).toEqual({
      dateTime: "2026-05-04T11:00:00",
      timeZone: "Africa/Johannesburg",
    });
    expect(event.conferenceData).toEqual({
      createRequest: {
        conferenceSolutionKey: { type: "hangoutsMeet" },
        requestId: "request-123",
      },
    });
    expect(event.description).toContain("Organization: Clinic Pulse");
    expect(event.extendedProperties?.private).toMatchObject({
      bookingSource: "clinicpulse-landing",
      interest: "clinic_operator",
    });
  });

  it("parses the Meet URL from Calendar conference entry points", () => {
    expect(
      parseGoogleCalendarBookingResponse({
        id: "event-123",
        htmlLink: "https://calendar.google.com/event?eid=event-123",
        hangoutLink: "https://meet.google.com/fallback",
        conferenceData: {
          entryPoints: [
            { entryPointType: "phone", uri: "tel:+1000000000" },
            { entryPointType: "video", uri: "https://meet.google.com/abc-defg-hij" },
          ],
        },
      }),
    ).toEqual({
      calendarEventId: "event-123",
      calendarUrl: "https://calendar.google.com/event?eid=event-123",
      meetUrl: "https://meet.google.com/abc-defg-hij",
    });
  });

  it("validates booking request bodies before the API calls Google", () => {
    const parsed = parseBookingRequestBody({
      lead,
      slot: { day: 4, time: "10:30", duration: 30 },
    });

    expect(parsed.ok).toBe(true);

    expect(
      parseBookingRequestBody({
        lead: { ...lead, workEmail: "not-an-email" },
        slot: { day: 4, time: "10:30", duration: 30 },
      }),
    ).toEqual({
      error: "A valid work email is required.",
      ok: false,
    });
  });

  it("refreshes OAuth and asks Calendar to create a Meet-backed event", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);

      if (url === "https://oauth2.googleapis.com/token") {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBeInstanceOf(URLSearchParams);
        expect(String(init?.body)).toContain("refresh_token=refresh-token");

        return jsonResponse({ access_token: "access-token" });
      }

      if (
        url ===
        "https://www.googleapis.com/calendar/v3/calendars/nyashahama45%40gmail.com/events?conferenceDataVersion=1&sendUpdates=all"
      ) {
        expect(init?.method).toBe("POST");
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer access-token");

        const event = JSON.parse(String(init?.body)) as ReturnType<typeof buildGoogleCalendarEvent>;
        expect(event.attendees).toEqual([
          { displayName: "Nyasha Hama", email: "nyasha@example.com" },
        ]);
        expect(event.conferenceData.createRequest.conferenceSolutionKey.type).toBe("hangoutsMeet");
        expect(event.conferenceData.createRequest.requestId).toEqual(expect.any(String));

        return jsonResponse({
          id: "event-123",
          htmlLink: "https://calendar.google.com/event?eid=event-123",
          conferenceData: {
            entryPoints: [
              { entryPointType: "video", uri: "https://meet.google.com/abc-defg-hij" },
            ],
          },
        });
      }

      throw new Error(`Unexpected fetch URL ${url}`);
    });

    await expect(
      createGoogleCalendarBooking(
        {
          lead,
          slot: { day: 4, time: "10:30", duration: 30 },
        },
        {
          calendarId: "nyashahama45@gmail.com",
          clientId: "client-id",
          clientSecret: "client-secret",
          refreshToken: "refresh-token",
        },
        fetchImpl,
      ),
    ).resolves.toEqual({
      calendarEventId: "event-123",
      calendarUrl: "https://calendar.google.com/event?eid=event-123",
      meetUrl: "https://meet.google.com/abc-defg-hij",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
