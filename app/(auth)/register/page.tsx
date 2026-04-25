import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between">
      <div className="grow basis-0" />

      <div className="relative flex w-full flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h3 className="text-center text-xl font-semibold">
            Create your ClinicPulse account
          </h3>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm font-medium text-neutral-500">
            Already have an account?&nbsp;
            <Link
              href="/login"
              className="font-semibold text-neutral-700 transition-colors hover:text-neutral-900"
            >
              Sign in
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
