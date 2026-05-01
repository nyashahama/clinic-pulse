import type { ReactNode } from "react";

import { DemoStoreProvider } from "@/lib/demo/demo-store";

export default function BookDemoLayout({ children }: { children: ReactNode }) {
  return <DemoStoreProvider>{children}</DemoStoreProvider>;
}
