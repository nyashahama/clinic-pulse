import type { ReactNode } from "react";

import { WorkspaceStoreProvider } from "@/lib/workspace/workspace-store";

export default function BookWalkthroughLayout({ children }: { children: ReactNode }) {
  return <WorkspaceStoreProvider>{children}</WorkspaceStoreProvider>;
}
