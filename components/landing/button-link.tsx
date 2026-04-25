import { cn } from "@/lib/utils";
import Link from "next/link";
import { ComponentProps } from "react";

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
  ...rest
}: {
  variant?: "primary" | "secondary";
  href: string;
} & ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 w-fit items-center whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition-all",
        variant === "primary" &&
          "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200",
        variant === "secondary" &&
          "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 hover:border-neutral-400",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
