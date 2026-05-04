import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LandingFeatureCardProps = {
  children?: ReactNode;
  className?: string;
  description: string;
  icon?: LucideIcon;
  title: string;
};

export function LandingFeatureCard({
  children,
  className,
  description,
  icon: Icon,
  title,
}: LandingFeatureCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(13,122,107,0.08),transparent_42%,rgba(15,23,42,0.05))] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        {Icon ? (
          <span className="mb-5 flex size-10 items-center justify-center rounded-lg bg-neutral-950 text-white">
            <Icon className="size-5" />
          </span>
        ) : null}
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </article>
  );
}
