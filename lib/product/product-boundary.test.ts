import { readdirSync, readFileSync, statSync } from "node:fs";
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
    const demoImportPattern = /@\/(?:components|lib)\/demo\//;

    const violations = productFiles.flatMap((filePath) => {
      const source = readFileSync(filePath, "utf8");

      return demoImportPattern.test(source)
        ? [path.relative(process.cwd(), filePath)]
        : [];
    });

    expect(violations).toEqual([]);
  });
});
