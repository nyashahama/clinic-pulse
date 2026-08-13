import { ReactNode } from "react";

import { MaxWidthWrapper } from "@/components/ui/max-width-wrapper";
import { cn } from "@/lib/utils";

type LandingSectionProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
  spacing?: "default" | "compact" | "none";
};

const landingSectionSpacingClassNames = {
  default: "py-14 sm:py-18 lg:py-24",
  compact: "py-9 sm:py-10 lg:py-12",
  none: "py-0 sm:py-0 lg:py-0",
} satisfies Record<NonNullable<LandingSectionProps["spacing"]>, string>;

export function LandingSection({
  children,
  className,
  contentClassName,
  id,
  spacing = "default",
}: LandingSectionProps) {
  return (
    <section
      id={id}
      data-public-surface="light"
      className={cn("relative bg-[#f7faf9] text-[#17201e]", className)}
    >
      <MaxWidthWrapper
        className={cn(
          "border-x-neutral-200/70",
          landingSectionSpacingClassNames[spacing],
          contentClassName,
        )}
      >
        {children}
      </MaxWidthWrapper>
    </section>
  );
}

type LandingSectionHeaderProps = {
  align?: "left" | "center";
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
};

export function LandingSectionHeader({
  align = "left",
  className,
  description,
  eyebrow,
  title,
}: LandingSectionHeaderProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0D7A6B]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className="font-display text-3xl leading-[1.05] tracking-[-0.035em] text-[#17201e] sm:text-4xl lg:text-5xl"
        style={{ textWrap: "balance" }}
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">{description}</p>
      ) : null}
    </div>
  );
}
