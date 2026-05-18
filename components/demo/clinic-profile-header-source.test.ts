import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("ClinicProfileHeader source", () => {
  it("loads the above-fold clinic hero image eagerly", () => {
    const source = readFileSync(
      join(process.cwd(), "components/demo/clinic-profile-header.tsx"),
      "utf8",
    );

    const imageBlock = source.slice(
      source.indexOf("<Image"),
      source.indexOf("/>", source.indexOf("<Image")),
    );

    expect(imageBlock).toContain('loading="eager"');
    expect(imageBlock).toContain('fetchPriority="high"');
  });
});
