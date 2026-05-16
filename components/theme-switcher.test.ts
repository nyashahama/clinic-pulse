import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ThemeSwitcher } from "@/components/theme-switcher";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    theme: "system",
  }),
}));

describe("ThemeSwitcher", () => {
  it("renders visible theme controls before the client theme state mounts", () => {
    const html = renderToStaticMarkup(React.createElement(ThemeSwitcher));

    expect(html).toContain("Use system theme");
    expect(html).toContain("Use light theme");
    expect(html).toContain("Use dark theme");
    expect(html).toContain('role="group"');
    expect(html).not.toContain("w-[6.75rem]");
  });
});
