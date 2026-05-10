import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MetricTile } from "@/components/product/metric-tile";
import { ProductPanel } from "@/components/product/panel";
import { ProductResponsiveTable } from "@/components/product/responsive-table";
import { SurfaceState } from "@/components/product/surface-state";

describe("product surface primitives", () => {
  it("renders panel title, description, metadata, and content", () => {
    const html = renderToStaticMarkup(
      createElement(
        ProductPanel,
        {
          title: "Reporting coverage",
          description: "District submission health",
          metadata: "Updated now",
        },
        createElement("p", null, "Coverage rows"),
      ),
    );

    expect(html).toContain("Reporting coverage");
    expect(html).toContain("District submission health");
    expect(html).toContain("Updated now");
    expect(html).toContain("Coverage rows");
  });

  it("renders error state with alert semantics", () => {
    const html = renderToStaticMarkup(
      createElement(SurfaceState, {
        variant: "error",
        title: "Clinic table unavailable",
        description: "Retry before reviewing escalations.",
      }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Clinic table unavailable");
    expect(html).toContain("Retry before reviewing escalations.");
  });

  it("renders responsive table with an accessible label", () => {
    const html = renderToStaticMarkup(
      createElement(
        ProductResponsiveTable,
        { label: "Clinic operating table" },
        createElement(
          "table",
          null,
          createElement(
            "tbody",
            null,
            createElement(
              "tr",
              null,
              createElement("td", null, "Mamelodi East"),
            ),
          ),
        ),
      ),
    );

    expect(html).toContain('aria-label="Clinic operating table"');
    expect(html).toContain("Mamelodi East");
  });

  it("renders metric tile content and trend context", () => {
    const html = renderToStaticMarkup(
      createElement(MetricTile, {
        label: "Open alerts",
        count: 8,
        description: "Active district incidents",
        trend: { value: "+2", direction: "up", context: "since morning" },
      }),
    );

    expect(html).toContain("Open alerts");
    expect(html).toContain("8");
    expect(html).toContain("Active district incidents");
    expect(html).toContain("since morning");
  });
});
