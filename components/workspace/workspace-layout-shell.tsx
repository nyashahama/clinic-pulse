"use client";

import { CommandPalette } from "@/components/workspace/command-palette";
import { LiveIndicator } from "@/components/workspace/live-indicator";
import {
  WorkspaceShell,
  type WorkspaceShellProps,
} from "@/components/product/workspace-shell";

export type WorkspaceLayoutShellProps = Omit<
  WorkspaceShellProps,
  "headerStatusIndicator" | "renderCommandPalette"
> & {
  districtConsoleHref?: string;
};

export function WorkspaceLayoutShell({
  districtConsoleHref = "/district",
  ...props
}: WorkspaceLayoutShellProps) {
  return (
    <WorkspaceShell
      {...props}
      headerStatusIndicator={<LiveIndicator />}
      renderCommandPalette={(paletteProps) => (
        <CommandPalette
          {...paletteProps}
          districtConsoleHref={districtConsoleHref}
        />
      )}
    />
  );
}
