import { LoginForm } from "@/components/auth/login-form";
import type { EmailSignInActionState } from "@/components/auth/email-sign-in";
import { ClinicPulseAuthApiError, login } from "@/lib/auth/api";
import { applySessionCookieFromHeader } from "@/lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between">
      <div className="grow basis-0" />

      <div className="relative flex w-full flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h3 className="text-center text-xl font-semibold">
            Log in to your ClinicPulse account
          </h3>
          <div className="mt-8">
            <LoginForm loginAction={loginAction} />
          </div>
          <p className="mt-6 text-center text-sm font-medium text-neutral-500">
            Don&rsquo;t have an account?&nbsp;
            <Link
              href="/register"
              className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="flex grow basis-0 flex-col justify-end">
        <p className="px-20 py-8 text-center text-xs font-medium text-neutral-500 md:px-0">
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
