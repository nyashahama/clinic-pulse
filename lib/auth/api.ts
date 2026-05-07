const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_BROWSER_API_BASE_URL = "/api/clinicpulse";

export const AUTH_COOKIE_NAME = "clinicpulse_session";

export const AUTH_ROLES = [
  "system_admin",
  "org_admin",
  "district_manager",
  "reporter",
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  disabledAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthMembership = {
  id: number;
  organisationId?: number;
  userId: number;
  role: AuthRole;
  district?: string;
  createdAt: string;
};

export type AuthSessionRecord = {
  id: number;
  userId: number;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  lastSeenAt?: string;
  userAgent?: string;
  ipAddress?: string;
};

export type ClientAuthSession = {
  displayName: string;
  email: string;
  role: AuthRole;
};

export type AuthLoginResponse = {
  user: AuthUser;
  memberships: AuthMembership[];
};

export type AuthMeResponse = AuthLoginResponse & {
  session: AuthSessionRecord;
};

export type AuthApiMutationResult<T> = {
  data: T;
  setCookie: string | null;
};

export type AuthApiClientOptions = {
  baseUrl?: string;
  fetch?: AuthApiFetch;
  init?: RequestInit;
};

export type AuthApiFetch = (input: string, init?: RequestInit) => Promise<Response>;

export class ClinicPulseAuthApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fields?: string[];

  constructor(status: number, message: string, code?: string, fields?: string[]) {
    super(message);
    this.name = "ClinicPulseAuthApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    fields?: string[];
  };
};

function getDefaultBaseUrl() {
  if (typeof process !== "undefined") {
    if (typeof window === "undefined") {
      return (
        process.env.CLINICPULSE_API_BASE_URL ||
        process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL ||
        DEFAULT_API_BASE_URL
      );
    }

    return process.env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL || DEFAULT_BROWSER_API_BASE_URL;
  }

  return DEFAULT_BROWSER_API_BASE_URL;
}

function getFetch(fetchImpl: AuthApiClientOptions["fetch"]) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch !== "undefined") {
    return fetch as AuthApiFetch;
  }

  throw new Error("No fetch implementation is available.");
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function buildApiUrl(pathSegments: string[], options: AuthApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? getDefaultBaseUrl();
  const trimmedBaseUrl = baseUrl.replace(/\/+$/g, "");
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const isRelativeBaseUrl = trimmedBaseUrl.startsWith("/");
  const url = new URL(
    `${trimmedBaseUrl}/${encodedPath}`,
    isRelativeBaseUrl ? "http://clinicpulse.local" : undefined,
  );

  if (isRelativeBaseUrl) {
    return `${url.pathname}${url.search}`;
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

function buildRequestInit(options: AuthApiClientOptions, requestInit: RequestInit) {
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

function readSetCookie(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const cookies = headers.getSetCookie?.();

  if (cookies && cookies.length > 0) {
    return cookies[0];
  }

  return response.headers.get("set-cookie");
}

async function requestAuthApi<T>(
  pathSegments: string[],
  options: AuthApiClientOptions = {},
  requestInit: RequestInit = {},
) {
  const fetchImpl = getFetch(options.fetch);
  const url = buildApiUrl(pathSegments.map(trimSlashes).filter(Boolean), options);
  const response = await fetchImpl(url, buildRequestInit(options, requestInit));

  if (response.ok) {
    return {
      data: await readJson<T>(response),
      response,
    };
  }

  let payload: ApiErrorResponse | undefined;
  try {
    payload = await readJson<ApiErrorResponse>(response);
  } catch {
    payload = undefined;
  }

  const message = payload?.error?.message ?? `ClinicPulse auth request failed with ${response.status}`;
  throw new ClinicPulseAuthApiError(
    response.status,
    message,
    payload?.error?.code,
    payload?.error?.fields,
  );
}

export async function login(
  email: string,
  password: string,
  options?: AuthApiClientOptions,
): Promise<AuthApiMutationResult<AuthLoginResponse>> {
  const result = await requestAuthApi<AuthLoginResponse>(["v1", "auth", "login"], options, {
    body: JSON.stringify({ email, password }),
    method: "POST",
  });

  return {
    data: result.data,
    setCookie: readSetCookie(result.response),
  };
}

export async function me(options?: AuthApiClientOptions) {
  const result = await requestAuthApi<AuthMeResponse>(["v1", "auth", "me"], options);

  return result.data;
}

export async function logout(
  options?: AuthApiClientOptions,
): Promise<AuthApiMutationResult<void>> {
  const result = await requestAuthApi<void>(["v1", "auth", "logout"], options, {
    method: "POST",
  });

  return {
    data: result.data,
    setCookie: readSetCookie(result.response),
  };
}
