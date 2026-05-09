import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const logoComponentPath = path.join(
  process.cwd(),
  "components",
  "brand",
  "clinicpulse-logo.tsx",
);
const faviconPath = path.join(process.cwd(), "app", "icon.svg");
const appleIconPath = path.join(process.cwd(), "app", "apple-icon.tsx");

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

describe("ClinicPulse premium metadata icons", () => {
  it("uses the Obsidian Signal palette and geometry in app icons", () => {
    const faviconSource = readFileSync(faviconPath, "utf8");
    const appleIconSource = readFileSync(appleIconPath, "utf8");

    for (const source of [faviconSource, appleIconSource]) {
      expect(source).toContain("#06251F");
      expect(source).toContain("#7AF2C5");
      expect(source).toContain("M43.5 12.5");
      expect(source).not.toContain("M32 8.5 49 14.8");
    }
  });
});
