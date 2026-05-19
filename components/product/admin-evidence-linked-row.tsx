"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminEvidenceLinkedRowProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
  href: string;
};

const INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='link']",
  "[data-row-navigation-ignore]",
].join(",");

export function AdminEvidenceLinkedRow({
  ariaLabel,
  children,
  className,
  href,
}: AdminEvidenceLinkedRowProps) {
  const navigate = () => {
    window.location.assign(href);
  };

  const handleClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      shouldIgnoreRowNavigation(event.target)
    ) {
      return;
    }

    navigate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (
      shouldIgnoreRowNavigation(event.target) ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    navigate();
  };

  return (
    <TableRow
      aria-label={ariaLabel}
      className={cn(
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      data-row-href={href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {children}
    </TableRow>
  );
}

function shouldIgnoreRowNavigation(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(INTERACTIVE_SELECTOR));
}
