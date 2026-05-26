"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, LocateFixed, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildFieldLocationVerification,
  type FieldLocationVerification,
} from "@/lib/demo/field-location-verification";
import { cn } from "@/lib/utils";

type FieldLocationVerificationPanelProps = {
  clinic: {
    latitude: number;
    longitude: number;
    name: string;
  };
  onVerificationChange?: (verification: FieldLocationVerification | null) => void;
};

const toneStyles = {
  clear:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-100",
  attention:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100",
  blocked:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100",
} satisfies Record<FieldLocationVerification["tone"], string>;

function getErrorMessage(error: GeolocationPositionError | Error | null) {
  if (!error) {
    return "Location could not be captured. Check browser permission and GPS.";
  }

  return error.message || "Location could not be captured. Check browser permission and GPS.";
}

export function FieldLocationVerificationPanel({
  clinic,
  onVerificationChange,
}: FieldLocationVerificationPanelProps) {
  const clinicVerificationKey = `${clinic.name}:${clinic.latitude}:${clinic.longitude}`;
  const activeClinicKeyRef = useRef(clinicVerificationKey);
  const mountedRef = useRef(true);
  const [verification, setVerification] = useState<FieldLocationVerification | null>(null);
  const [error, setError] = useState<GeolocationPositionError | Error | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    activeClinicKeyRef.current = clinicVerificationKey;
  }, [clinicVerificationKey]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleVerify = () => {
    setError(null);

    if (!navigator.geolocation) {
      setVerification(null);
      onVerificationChange?.(null);
      setError(new Error("Geolocation is not supported by this browser."));
      return;
    }

    const requestedClinic = clinic;
    const requestedClinicKey = clinicVerificationKey;

    setCapturing(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current || activeClinicKeyRef.current !== requestedClinicKey) {
          return;
        }

        const nextVerification = buildFieldLocationVerification({
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
          clinic: requestedClinic,
          position: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });

        setVerification(nextVerification);
        onVerificationChange?.(nextVerification);
        setCapturing(false);
      },
      (captureError) => {
        if (!mountedRef.current || activeClinicKeyRef.current !== requestedClinicKey) {
          return;
        }

        setVerification(null);
        onVerificationChange?.(null);
        setError(captureError);
        setCapturing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
      },
    );
  };

  return (
    <section className="border-b border-border-subtle bg-bg-default p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-content-subtle">
            GPS check-in
          </p>
          <h2 className="text-lg font-semibold tracking-normal text-content-emphasis">
            Visit verification
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-content-subtle">
            Capture browser location before submitting the active clinic report. The
            check stays on screen so the field worker can see distance and GPS quality.
          </p>
        </div>
        <Button
          type="button"
          variant={verification ? "outline" : "default"}
          onClick={handleVerify}
          disabled={capturing}
          className="w-full lg:w-auto"
        >
          {capturing ? "Capturing..." : "Verify active stop"}
          <LocateFixed className="size-3.5" />
        </Button>
      </div>

      {verification ? (
        <div
          className={cn(
            "mt-4 grid gap-3 rounded-lg border p-3 text-sm lg:grid-cols-[1fr_auto]",
            toneStyles[verification.tone],
          )}
        >
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 font-semibold">
              {verification.tone === "blocked" ? (
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {verification.statusLabel}
            </p>
            <p className="mt-1 text-xs leading-5">
              {verification.distanceLabel} from {clinic.name}
            </p>
          </div>
          <div className="grid gap-1 text-xs lg:text-right">
            <span>{verification.accuracyLabel}</span>
            <span className="inline-flex items-center gap-1 lg:justify-end">
              <MapPin className="size-3.5" />
              {verification.coordinateLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3 text-sm text-content-subtle">
          No visit location captured for {clinic.name} yet.
        </div>
      )}

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100">
          {getErrorMessage(error)}
        </div>
      ) : null}
    </section>
  );
}
