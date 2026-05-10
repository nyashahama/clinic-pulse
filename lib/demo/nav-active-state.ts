export function isDashboardNavUrlActive(
  url: string,
  pathname: string,
  searchParams: { toString: () => string },
) {
  if (url.includes("#")) {
    return false;
  }

  const [hrefPath = url, hrefQuery = ""] = url.split("?", 2);
  const pathActive = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);

  if (!hrefQuery) {
    return pathActive;
  }

  return pathname === hrefPath && searchParams.toString() === hrefQuery;
}
