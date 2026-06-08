"use client";

import { useSyncExternalStore } from "react";

const mql =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

function subscribe(cb: () => void) {
  mql?.addEventListener("change", cb);
  return () => mql?.removeEventListener("change", cb);
}

function getSnapshot() {
  return mql?.matches ?? false;
}

/**
 * Returns true if the user has prefers-reduced-motion enabled.
 * Updates reactively when the user changes their system preference.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
