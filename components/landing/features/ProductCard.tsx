"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
  hasShimmer?: boolean;
  hasActiveOnHover?: boolean;
  hasMotion?: boolean;
  outerClassName?: string;
  innerClassName?: string;
}

export function Panel({
  children,
  className,
  hasShimmer = false,
  hasActiveOnHover = false,
  hasMotion = false,
  outerClassName,
  innerClassName,
}: PanelProps) {
  return (
    <motion.div
      className={cn(
        "relative w-full",
        hasActiveOnHover && "group",
        outerClassName,
      )}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-neutral-900/60 border border-white/[0.06]",
          "backdrop-blur-sm",
          "transition-all duration-300",
          "hover:border-emerald-500/20 hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 focus:ring-offset-neutral-950",
          innerClassName,
        )}
      >
        {hasShimmer && (
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
            }}
            aria-hidden="true"
          />
        )}
        {hasMotion && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "radial-gradient(circle at center, rgba(16,185,129,0.08), transparent 70%)",
            }}
            aria-hidden="true"
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}

interface ProductCardProps {
  feature: {
    title: string;
    subtitle: string;
    description: string;
    icon: LucideIcon;
    highlights: string[];
    visual: ReactNode;
    href: string;
    isMain?: boolean;
    alignLeft?: boolean;
  };
  className?: string;
}

export function ProductCard({
  feature,
  className,
}: ProductCardProps) {
  const { title, subtitle, description, icon: Icon, highlights, visual, href, isMain, alignLeft = true } = feature;

  return (
    <Panel
      hasShimmer={!isMain}
      hasActiveOnHover={true}
      hasMotion={isMain}
      outerClassName={cn(
        "col-span-1",
        isMain ? "md:col-span-6 lg:col-span-8" : "md:col-span-6 lg:col-span-4",
        className,
      )}
      innerClassName={cn(
        "flex flex-col sm:flex-row gap-4 items-start sm:items-center lg:items-start justify-between",
        "p-5 sm:py-7 lg:p-7",
        isMain ? "lg:max-w-none" : "lg:max-w-[320px]",
        alignLeft ? "lg:items-start lg:text-left" : "lg:items-end lg:text-right",
      )}
    >
      <Link
        href={href}
        className={cn(
          "flex flex-1 flex-col gap-3 sm:gap-5",
          isMain ? "lg:flex-row lg:gap-7 lg:items-center" : "lg:flex-col",
        )}
      >
        <div className={cn(
          "flex flex-col gap-2 sm:gap-3 w-full",
          isMain ? "lg:w-[55%]" : "lg:w-full",
          alignLeft ? "items-start text-left" : "items-end text-right",
        )}>
          <div className="flex items-center gap-2 text-white/70">
            <span className="flex size-5 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Icon className="size-3.5" />
            </span>
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">{title}</h2>
          </div>
          <div className="flex-1 flex flex-col justify-between gap-2">
            <p className="text-sm text-white/50 leading-relaxed">{subtitle}</p>
            {highlights && highlights.length > 0 && (
              <ul className="hidden lg:flex flex-col gap-1.5 text-sm text-white/40">
                {highlights.map((highlight, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="size-1 rounded-full bg-emerald-500/50" />
                    {highlight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className={cn(
          "relative w-full aspect-square sm:aspect-video lg:aspect-square",
          isMain ? "lg:w-[45%] lg:min-h-[300px]" : "lg:w-full lg:h-[220px]",
          "shrink-0",
        )}>
          {visual}
        </div>
      </Link>
    </Panel>
  );
}

function Link({ children, href, className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) {
  return <a href={href} className={className} {...props}>{children}</a>;
}
