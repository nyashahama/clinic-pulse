"use client";

import { useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const MOBILE_RAIL_QUERY = "(max-width: 639px)";

function subscribeToMobileRail(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_RAIL_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMobileRailSnapshot() {
  return window.matchMedia(MOBILE_RAIL_QUERY).matches;
}

function getServerMobileRailSnapshot() {
  return true;
}

export function MobileSwipeRail({
  ariaLabel,
  children,
  className,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const isMobileRail = useSyncExternalStore(
    subscribeToMobileRail,
    getMobileRailSnapshot,
    getServerMobileRailSnapshot,
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isMobileRail || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;

    event.preventDefault();
    event.currentTarget.scrollBy({
      behavior: "smooth",
      left:
        event.key === "ArrowRight"
          ? event.currentTarget.clientWidth * 0.82
          : event.currentTarget.clientWidth * -0.82,
    });
  };

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300",
        className,
      )}
      onKeyDown={handleKeyDown}
      role="region"
      tabIndex={isMobileRail ? 0 : undefined}
    >
      {children}
    </div>
  );
}
