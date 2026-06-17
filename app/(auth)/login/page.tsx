import { LoginForm } from "@/components/auth/login-form";
import type { EmailSignInActionState } from "@/components/auth/email-sign-in";
import { ClinicPulseAuthApiError, login } from "@/lib/auth/api";
import { getSafeAuthReturnPath } from "@/lib/auth/redirects";
import { getMembershipHomeHref } from "@/lib/auth/role-home";
import { applySessionCookieFromHeader } from "@/lib/auth/session";
import { validateFrontendRuntimeEnv } from "@/lib/runtime/frontend-env";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const demoAccounts = [
  {
    role: "System admin",
    email: "system-admin@clinicpulse.local",
  },
  {
    role: "Organisation admin",
    email: "org-admin@clinicpulse.local",
  },
  {
    role: "District manager",
    email: "district-manager@clinicpulse.local",
  },
  {
    role: "Reporter",
    email: "reporter@clinicpulse.local",
  },
];

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loginAction(
  _state: EmailSignInActionState,
  formData: FormData,
): Promise<EmailSignInActionState> {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnTo = getSafeAuthReturnPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return {
      email,
      error: "Enter your email and password.",
    };
  }

  let nextPath = "/district";

  try {
    const result = await login(email, password);
    await applySessionCookieFromHeader(result.setCookie);
    nextPath = result.data.user.passwordResetRequired
      ? "/change-password"
      : returnTo ?? getMembershipHomeHref(result.data.memberships);
  } catch (error) {
    if (
      error instanceof ClinicPulseAuthApiError &&
      (error.status === 400 || error.status === 401)
    ) {
      return {
        email,
        error: "Invalid email or password.",
      };
    }

    throw error;
  }

  redirect(nextPath);
}

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    label: "Live clinic status",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8L22 12L18 16" />
        <path d="M2 12H22" />
      </svg>
    ),
    label: "Patient rerouting",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    label: "Audit trail",
  },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const frontendEnv = validateFrontendRuntimeEnv();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const returnTo = getSafeAuthReturnPath(firstSearchParam(resolvedSearchParams.next));

  return (
    <div className="w-full max-w-[24rem]">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-foreground">
          Sign in to ClinicPulse
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-muted-foreground">
          Access live clinic status, field reports, and
          audit history for your district.
        </p>
      </div>

      <LoginForm loginAction={loginAction} returnTo={returnTo ?? undefined} />

      {frontendEnv.showDemoCredentials ? (
        <div className="mt-8 rounded-xl border border-neutral-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-neutral-700 dark:text-white/80">
              Demo credentials
            </p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              Local
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-white px-3 py-2 dark:border-white/5 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-800 dark:text-white/90">
                    {account.role}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-400 dark:text-white/40">
                    {account.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] text-neutral-500 dark:text-white/40">
            Password: <span className="font-semibold text-neutral-700 dark:text-white/70">ClinicPulseDemo123!</span>
          </p>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-neutral-500 dark:text-muted-foreground">
        Don&rsquo;t have an account?&nbsp;
        <Link
          href="/register"
          className="font-semibold text-[#0D7A6B] transition-colors hover:text-[#0a5e54] dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Request access
        </Link>
      </p>

      <div className="mt-10 grid grid-cols-3 gap-4 border-t border-neutral-100 pt-6 dark:border-white/5">
        {features.map((feature) => (
          <div key={feature.label} className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-[#0D7A6B] dark:text-emerald-400">{feature.icon}</span>
            <span className="text-[11px] font-medium text-neutral-400 dark:text-white/30">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
