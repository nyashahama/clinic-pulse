type DemoHydrationEnv = {
  CLINICPULSE_ALLOW_DEMO_FALLBACK?: string;
  NODE_ENV?: string;
};

export function allowsSeededDemoFallback(
  env: DemoHydrationEnv = process.env,
) {
  return env.NODE_ENV !== "production" || env.CLINICPULSE_ALLOW_DEMO_FALLBACK === "true";
}
