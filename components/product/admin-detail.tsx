import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminDetailField = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

export function AdminDetailShell({
  eyebrow,
  title,
  description,
  returnHref,
  returnLabel,
  children,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  returnHref: string;
  returnLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Link
        href={returnHref}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "w-fit",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        <span>{returnLabel}</span>
      </Link>
      <section
        data-admin-module
        className="rounded-lg border border-border-subtle bg-bg-default px-4 py-4 text-content-default shadow-sm sm:px-5"
      >
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-xl font-semibold leading-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </section>
      {children}
    </div>
  );
}

export function AdminDetailFieldGrid({
  fields,
  className,
}: {
  fields: AdminDetailField[];
  className?: string;
}) {
  return (
    <section
      data-admin-module
      className={cn(
        "grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {fields.map((field, index) => (
        <div
          key={index}
          className={cn("min-w-0 rounded-md border border-border-subtle p-3", field.className)}
        >
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {field.label}
          </p>
          <div className="mt-1 min-w-0 break-words text-sm font-medium text-foreground">
            {field.value}
          </div>
        </div>
      ))}
    </section>
  );
}

export function AdminDetailJsonBlock({
  title,
  value,
}: {
  title: ReactNode;
  value: unknown;
}) {
  return (
    <section
      data-admin-module
      className="rounded-lg border border-border-subtle bg-bg-default p-4 text-content-default shadow-sm"
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <pre className="mt-3 max-h-[28rem] overflow-auto rounded-md bg-bg-muted p-3 text-xs leading-5 text-content-default">
        {formatAdminDetailJson(value)}
      </pre>
    </section>
  );
}

export function formatAdminDetailList(values: string[]) {
  return values.length ? values.join(", ") : "None recorded";
}

export function formatAdminDetailRecord(value: Record<string, unknown>) {
  const entries = Object.entries(value);

  if (!entries.length) {
    return "None recorded";
  }

  return entries.map(([key, entryValue]) => `${key}: ${String(entryValue)}`).join("; ");
}

export function formatAdminDetailJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}
