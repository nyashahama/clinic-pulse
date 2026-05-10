"use client";

import { CommandPalette } from "@/components/demo/command-palette";
import { LiveIndicator } from "@/components/demo/live-indicator";
import {
  WorkspaceShell,
  type WorkspaceShellProps,
} from "@/components/product/workspace-shell";

export type DemoWorkspaceShellProps = Omit<
  WorkspaceShellProps,
  "headerStatusIndicator" | "renderCommandPalette"
> & {
  districtConsoleHref?: string;
};

export function DemoWorkspaceShell({
  districtConsoleHref = "/district",
  ...props
}: DemoWorkspaceShellProps) {
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
