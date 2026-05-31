type WorkspaceHydrationEnv = {
  CLINICPULSE_ALLOW_SEEDED_FALLBACK?: string;
  NODE_ENV?: string;
};

export function allowsSeededWorkspaceFallback(
  env: WorkspaceHydrationEnv = process.env,
) {
  return env.NODE_ENV !== "production" || env.CLINICPULSE_ALLOW_SEEDED_FALLBACK === "true";
}
