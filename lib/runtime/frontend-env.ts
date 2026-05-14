const DEFAULT_API_BASE_URL = "http://localhost:8080";
const DEFAULT_BROWSER_API_BASE_URL = "/api/clinicpulse";

const DEPLOY_ENVS = ["local", "staging", "production"] as const;

type DeployEnv = (typeof DEPLOY_ENVS)[number];

type FrontendRuntimeEnv = {
  CLINICPULSE_DEPLOY_ENV?: string;
  CLINICPULSE_API_BASE_URL?: string;
  NEXT_PUBLIC_CLINICPULSE_API_BASE_URL?: string;
  CLINICPULSE_ALLOW_DEMO_FALLBACK?: string;
  NODE_ENV?: string;
};

type FrontendRuntimeConfig = {
  deployEnv: DeployEnv;
  apiBaseUrl: string;
  browserApiBaseUrl: string;
};

function isDeployEnv(value: string): value is DeployEnv {
  return DEPLOY_ENVS.includes(value as DeployEnv);
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function validateFrontendRuntimeEnv(
  env: FrontendRuntimeEnv = process.env,
): FrontendRuntimeConfig {
  const rawDeployEnv = env.CLINICPULSE_DEPLOY_ENV || "local";
  const problems: string[] = [];

  if (!isDeployEnv(rawDeployEnv)) {
    problems.push(
      "CLINICPULSE_DEPLOY_ENV must be one of local, staging, or production.",
    );
  }

  const deployEnv = isDeployEnv(rawDeployEnv) ? rawDeployEnv : "local";
  const apiBaseUrl = env.CLINICPULSE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const browserApiBaseUrl =
    env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL || DEFAULT_BROWSER_API_BASE_URL;

  if (deployEnv !== "local") {
    if (!env.CLINICPULSE_API_BASE_URL) {
      problems.push(
        "CLINICPULSE_API_BASE_URL must be set outside local deployments.",
      );
    } else {
      const apiUrl = parseUrl(apiBaseUrl);

      if (!apiUrl || apiUrl.protocol !== "https:") {
        problems.push(
          "CLINICPULSE_API_BASE_URL must be a valid https:// URL outside local deployments.",
        );
      } else if (["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname)) {
        problems.push(
          "CLINICPULSE_API_BASE_URL must not point at localhost, 127.0.0.1, or ::1 outside local deployments.",
        );
      }
    }

    if (!env.NEXT_PUBLIC_CLINICPULSE_API_BASE_URL) {
      problems.push(
        "NEXT_PUBLIC_CLINICPULSE_API_BASE_URL must be set to /api/clinicpulse outside local deployments.",
      );
    } else if (browserApiBaseUrl !== DEFAULT_BROWSER_API_BASE_URL) {
      problems.push(
        "NEXT_PUBLIC_CLINICPULSE_API_BASE_URL must remain /api/clinicpulse outside local deployments.",
      );
    }

    if (env.CLINICPULSE_ALLOW_DEMO_FALLBACK === "true") {
      problems.push(
        "CLINICPULSE_ALLOW_DEMO_FALLBACK=true is not allowed outside local deployments.",
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid ClinicPulse frontend runtime environment:\n${problems.join("\n")}`,
    );
  }

  return {
    deployEnv,
    apiBaseUrl,
    browserApiBaseUrl,
  };
}
