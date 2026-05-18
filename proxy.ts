import { NextResponse, type NextRequest } from "next/server";

import { withObservabilityHeaders } from "@/lib/observability/request-context";

export function proxy(request: NextRequest) {
  const isClinicPulseAPI = request.nextUrl.pathname.startsWith("/api/clinicpulse");
  const requestHeaders = isClinicPulseAPI
    ? withObservabilityHeaders(request.headers)
    : new Headers(request.headers);

  if (!isClinicPulseAPI) {
    requestHeaders.set(
      "x-clinicpulse-pathname",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isClinicPulseAPI) {
    response.headers.set("x-request-id", requestHeaders.get("x-request-id") ?? "");
    response.headers.set("traceparent", requestHeaders.get("traceparent") ?? "");
  }

  return response;
}

export const config = {
  matcher: [
    "/api/clinicpulse/:path*",
    "/((?!_next/static|_next/image|api/clinicpulse|apple-icon|favicon.ico|sw.js).*)",
  ],
};
