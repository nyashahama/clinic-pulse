"use client";

import { useCallback, useEffect, type ChangeEvent } from "react";
import { Search, X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export type WorkspaceCommandPaletteSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  onSelect: () => void;
};

export type WorkspaceCommandPaletteAction = {
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
};

export type WorkspaceCommandPaletteProps = {
  actions: WorkspaceCommandPaletteAction[];
  footerText?: string;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSubmitSearch: () => void;
  open: boolean;
  query: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchResults: WorkspaceCommandPaletteSearchResult[];
};

export function WorkspaceCommandPalette({
  actions,
  footerText,
  onOpenChange,
  onQueryChange,
  onSubmitSearch,
  open,
  query,
  searchLabel = "Search",
  searchPlaceholder = "Search or run a command",
  searchResults,
}: WorkspaceCommandPaletteProps) {
  const closePalette = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePalette();
      }

      if (
        (event.key === "Enter" || event.key === "ArrowRight") &&
        event.target instanceof HTMLInputElement
      ) {
        event.preventDefault();
        onSubmitSearch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePalette, onSubmitSearch, open]);

  if (!open) {
    return null;
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ClinicPulse command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-950/60 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={closePalette}
    >
      <h2 id="command-palette-title" className="sr-only">
        ClinicPulse command palette
      </h2>
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="sr-only">Search</span>
          <Search className="size-4 text-muted-foreground" />
          <input
            role="searchbox"
            aria-labelledby="command-palette-title"
            aria-describedby="command-palette-help"
            autoFocus
            value={query}
            onChange={onInputChange}
            placeholder={searchPlaceholder}
            className="h-8 flex-1 bg-transparent text-sm text-popover-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closePalette}
            aria-label="Close command palette"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto border-b border-border md:grid-cols-[1.1fr,0.9fr]">
          <section className="border-b border-border p-3 md:border-b-0 md:border-r">
            <p
              id="command-palette-help"
              className="mb-2 px-2 text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase"
            >
              {searchLabel}
            </p>
            <ul className="space-y-1">
              {searchResults.map((result) => {
                const ResultIcon = result.icon ?? Search;

                return (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => {
                        result.onSelect();
                        closePalette();
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-popover-foreground">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      </span>
                      <ResultIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="p-3">
            <p className="mb-2 px-2 text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase">
              Actions
            </p>
            <ul className="space-y-1">
              {actions.map((command) => {
                const Icon = command.icon;

                return (
                  <li key={command.label}>
                    <button
                      aria-label={`${command.label}: ${command.hint}`}
                      type="button"
                      onClick={() => {
                        command.run();
                        closePalette();
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-popover-foreground">
                          {command.label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {command.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {footerText ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
            <span>{footerText}</span>
            <span className="font-mono text-[11px] text-muted-foreground">Esc</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
