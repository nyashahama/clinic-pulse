import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FieldReportReceipt,
  FieldReportToast,
} from "@/components/demo/report-feedback";

describe("field report feedback", () => {
  const feedback = {
    tone: "success" as const,
    title: "Report sent to review",
    message: "Waiting for district review.",
    detail: "Mamelodi East Community Clinic",
  };

  it("renders a persistent submission receipt under the report form", () => {
    const html = renderToStaticMarkup(
      createElement(FieldReportReceipt, {
        feedback,
      }),
    );

    expect(html).toContain('data-testid="field-report-receipt"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Report sent to review");
    expect(html).toContain("Waiting for district review.");
    expect(html).toContain("Mamelodi East Community Clinic");
    expect(html).toContain("dark:bg-emerald-400/10");
    expect(html).toContain("dark:border-emerald-400/30");
  });

  it("renders toast-style immediate feedback", () => {
    const html = renderToStaticMarkup(
      createElement(FieldReportToast, {
        feedback,
      }),
    );

    expect(html).toContain('data-testid="field-report-toast"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Report sent to review");
    expect(html).toContain("Waiting for district review.");
    expect(html).toContain("dark:bg-card");
    expect(html).toContain("dark:shadow-black/35");
    expect(html).toContain("dark:border-emerald-400/35");
  });
});
