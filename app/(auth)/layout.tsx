import { BrandingPanel } from "@/components/auth/branding-panel";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <BrandingPanel />

      <div className="relative flex h-full flex-col justify-between overflow-hidden border-l border-black/5 bg-neutral-50 min-[900px]:flex">
        <div className="flex grow items-start justify-center p-6 pt-24 min-[900px]:items-center min-[900px]:p-8 lg:p-14">
          {children}
        </div>

        <p className="px-20 py-8 text-center text-xs font-medium text-neutral-500">
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
