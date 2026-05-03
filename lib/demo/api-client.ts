import type {
  AlternativeApiResponse,
  ApiErrorResponse,
  ClinicDetailApiResponse,
  CreateReportApiInput,
  CreateReportApiResponse,
  CurrentStatusApiResponse,
  ReportApiResponse,
  AuditEventApiResponse,
} from "@/lib/demo/api-types";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

export type ClinicPulseApiClientOptions = {
  baseUrl?: string;
  fetch?: ClinicPulseFetch;
  init?: RequestInit;
};

export type ClinicPulseFetch = (input: string, init?: RequestInit) => Promise<Response>;

export class ClinicPulseApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fields?: string[];

  constructor(status: number, message: string, code?: string, fields?: string[]) {
    super(message);
    this.name = "ClinicPulseApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function getDefaultBaseUrl() {
  if (typeof process !== "undefined") {
    return process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL || DEFAULT_API_BASE_URL;
  }

  return DEFAULT_API_BASE_URL;
}

function getFetch(fetchImpl: ClinicPulseApiClientOptions["fetch"]) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "undefined") {
    return fetch as ClinicPulseFetch;
  }

  throw new Error("No fetch implementation is available.");
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function buildApiUrl(
  pathSegments: string[],
  options: ClinicPulseApiClientOptions = {},
  query?: Record<string, string>,
) {
  const baseUrl = options.baseUrl ?? getDefaultBaseUrl();
  const trimmedBaseUrl = baseUrl.replace(/\/+$/g, "");
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const url = new URL(`${trimmedBaseUrl}/${encodedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function copyHeaders(target: Headers, source: HeadersInit | undefined) {
  if (!source) {
    return;
  }

  new Headers(source).forEach((value, key) => {
    target.set(key, value);
  });
}

function shouldDefaultJsonContentType(body: BodyInit | null | undefined) {
  return typeof body === "string";
}

function buildRequestInit(options: ClinicPulseApiClientOptions, requestInit: RequestInit) {
  const headers = new Headers();
  copyHeaders(headers, options.init?.headers);
  copyHeaders(headers, requestInit.headers);
  const init = {
    cache: "no-store",
    method: "GET",
    ...options.init,
    ...requestInit,
    headers,
  } satisfies RequestInit;

  if (shouldDefaultJsonContentType(init.body) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return init;
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestClinicPulseApi<T>(
  pathSegments: string[],
  options: ClinicPulseApiClientOptions = {},
  requestInit: RequestInit = {},
  query?: Record<string, string>,
) {
  const fetchImpl = getFetch(options.fetch);
  const url = buildApiUrl(pathSegments.map(trimSlashes).filter(Boolean), options, query);
  const response = await fetchImpl(url, buildRequestInit(options, requestInit));

  if (response.ok) {
    return readJson<T>(response);
  }

  let payload: ApiErrorResponse | undefined;
  try {
    payload = await readJson<ApiErrorResponse>(response);
  } catch {
    payload = undefined;
  }

  const message = payload?.error?.message ?? `ClinicPulse API request failed with ${response.status}`;
  throw new ClinicPulseApiError(
    response.status,
    message,
    payload?.error?.code,
    payload?.error?.fields,
  );
}

export function fetchClinics(options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<ClinicDetailApiResponse[]>(["v1", "clinics"], options);
}

export function fetchClinic(clinicId: string, options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<ClinicDetailApiResponse>(["v1", "clinics", clinicId], options);
}

export function fetchClinicStatus(clinicId: string, options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<CurrentStatusApiResponse>(
    ["v1", "clinics", clinicId, "status"],
    options,
  );
}

export function fetchClinicReports(clinicId: string, options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<ReportApiResponse[]>(["v1", "clinics", clinicId, "reports"], options);
}

export function fetchClinicAuditEvents(clinicId: string, options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<AuditEventApiResponse[]>(
    ["v1", "clinics", clinicId, "audit-events"],
    options,
  );
}

export function createReport(input: CreateReportApiInput, options?: ClinicPulseApiClientOptions) {
  return requestClinicPulseApi<CreateReportApiResponse>(["v1", "reports"], options, {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function fetchAlternatives(
  clinicId: string,
  service: string,
  options?: ClinicPulseApiClientOptions,
) {
  return requestClinicPulseApi<AlternativeApiResponse[]>(
    ["v1", "alternatives"],
    options,
    undefined,
    { clinicId, service },
  );
}
