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
    access: "Full system access",
  },
  {
    role: "Organisation admin",
    email: "org-admin@clinicpulse.local",
    access: "Org-level management",
  },
  {
    role: "District manager",
    email: "district-manager@clinicpulse.local",
    access: "District operations",
  },
  {
    role: "Reporter",
    email: "reporter@clinicpulse.local",
    access: "Field reporting",
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const frontendEnv = validateFrontendRuntimeEnv();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const returnTo = getSafeAuthReturnPath(firstSearchParam(resolvedSearchParams.next));

  return (
    <div className="w-full max-w-[26rem]">
      <div className="text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-[#0D7A6B]/15 bg-[#0D7A6B]/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0D7A6B] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-[#0D7A6B] dark:bg-emerald-400" />
          Operations console
        </div>
        <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.035em] text-neutral-950 dark:text-foreground">
          Sign in to ClinicPulse
        </h1>
        <p className="mt-2.5 text-sm leading-6 text-neutral-500 dark:text-muted-foreground">
          Access live clinic status, field reports, rerouting context, and
          audit history for your district.
        </p>
      </div>

      <div className="mt-8">
        <LoginForm loginAction={loginAction} returnTo={returnTo ?? undefined} />
      </div>

      {frontendEnv.showDemoCredentials ? (
        <div className="mt-6 rounded-xl border border-neutral-200/80 bg-white/60 p-4 backdrop-blur dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-neutral-700 dark:text-foreground">
              Demo access
            </p>
            <span className="rounded-full bg-[#0D7A6B]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0D7A6B] dark:bg-emerald-500/10 dark:text-emerald-300">
              Seeded
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="group flex items-center justify-between gap-3 rounded-lg border border-neutral-100 bg-white/80 px-3 py-2 transition hover:border-neutral-200 hover:bg-white dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-foreground">
                    {account.role}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-400 dark:text-muted-foreground">
                    {account.email}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-neutral-400 dark:text-muted-foreground">
                  {account.access}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-neutral-400 dark:text-muted-foreground">Password</span>
            <code className="font-mono text-[11px] font-semibold text-neutral-600 dark:text-foreground">
              ClinicPulseDemo123!
            </code>
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-neutral-500 dark:text-muted-foreground">
        Don&rsquo;t have an account?&nbsp;
        <Link
          href="/register"
          className="font-semibold text-[#0D7A6B] transition-colors hover:text-[#0a5e54] dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          Request access
        </Link>
      </p>
    </div>
  );
}
