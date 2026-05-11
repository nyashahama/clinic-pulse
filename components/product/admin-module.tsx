import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type AdminTone = "clear" | "attention" | "blocked" | "info";

export type AdminAction = {
  label: ReactNode;
  buttonProps?: Omit<ComponentProps<typeof Button>, "children">;
};

export type AdminModuleHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: AdminAction[];
  className?: string;
};

export function AdminModuleHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: AdminModuleHeaderProps) {
  return (
    <section
      data-admin-module
      className={cn(
        "rounded-lg border border-border-subtle bg-bg-default px-4 py-4 text-content-default shadow-sm sm:px-5",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-xl font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions?.length ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions.map((action, index) => (
              <Button key={index} size="sm" {...action.buttonProps}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type AdminMetric = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: AdminTone;
};

export type AdminMetricStripProps = {
  metrics: AdminMetric[];
  className?: string;
};

const metricToneClassName: Record<AdminTone, string> = {
  clear: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100",
  blocked:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  info: "border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100",
};

export function AdminMetricStrip({
  metrics,
  className,
}: AdminMetricStripProps) {
  return (
    <section
      data-admin-module
      className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}
    >
      {metrics.map((metric, index) => {
        const tone = metric.tone ?? "info";

        return (
          <div
            key={index}
            className={cn(
              "min-w-0 rounded-lg border px-4 py-3 shadow-sm",
              metricToneClassName[tone],
            )}
          >
            <p className="break-words text-xs font-medium text-current/75">
              {metric.label}
            </p>
            <p className="mt-1 break-words text-2xl font-semibold leading-tight">
              {metric.value}
            </p>
            {metric.detail ? (
              <p className="mt-2 break-words text-xs leading-4 text-current/75">
                {metric.detail}
              </p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

export type AdminFilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function AdminFilterBar({ children, className }: AdminFilterBarProps) {
  return (
    <div
      data-admin-module
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-default p-3 text-content-default shadow-sm sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type AdminEvidenceColumn<Row> = {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: Row) => ReactNode;
};

export type AdminEvidenceTableProps<Row> = {
  label: string;
  columns: AdminEvidenceColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row, index: number) => string;
  emptyState?: ReactNode;
  className?: string;
};

export function AdminEvidenceTable<Row>({
  label,
  columns,
  rows,
  getRowKey,
  emptyState,
  className,
}: AdminEvidenceTableProps<Row>) {
  return (
    <section
      data-admin-module
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-lg border border-border-subtle bg-bg-default text-content-default shadow-sm",
        className,
      )}
    >
      {rows.length ? (
        <Table>
          <TableHeader className="bg-bg-muted/60">
            <TableRow className="border-border-subtle bg-bg-muted/60 hover:bg-bg-muted/60">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "h-11 px-3 text-xs font-semibold uppercase tracking-normal text-content-subtle",
                    column.className,
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-subtle [&_tr]:border-0">
            {rows.map((row, rowIndex) => (
              <TableRow
                key={getRowKey(row, rowIndex)}
                className="hover:bg-bg-muted/60"
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn("px-3 py-3 text-content-default", column.className)}
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        (emptyState ?? (
          <AdminEmptyState
            title="No evidence available"
            description="There are no records to show for this module."
          />
        ))
      )}
    </section>
  );
}

export type AdminEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: AdminAction;
  className?: string;
};

export function AdminEmptyState({
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      data-admin-module
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-lg text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button className="mt-2" size="sm" {...action.buttonProps}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
