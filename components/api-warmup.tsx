"use client";

import { useEffect } from "react";

export function ApiWarmup() {
  useEffect(() => {
    fetch("/api/clinicpulse/healthz", { cache: "no-store" }).catch(() => {});
  }, []);

  return null;
}
