type DeployEnv = "local" | "staging" | "production";

export type SecurityHeaderInput = {
  deployEnv: DeployEnv;
};

function contentSecurityPolicy(deployEnv: DeployEnv) {
  const scriptSrc =
    deployEnv === "local"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
  const connectSrc =
    deployEnv === "local" ? "connect-src 'self' https:" : "connect-src 'self'";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    connectSrc,
    "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    "font-src 'self' data:",
  ].join("; ");
}

export function buildSecurityHeaders({ deployEnv }: SecurityHeaderInput) {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: contentSecurityPolicy(deployEnv) },
  ];
}
