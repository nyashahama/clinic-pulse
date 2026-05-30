import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

export type FieldReportFeedbackTone = "success" | "warning" | "error" | "info";

export type FieldReportFeedback = {
  tone: FieldReportFeedbackTone;
  title: string;
  message: string;
  detail?: string;
};

const feedbackStyles: Record<
  FieldReportFeedbackTone,
  {
    icon: typeof CheckCircle2;
    receipt: string;
    toast: string;
    iconClassName: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    receipt: "border-emerald-200 bg-emerald-50 text-emerald-950",
    toast: "border-emerald-200 bg-white text-emerald-950 shadow-emerald-950/10",
    iconClassName: "text-emerald-600",
  },
  warning: {
    icon: AlertCircle,
    receipt: "border-amber-200 bg-amber-50 text-amber-950",
    toast: "border-amber-200 bg-white text-amber-950 shadow-amber-950/10",
    iconClassName: "text-amber-600",
  },
  error: {
    icon: AlertCircle,
    receipt: "border-red-200 bg-red-50 text-red-950",
    toast: "border-red-200 bg-white text-red-950 shadow-red-950/10",
    iconClassName: "text-red-600",
  },
  info: {
    icon: Info,
    receipt: "border-sky-200 bg-sky-50 text-sky-950",
    toast: "border-sky-200 bg-white text-sky-950 shadow-sky-950/10",
    iconClassName: "text-sky-600",
  },
};

export function FieldReportReceipt({
  feedback,
}: {
  feedback: FieldReportFeedback | null;
}) {
  if (!feedback) {
    return null;
  }

  const style = feedbackStyles[feedback.tone];
  const Icon = style.icon;

  return (
    <div
      role={feedback.tone === "error" ? "alert" : "status"}
      aria-live={feedback.tone === "error" ? "assertive" : "polite"}
      data-testid="field-report-receipt"
      className={cn("grid gap-2 rounded-lg border px-3 py-2 text-sm", style.receipt)}
    >
      <div className="flex items-start gap-2">
        <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", style.iconClassName)} />
        <div className="min-w-0">
          <p className="font-semibold text-current">{feedback.title}</p>
          <p className="text-current/80">{feedback.message}</p>
        </div>
      </div>
      {feedback.detail ? (
        <p className="border-t border-current/10 pt-2 text-xs text-current/70">
          {feedback.detail}
        </p>
      ) : null}
    </div>
  );
}

export function FieldReportToast({
  feedback,
}: {
  feedback: FieldReportFeedback | null;
}) {
  if (!feedback) {
    return null;
  }

  const style = feedbackStyles[feedback.tone];
  const Icon = style.icon;

  return (
    <div
      role={feedback.tone === "error" ? "alert" : "status"}
      aria-live={feedback.tone === "error" ? "assertive" : "polite"}
      data-testid="field-report-toast"
      className={cn(
        "pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(calc(100vw-2rem),24rem)] items-start gap-3 rounded-lg border p-3 text-sm shadow-lg",
        style.toast,
      )}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", style.iconClassName)} />
      <div className="min-w-0">
        <p className="font-semibold text-current">{feedback.title}</p>
        <p className="text-current/75">{feedback.message}</p>
      </div>
    </div>
  );
}
