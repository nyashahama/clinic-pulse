"use client";

import { useState } from "react";

export function PasswordToggle() {
  const [visible, setVisible] = useState(false);

  return {
    visible,
    toggle: (
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="flex items-center justify-center rounded-md p-0.5 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-white/30 dark:hover:text-white/60"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    ),
    type: visible ? "text" : "password",
  };
}
