import { SignupForm, type SignupActionState } from "@/components/auth/signup-form";
import { validateFrontendRuntimeEnv } from "@/lib/runtime/frontend-env";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
  const frontendEnv = validateFrontendRuntimeEnv();

  if (!fullName || !email || !organisation || !role) {
    return {
      fields,
      error: "Complete every field to request a ClinicPulse account.",
    };
  }

  if (!frontendEnv.allowPublicRegistration) {
    return {
      fields,
      error:
        "Account requests are reviewed by administrators before access is provisioned.",
    };
  }

  if (!password || !confirmPassword) {
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
      "Account creation is not enabled in this environment yet. Use the local seeded credentials on the sign in page, or ask an administrator to provision your account.",
  };
}

export default function RegisterPage() {
  const frontendEnv = validateFrontendRuntimeEnv();

  return (
    <div className="mx-auto w-full max-w-[28rem]">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-medium leading-none tracking-[-0.04em] text-white">
          Request ClinicPulse access
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/46">
          Request workspace access for district operations, field reporting,
          and partner coordination workflows.
        </p>
      </div>

      <SignupForm
        action={signupAction}
        allowPublicRegistration={frontendEnv.allowPublicRegistration}
      />

      <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.045] p-3.5 text-xs leading-6 text-amber-200/76">
        <p className="font-medium">Accounts are provisioned by administrators.</p>
        {frontendEnv.showDemoCredentials ? (
          <p className="mt-1 text-amber-600/80 dark:text-amber-400/60">
            Use the pre-provisioned accounts on the sign in page.
          </p>
        ) : null}
      </div>

      <p className="mt-7 text-center text-sm text-white/42">
        Already have an account?&nbsp;
        <Link
          href="/login"
          className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
