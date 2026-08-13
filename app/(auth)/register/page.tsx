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

  if (!frontendEnv.allowPublicRegistration) {
    return (
      <div className="mx-auto w-full max-w-[28rem]">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0D7A6B]">
            Provision-only access
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.04] tracking-[-0.04em] text-[#17201e]">
            Access is provisioned by your organisation.
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            ClinicPulse workspaces are not open for public self-registration.
            An authorised administrator creates accounts for district teams,
            field reporters, and approved partners.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold text-amber-950">Need access for your team?</p>
          <p className="mt-1 text-amber-800">
            Use the walkthrough route to discuss workspace provisioning and the
            roles your organisation needs.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/?booking=1"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[#0D7A6B] bg-[#0D7A6B] px-4 text-center text-sm font-semibold text-white transition-colors hover:bg-[#09695d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/25"
          >
            Book an access walkthrough
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-4 text-center text-sm font-semibold text-neutral-700 transition-colors hover:border-[#0D7A6B]/40 hover:text-[#0D7A6B]"
          >
            Return to sign in
          </Link>
        </div>

        {frontendEnv.showDemoCredentials ? (
          <p className="mt-5 text-center text-xs leading-5 text-neutral-500">
            Local demo access remains available from the sign-in page.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[28rem]">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-semibold leading-none tracking-[-0.04em] text-[#17201e]">
          Request ClinicPulse access
        </h1>
        <p className="mt-3 text-base leading-7 text-neutral-600">
          Request workspace access for district operations, field reporting,
          and partner coordination workflows.
        </p>
      </div>

      <SignupForm
        action={signupAction}
        allowPublicRegistration={frontendEnv.allowPublicRegistration}
      />

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-6 text-amber-900">
        <p className="font-medium">Accounts are provisioned by administrators.</p>
        {frontendEnv.showDemoCredentials ? (
            <p className="mt-1 text-amber-700">
            Use the pre-provisioned accounts on the sign in page.
          </p>
        ) : null}
      </div>

      <p className="mt-7 text-center text-sm text-neutral-600">
        Already have an account?&nbsp;
        <Link
          href="/login"
          className="font-semibold text-[#0D7A6B] transition-colors hover:text-[#09695d]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
