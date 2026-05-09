import { SignupForm, type SignupActionState } from "@/components/auth/signup-form";
import Link from "next/link";

async function signupAction(
  _state: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  "use server";

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const organisation = String(formData.get("organisation") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fields = {
    fullName,
    email,
    organisation,
    role,
  };

  if (!fullName || !email || !organisation || !role || !password || !confirmPassword) {
    return {
      fields,
      error: "Complete every field to request a ClinicPulse account.",
    };
  }

  if (password.length < 12) {
    return {
      fields,
      error: "Use a password with at least 12 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      fields,
      error: "Passwords do not match.",
    };
  }

  return {
    fields,
    error:
      "Account creation is not enabled in this environment yet. Use the seeded demo credentials on the sign in page, or ask an administrator to provision your account.",
  };
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between px-4 pb-5 pt-24 sm:px-6">
      <div className="grow basis-0" />

      <main className="relative flex w-full flex-col items-center justify-center">
        <section className="w-full max-w-[30rem] rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-7">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-lg font-bold text-white shadow-lg shadow-slate-900/20">
              CP
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D7A6B]">
              Invite-only access
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-950">
              Create your ClinicPulse account
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Request workspace access for district operations, field reporting,
              and partner coordination workflows.
            </p>
          </div>

          <div className="mt-8">
            <SignupForm action={signupAction} />
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            New accounts are currently provisioned by administrators. The local
            demo includes seeded users you can use from the sign in page.
          </div>

          <p className="mt-6 text-center text-sm font-medium text-neutral-500">
            Already have an account?&nbsp;
            <Link
              href="/login"
              className="font-semibold text-[#0D7A6B] transition-colors hover:text-neutral-900"
            >
              Sign in
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
