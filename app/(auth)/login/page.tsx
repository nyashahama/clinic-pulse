import { LoginForm } from "@/components/auth/login-form";
import type { EmailSignInActionState } from "@/components/auth/email-sign-in";
import { ClinicPulseAuthApiError, login } from "@/lib/auth/api";
import { applySessionCookieFromHeader } from "@/lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";

const demoAccounts = [
  {
    role: "District manager",
    email: "district-manager@clinicpulse.local",
  },
  {
    role: "Reporter",
    email: "reporter@clinicpulse.local",
  },
];

async function loginAction(
  _state: EmailSignInActionState,
  formData: FormData,
): Promise<EmailSignInActionState> {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      email,
      error: "Enter your email and password.",
    };
  }

  try {
    const result = await login(email, password);
    await applySessionCookieFromHeader(result.setCookie);
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

  redirect("/demo");
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between px-4 pb-5 pt-24 sm:px-6">
      <div className="grow basis-0" />

      <main className="relative flex w-full flex-col items-center justify-center">
        <section className="w-full max-w-[26rem] rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-7">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#0D7A6B] text-lg font-bold text-white shadow-lg shadow-[#0D7A6B]/20">
              CP
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D7A6B]">
              Secure workspace
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
              Sign in to ClinicPulse
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Access live clinic status, field reports, rerouting context, and
              audit history for your district.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm loginAction={loginAction} />
          </div>

          <div className="mt-6 rounded-2xl border border-[#0D7A6B]/15 bg-[#ecf7f4] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-950">
                Local demo credentials
              </p>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0D7A6B]">
                Seeded
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {demoAccounts.map((account) => (
                <div
                  key={account.email}
                  className="rounded-xl border border-white/80 bg-white/70 px-3 py-2"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {account.role}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-neutral-800">
                    {account.email}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-xs text-neutral-700">
              Password: ClinicPulseDemo123!
            </p>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-neutral-500">
            Don&rsquo;t have an account?&nbsp;
            <Link
              href="/register"
              className="font-semibold text-[#0D7A6B] transition-colors hover:text-neutral-900"
            >
              Sign up
            </Link>
          </p>
        </section>
      </main>

      <div className="flex grow basis-0 flex-col justify-end">
        <p className="max-w-md px-4 py-4 text-center text-xs font-medium leading-5 text-neutral-500 md:px-0">
          By continuing, you agree to ClinicPulse&rsquo;s{" "}
          <Link
            href="/legal/terms"
            className="font-semibold text-neutral-600 hover:text-neutral-800"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-neutral-600 hover:text-neutral-800"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
