import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const logoComponentPath = path.join(
  process.cwd(),
  "components",
  "brand",
  "clinicpulse-logo.tsx",
);

describe("ClinicPulse premium logo component", () => {
  it("exposes the Obsidian Signal shared mark and lockup", () => {
    const source = readFileSync(logoComponentPath, "utf8");

    expect(source).toContain("ClinicPulseMark");
    expect(source).toContain("ClinicPulseLogo");
    expect(source).toContain('data-brand-mark="clinicpulse"');
    expect(source).toContain("bg-[#06251F]");
    expect(source).toContain("#7AF2C5");
    expect(source).not.toContain("M16 3.75 25 7.1");
  });
});
