import { readFile } from "node:fs/promises";

const routerPath = "services/api/internal/http/router.go";
const openAPIPath = "docs/openapi/clinicpulse.v0.1.json";
const methods = new Set(["get", "post", "patch", "put", "delete"]);
const requiredSecuritySchemes = [
  "sessionCookie",
  "partnerBearer",
  "metricsBearer",
];

function parseRouterRoutes(source) {
  const routePattern =
    /router(?:\.With\(.*\))?\.(Get|Post|Patch|Put|Delete)\(\s*"([^"]+)"/;
  const routes = [];

  for (const line of source.split("\n")) {
    const match = routePattern.exec(line);
    if (!match) {
      continue;
    }

    routes.push({
      method: match[1].toLowerCase(),
      path: match[2],
    });
  }

  return routes.sort(compareRoutes);
}

function compareRoutes(left, right) {
  return `${left.method} ${left.path}`.localeCompare(`${right.method} ${right.path}`);
}

function routeKey(route) {
  return `${route.method.toUpperCase()} ${route.path}`;
}

function operationFor(openAPI, route) {
  return openAPI.paths?.[route.path]?.[route.method];
}

function hasSecurity(operation, scheme) {
  return Array.isArray(operation?.security)
    && operation.security.some((entry) => Array.isArray(entry?.[scheme]));
}

function hasAnySecurity(operation) {
  return Array.isArray(operation?.security) && operation.security.length > 0;
}

function expectedScheme(route) {
  if (route.path === "/metrics") {
    return "metricsBearer";
  }
  if (route.path.startsWith("/v1/partner/")) {
    return "partnerBearer";
  }
  if (
    route.path === "/v1/auth/me"
    || route.path === "/v1/auth/password"
    || route.path.startsWith("/v1/admin/")
    || (
      route.path.startsWith("/v1/")
      && !route.path.startsWith("/v1/auth/")
      && !route.path.startsWith("/v1/public/")
      && !route.path.startsWith("/v1/partner/")
    )
  ) {
    return "sessionCookie";
  }
  return null;
}

function validateOpenAPIShape(openAPI, failures) {
  for (const scheme of requiredSecuritySchemes) {
    if (!openAPI.components?.securitySchemes?.[scheme]) {
      failures.push(`Missing required security scheme: ${scheme}`);
    }
  }
}

function validateRouteDrift(routerRoutes, openAPI, failures) {
  const routerKeys = new Set(routerRoutes.map(routeKey));
  const openAPIRoutes = [];

  for (const [path, pathItem] of Object.entries(openAPI.paths ?? {})) {
    for (const method of Object.keys(pathItem ?? {})) {
      if (methods.has(method)) {
        openAPIRoutes.push({ method, path });
      }
    }
  }

  const openAPIKeys = new Set(openAPIRoutes.map(routeKey));

  for (const route of routerRoutes) {
    if (!openAPIKeys.has(routeKey(route))) {
      failures.push(`OpenAPI missing router route: ${routeKey(route)}`);
    }
  }

  for (const route of openAPIRoutes) {
    if (!routerKeys.has(routeKey(route))) {
      failures.push(`OpenAPI route missing from router: ${routeKey(route)}`);
    }
  }
}

function validateSecurity(routerRoutes, openAPI, failures) {
  for (const route of routerRoutes) {
    const scheme = expectedScheme(route);
    const operation = operationFor(openAPI, route);

    if (!scheme) {
      if (hasAnySecurity(operation)) {
        failures.push(`${routeKey(route)} must not declare security`);
      }
      continue;
    }

    if (!hasSecurity(operation, scheme)) {
      failures.push(`${routeKey(route)} must declare ${scheme} security`);
    }
  }
}

const [routerSource, openAPISource] = await Promise.all([
  readFile(routerPath, "utf8"),
  readFile(openAPIPath, "utf8"),
]);

const routerRoutes = parseRouterRoutes(routerSource);
const openAPI = JSON.parse(openAPISource);
const failures = [];

validateOpenAPIShape(openAPI, failures);
validateRouteDrift(routerRoutes, openAPI, failures);
validateSecurity(routerRoutes, openAPI, failures);

if (failures.length > 0) {
  console.error("OpenAPI verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`OpenAPI verification passed for ${routerRoutes.length} routes.`);
