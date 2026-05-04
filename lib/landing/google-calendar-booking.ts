const BOOKING_YEAR = 2026;
const BOOKING_MONTH = 5;
const BOOKING_TIME_ZONE = "Africa/Johannesburg";
const DEFAULT_CALENDAR_ID = "nyashahama45@gmail.com";

const interestValues = new Set([
  "government",
  "ngo",
  "investor",
  "clinic_operator",
  "other",
]);

export type BookingInterest =
  | "government"
  | "ngo"
  | "investor"
  | "clinic_operator"
  | "other";

export type GoogleCalendarBookingLead = {
  name: string;
  workEmail: string;
  organization: string;
  role: string;
  interest: BookingInterest;
  note: string;
};

export type GoogleCalendarBookingSlot = {
  day: number;
  duration: 30 | 45;
  time: string;
};

export type GoogleCalendarBookingInput = {
  lead: GoogleCalendarBookingLead;
  slot: GoogleCalendarBookingSlot;
};

export type GoogleCalendarBookingResult = {
  calendarEventId: string;
  calendarUrl: string;
  meetUrl: string;
};

export type GoogleCalendarBookingConfig = {
  calendarId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

type GoogleCalendarEvent = {
  attendees: Array<{
    displayName: string;
    email: string;
  }>;
  conferenceData: {
    createRequest: {
      conferenceSolutionKey: {
        type: "hangoutsMeet";
      };
      requestId: string;
    };
  };
  description: string;
  end: {
    dateTime: string;
    timeZone: string;
  };
  extendedProperties?: {
    private: Record<string, string>;
  };
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
  reminders: {
    useDefault: boolean;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  summary: string;
};

type FetchLike = typeof fetch;

export class GoogleCalendarBookingError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "GoogleCalendarBookingError";
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateTime(value: Date) {
  return [
    value.getUTCFullYear(),
    pad(value.getUTCMonth() + 1),
    pad(value.getUTCDate()),
  ].join("-") + `T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:00`;
}

export function resolveBookingDateTime(slot: GoogleCalendarBookingSlot) {
  const [hourText, minuteText] = slot.time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const start = new Date(Date.UTC(BOOKING_YEAR, BOOKING_MONTH - 1, slot.day, hour, minute));
  const end = new Date(start.getTime() + slot.duration * 60 * 1000);

  return {
    endDateTime: formatDateTime(end),
    startDateTime: formatDateTime(start),
    timeZone: BOOKING_TIME_ZONE,
  };
}

export function buildGoogleCalendarEvent(
  input: GoogleCalendarBookingInput,
  requestId: string,
): GoogleCalendarEvent {
  const bookingDateTime = resolveBookingDateTime(input.slot);
  const note = input.lead.note.trim();
  const description = [
    "Clinic Pulse demo booking from the landing page.",
    "",
    `Name: ${input.lead.name}`,
    `Email: ${input.lead.workEmail}`,
    `Organization: ${input.lead.organization}`,
    `Role: ${input.lead.role}`,
    `Focus: ${input.lead.interest.replaceAll("_", " ")}`,
    note ? `Notes: ${note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    attendees: [
      {
        displayName: input.lead.name,
        email: input.lead.workEmail,
      },
    ],
    conferenceData: {
      createRequest: {
        conferenceSolutionKey: { type: "hangoutsMeet" },
        requestId,
      },
    },
    description,
    end: {
      dateTime: bookingDateTime.endDateTime,
      timeZone: bookingDateTime.timeZone,
    },
    extendedProperties: {
      private: {
        bookingSource: "clinicpulse-landing",
        interest: input.lead.interest,
        organization: input.lead.organization,
      },
    },
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: true,
    reminders: {
      useDefault: true,
    },
    start: {
      dateTime: bookingDateTime.startDateTime,
      timeZone: bookingDateTime.timeZone,
    },
    summary: `Clinic Pulse demo with ${input.lead.name}`,
  };
}

export function parseGoogleCalendarBookingResponse(
  value: unknown,
): GoogleCalendarBookingResult {
  if (!value || typeof value !== "object") {
    throw new GoogleCalendarBookingError("Google Calendar returned an empty response.");
  }

  const event = value as {
    conferenceData?: {
      entryPoints?: Array<{
        entryPointType?: string;
        uri?: string;
      }>;
    };
    hangoutLink?: string;
    htmlLink?: string;
    id?: string;
  };
  const videoEntry = event.conferenceData?.entryPoints?.find(
    (entryPoint) => entryPoint.entryPointType === "video" && entryPoint.uri,
  );
  const meetUrl = videoEntry?.uri ?? event.hangoutLink ?? "";

  if (!event.id || !event.htmlLink || !meetUrl) {
    throw new GoogleCalendarBookingError(
      "Google Calendar created an event but did not return complete Meet details.",
    );
  }

  return {
    calendarEventId: event.id,
    calendarUrl: event.htmlLink,
    meetUrl,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidSlot(value: unknown): value is GoogleCalendarBookingSlot {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isInteger(value.day) &&
    Number(value.day) >= 1 &&
    Number(value.day) <= 31 &&
    (value.duration === 30 || value.duration === 45) &&
    typeof value.time === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)
  );
}

export function parseBookingRequestBody(
  value: unknown,
):
  | { ok: true; input: GoogleCalendarBookingInput }
  | { error: string; ok: false } {
  if (!isRecord(value) || !isRecord(value.lead) || !isValidSlot(value.slot)) {
    return { error: "A valid booking slot is required.", ok: false };
  }

  const lead = {
    name: readString(value.lead.name),
    workEmail: readString(value.lead.workEmail),
    organization: readString(value.lead.organization),
    role: readString(value.lead.role),
    interest: readString(value.lead.interest),
    note: readString(value.lead.note),
  };

  if (!lead.name) {
    return { error: "Name is required.", ok: false };
  }

  if (!isValidEmail(lead.workEmail)) {
    return { error: "A valid work email is required.", ok: false };
  }

  if (!lead.organization) {
    return { error: "Organization is required.", ok: false };
  }

  if (!lead.role) {
    return { error: "Role is required.", ok: false };
  }

  if (!interestValues.has(lead.interest)) {
    return { error: "A valid focus is required.", ok: false };
  }

  return {
    input: {
      lead: {
        ...lead,
        interest: lead.interest as BookingInterest,
      },
      slot: value.slot,
    },
    ok: true,
  };
}

export function getGoogleCalendarBookingConfig(
  env: NodeJS.ProcessEnv = process.env,
): GoogleCalendarBookingConfig | null {
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  return {
    calendarId: env.GOOGLE_CALENDAR_ID?.trim() || DEFAULT_CALENDAR_ID,
    clientId,
    clientSecret,
    refreshToken,
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function fetchGoogleAccessToken(
  config: GoogleCalendarBookingConfig,
  fetcher: FetchLike,
) {
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const body = await readJsonResponse(response);

  if (!response.ok) {
    throw new GoogleCalendarBookingError(
      `Google OAuth token refresh failed with status ${response.status}.`,
      response.status,
    );
  }

  if (!isRecord(body) || typeof body.access_token !== "string") {
    throw new GoogleCalendarBookingError("Google OAuth did not return an access token.");
  }

  return body.access_token;
}

export async function createGoogleCalendarBooking(
  input: GoogleCalendarBookingInput,
  config: GoogleCalendarBookingConfig,
  fetcher: FetchLike = fetch,
) {
  const accessToken = await fetchGoogleAccessToken(config, fetcher);
  const event = buildGoogleCalendarEvent(input, crypto.randomUUID());
  const calendarId = encodeURIComponent(config.calendarId);
  const response = await fetcher(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      body: JSON.stringify(event),
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      method: "POST",
    },
  );
  const body = await readJsonResponse(response);

  if (!response.ok) {
    throw new GoogleCalendarBookingError(
      `Google Calendar event creation failed with status ${response.status}.`,
      response.status,
    );
  }

  return parseGoogleCalendarBookingResponse(body);
}
