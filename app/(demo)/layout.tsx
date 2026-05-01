import type { ReactNode } from "react";

import { DemoShell } from "@/components/demo/demo-shell";
import { DemoStoreProvider } from "@/lib/demo/demo-store";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <DemoStoreProvider>
      <DemoShell>{children}</DemoShell>
    </DemoStoreProvider>
  );
}
