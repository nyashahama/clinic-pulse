"use client";

import { type MouseEvent, type ReactNode } from "react";

export const BOOKING_OPEN_EVENT = "clinicpulse:open-booking";

type BookingTriggerProps = {
  children?: ReactNode;
  className?: string;
};

export function BookingTrigger({
  children = "Book a walkthrough",
  className,
}: BookingTriggerProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent<HTMLAnchorElement>(BOOKING_OPEN_EVENT, {
        detail: event.currentTarget,
      }),
    );
  };

  return (
    <a
      href="/request-walkthrough"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
