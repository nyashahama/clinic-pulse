"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { PartnerReadinessPanel } from "@/components/demo/partner-readiness-panel";
import type { PartnerReadinessApiResponse } from "@/lib/demo/api-types";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  createOneTimePartnerApiKeySecret,
  createOneTimePartnerWebhookSecret,
  type OneTimePartnerApiKeySecret,
  type OneTimePartnerWebhookSecret,
} from "@/lib/demo/partner-readiness";
import {
  createPartnerApiKeyAction,
  createPartnerExportAction,
  createPartnerWebhookAction,
  testPartnerWebhookAction,
} from "../actions";

type PartnerReadinessPageClientProps = {
  readiness: PartnerReadinessApiResponse;
};

type PartnerReadinessAction =
  | "create-key"
  | "create-webhook"
  | "generate-export"
  | "test-webhook";

function getPartnerActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Partner readiness action failed.";
}

export function PartnerReadinessPageClient({
  readiness,
}: PartnerReadinessPageClientProps) {
  const router = useRouter();
  const { state } = useDemoStore();
  const [partnerActionPending, setPartnerActionPending] =
    useState<PartnerReadinessAction | null>(null);
  const [partnerActionError, setPartnerActionError] = useState<string | null>(null);
  const [oneTimeApiKeySecret, setOneTimeApiKeySecret] =
    useState<OneTimePartnerApiKeySecret | null>(null);
  const [oneTimeWebhookSecret, setOneTimeWebhookSecret] =
    useState<OneTimePartnerWebhookSecret | null>(null);
  const partnerActionPendingRef = useRef<PartnerReadinessAction | null>(null);
  const partnerActionInFlight = partnerActionPending !== null;

  const runPartnerAction = async <Result,>(
    action: PartnerReadinessAction,
    mutate: () => Promise<Result>,
    onSuccess?: (result: Result) => void,
  ) => {
    if (partnerActionPendingRef.current) {
      return;
    }

    partnerActionPendingRef.current = action;
    setPartnerActionPending(action);
    setPartnerActionError(null);

    try {
      const result = await mutate();
      onSuccess?.(result);
      router.refresh();
    } catch (error) {
      setPartnerActionError(getPartnerActionErrorMessage(error));
    } finally {
      partnerActionPendingRef.current = null;
      setPartnerActionPending(null);
    }
  };

  const handleCreateDemoKey = () => {
    if (partnerActionPendingRef.current) {
      return;
    }

    setOneTimeApiKeySecret(null);
    void runPartnerAction(
      "create-key",
      () =>
        createPartnerApiKeyAction({
          name: "Demo partner integration",
          environment: "demo",
          scopes: ["clinics:read", "status:read", "alternatives:read", "exports:read"],
          allowedDistricts: [state.district],
        }),
      (result) => setOneTimeApiKeySecret(createOneTimePartnerApiKeySecret(result)),
    );
  };

  const handleCreatePartnerWebhook = () => {
    if (partnerActionPendingRef.current) {
      return;
    }

    setOneTimeWebhookSecret(null);
    void runPartnerAction(
      "create-webhook",
      () =>
        createPartnerWebhookAction({
          name: "Demo partner webhook",
          targetUrl: "https://partner.example.test/webhooks/clinicpulse",
          eventTypes: ["clinic.status_changed"],
        }),
      (result) => setOneTimeWebhookSecret(createOneTimePartnerWebhookSecret(result)),
    );
  };

  const handleGeneratePartnerExport = () => {
    void runPartnerAction("generate-export", () =>
      createPartnerExportAction({
        format: "json",
        scope: { district: state.district },
      }),
    );
  };

  const handleTestPartnerWebhook = (subscriptionId: number) => {
    void runPartnerAction("test-webhook", () => testPartnerWebhookAction(subscriptionId));
  };

  return (
    <div data-admin-module="partner-readiness">
      <PartnerReadinessPanel
        readiness={readiness}
        onCreateDemoKey={handleCreateDemoKey}
        onCreateWebhook={handleCreatePartnerWebhook}
        onGenerateExport={handleGeneratePartnerExport}
        onTestWebhook={handleTestPartnerWebhook}
        pendingActions={{
          createDemoKey: partnerActionInFlight,
          createWebhook: partnerActionInFlight,
          generateExport: partnerActionInFlight,
          testWebhook: partnerActionInFlight,
        }}
        actionError={partnerActionError}
        oneTimeApiKeySecret={oneTimeApiKeySecret}
        oneTimeWebhookSecret={oneTimeWebhookSecret}
        onClearOneTimeApiKeySecret={() => setOneTimeApiKeySecret(null)}
        onClearOneTimeWebhookSecret={() => setOneTimeWebhookSecret(null)}
      />
    </div>
  );
}
