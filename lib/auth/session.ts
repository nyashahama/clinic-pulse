import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  AUTH_ROLES,
  ClinicPulseAuthApiError,
  type AuthApiClientOptions,
  type ClientAuthSession,
  type AuthMeResponse,
  type AuthMembership,
  type AuthRole,
  type AuthSessionRecord,
  type AuthUser,
  me,
} from "@/lib/auth/api";

export type AuthSession = {
  user: AuthUser;
  session?: AuthSessionRecord;
  memberships: AuthMembership[];
  activeMembership: AuthMembership;
  role: AuthRole;
};

export type AuthSessionLoadOptions = AuthApiClientOptions & {
  cookieHeader?: string | null;
};

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

export class InsufficientRoleError extends Error {
  constructor(role: AuthRole, allowedRoles: readonly AuthRole[]) {
    super(`Insufficient role: ${role} is not one of ${allowedRoles.join(", ")}`);
    this.name = "InsufficientRoleError";
  }
}

const ROLE_RANK: Record<AuthRole, number> = {
  system_admin: 4,
  org_admin: 3,
  district_manager: 2,
  reporter: 1,
};

type CookieSetOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

function isAuthRole(role: string): role is AuthRole {
  return (AUTH_ROLES as readonly string[]).includes(role);
}

function compareNullableNumber(left: number | undefined, right: number | undefined) {
  if (left === undefined && right === undefined) {
    return 0;
  }
  if (left === undefined) {
    return -1;
  }
  if (right === undefined) {
    return 1;
  }

  return left - right;
}

function compareNullableString(left: string | undefined, right: string | undefined) {
  if (left === undefined && right === undefined) {
    return 0;
  }
  if (left === undefined) {
    return -1;
  }
  if (right === undefined) {
    return 1;
  }

  return left.localeCompare(right);
}

function compareMemberships(left: AuthMembership, right: AuthMembership) {
  const roleDifference = ROLE_RANK[right.role] - ROLE_RANK[left.role];
  if (roleDifference !== 0) {
    return roleDifference;
  }

  const organisationDifference = compareNullableNumber(left.organisationId, right.organisationId);
  if (organisationDifference !== 0) {
    return organisationDifference;
  }

  const districtDifference = compareNullableString(left.district, right.district);
  if (districtDifference !== 0) {
    return districtDifference;
  }

  return left.id - right.id;
}

function selectActiveMembership(memberships: AuthMembership[]) {
  const knownMemberships = memberships.filter((membership) => isAuthRole(membership.role));

  return knownMemberships.sort(compareMemberships)[0] ?? null;
}

function parseSetCookieAttribute(attribute: string) {
  const separatorIndex = attribute.indexOf("=");

  if (separatorIndex === -1) {
    return {
      name: attribute.trim().toLowerCase(),
      value: "",
    };
  }

  return {
    name: attribute.slice(0, separatorIndex).trim().toLowerCase(),
    value: attribute.slice(separatorIndex + 1).trim(),
  };
}

function parseSessionSetCookie(setCookieHeader: string) {
  const parts = setCookieHeader.split(";").map((part) => part.trim()).filter(Boolean);
  const [nameAndValue, ...attributes] = parts;

  if (!nameAndValue) {
    return null;
  }

  const separatorIndex = nameAndValue.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const name = nameAndValue.slice(0, separatorIndex).trim();
  const value = nameAndValue.slice(separatorIndex + 1);
  if (name !== AUTH_COOKIE_NAME) {
    return null;
  }

  const options: CookieSetOptions = {};
  for (const attribute of attributes) {
    const parsed = parseSetCookieAttribute(attribute);

    switch (parsed.name) {
      case "domain":
        options.domain = parsed.value;
        break;
      case "expires": {
        const expires = new Date(parsed.value);
        if (!Number.isNaN(expires.getTime())) {
          options.expires = expires;
        }
        break;
      }
      case "httponly":
        options.httpOnly = true;
        break;
      case "max-age": {
        const maxAge = Number(parsed.value);
        if (Number.isFinite(maxAge)) {
          options.maxAge = maxAge;
        }
        break;
      }
      case "path":
        options.path = parsed.value;
        break;
      case "samesite": {
        const sameSite = parsed.value.toLowerCase();
        if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
          options.sameSite = sameSite;
        }
        break;
      }
      case "secure":
        options.secure = true;
        break;
      default:
        break;
    }
  }

  return { name, value, options };
}

export function toAuthSession(response: AuthMeResponse | Omit<AuthMeResponse, "session">) {
  const activeMembership = selectActiveMembership(response.memberships);

  if (!activeMembership) {
    return null;
  }

  return {
    user: response.user,
    session: "session" in response ? response.session : undefined,
    memberships: response.memberships,
    activeMembership,
    role: activeMembership.role,
  } satisfies AuthSession;
}

export function toClientAuthSession(session: AuthSession): ClientAuthSession {
  return {
    displayName: session.user.displayName,
    email: session.user.email,
    role: session.role,
  };
}

export async function getSessionCookieHeader() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  return `${AUTH_COOKIE_NAME}=${sessionCookie.value}`;
}

export async function getCurrentSession(options: AuthSessionLoadOptions = {}) {
  const { cookieHeader, ...apiOptions } = options;
  const incomingCookieHeader =
    cookieHeader === undefined ? await getSessionCookieHeader() : cookieHeader;

  if (!incomingCookieHeader) {
    return null;
  }

  const headers = new Headers(apiOptions.init?.headers);
  headers.set("cookie", incomingCookieHeader);

  try {
    const response = await me({
      ...apiOptions,
      init: {
        ...apiOptions.init,
        headers,
      },
    });

    return toAuthSession(response);
  } catch (error) {
    if (error instanceof ClinicPulseAuthApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export function requireRole(session: AuthSession | null, roles: readonly AuthRole[]) {
  if (!session) {
    throw new AuthenticationRequiredError();
  }

  if (!roles.includes(session.role)) {
    throw new InsufficientRoleError(session.role, roles);
  }

  return session;
}

export async function applySessionCookieFromHeader(setCookieHeader: string | null | undefined) {
  if (!setCookieHeader) {
    throw new Error(`${AUTH_COOKIE_NAME} cookie was not returned by the auth API`);
  }

  const parsedCookie = parseSessionSetCookie(setCookieHeader);
  if (!parsedCookie) {
    throw new Error(`${AUTH_COOKIE_NAME} cookie was not returned by the auth API`);
  }

  const cookieStore = await cookies();
  cookieStore.set(parsedCookie.name, parsedCookie.value, parsedCookie.options);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
