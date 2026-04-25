import { BrandingPanel } from "@/components/auth/branding-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-[100dvh] min-h-screen grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]">
      <div className="relative flex min-h-[100dvh] min-h-screen w-full justify-center">
        {children}
      </div>

      <BrandingPanel />
    </div>
  );
}
