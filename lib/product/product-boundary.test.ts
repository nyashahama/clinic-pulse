import { readdirSync, readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      return listFiles(entryPath);
    }

    return /\.(ts|tsx)$/.test(entry) ? [entryPath] : [];
  });
}

describe("product component boundaries", () => {
  it("keeps product components independent from demo modules", () => {
    const productComponentsDir = path.join(process.cwd(), "components", "product");
    const productFiles = listFiles(productComponentsDir);
    const workspaceImportPattern = /@\/(?:components|lib)\/demo\//;

    const violations = productFiles.flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");

      return workspaceImportPattern.test(source)
        ? [path.relative(process.cwd(), filePath)]
        : [];
    });

    expect(violations).toEqual([]);
  });

  it("keeps product workspace files out of demo-named paths except development seeds", () => {
    const allowedDemoNamedPaths = new Set([
      "services/api/migrations/0002_seed_demo_data.sql",
    ]);
    const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean);

    const legacyNamedPaths = trackedFiles.filter((filePath) => {
      if (allowedDemoNamedPaths.has(filePath)) {
        return false;
      }

      return filePath
        .split("/")
        .some((segment) => /\bdemo\b/i.test(segment) || /demo/i.test(segment));
    });

    expect(legacyNamedPaths).toEqual([]);
  });
});
