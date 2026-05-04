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
  default: "py-16 sm:py-20 lg:py-24",
  compact: "py-10 sm:py-10 lg:py-10",
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
    <section id={id} className={cn("relative bg-[#eef3f2]", className)}>
      <MaxWidthWrapper className={cn(landingSectionSpacingClassNames[spacing], contentClassName)}>
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
        "grid gap-4",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className="font-display text-3xl leading-[1.08] text-neutral-950 sm:text-4xl lg:text-5xl"
        style={{ textWrap: "balance" }}
      >
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-neutral-600 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
