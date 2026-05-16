const AUTH_RETURN_BLOCKLIST = ["/login", "/register", "/change-password"];

export function getSafeAuthReturnPath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return null;
  }

  const [pathname = ""] = trimmed.split(/[?#]/, 1);
  if (
    AUTH_RETURN_BLOCKLIST.some(
      (blockedPath) => pathname === blockedPath || pathname.startsWith(`${blockedPath}/`),
    )
  ) {
    return null;
  }

  return trimmed;
}

export function getLoginHref(returnPath: unknown) {
  const safeReturnPath = getSafeAuthReturnPath(returnPath);

  if (!safeReturnPath) {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(safeReturnPath)}`;
}
