"use client";

import { useMemo } from "react";
import { BookCheck, CodeXml, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/demo/section-header";

const REQUEST_EXAMPLES = [
  {
    title: "GET clinics",
    method: "GET",
    path: "/v1/clinics?province=gauteng&status=operational",
    headers: [
      "Authorization: Bearer demo_token",
      "Accept: application/json",
    ],
    body: "",
    response:
      '{ "items": [{ "id": "clinic-mamelodi-east", "name": "Mamelodi East Community Clinic", "status": "operational", "freshness": "fresh" }], "count": 1 }',
  },
  {
    title: "POST report",
    method: "POST",
    path: "/v1/reports",
    headers: [
      "Authorization: Bearer demo_token",
      "Content-Type: application/json",
    ],
    body: `{\n  "clinicId": "clinic-mamelodi-east",\n  "status": "operational",\n  "reason": "Clinic re-opened after maintenance check.",\n  "source": "clinic_coordinator",\n  "submittedAt": "2026-05-01T07:03:00.000Z"\n}`,
    response:
      '{ "id": "rpt-987", "result": "accepted", "receivedAt": "2026-05-01T07:03:00.000Z" }',
  },
  {
    title: "GET reroute recommendations",
    method: "GET",
    path: "/v1/recommendations?clinicId=clinic-mamelodi-east&service=primary care",
    headers: ["Authorization: Bearer demo_token", "Accept: application/json"],
    body: "",
    response:
      '{ "recommendations": [{ "clinicId": "clinic-akasia-hills", "distanceKm": 3.4, "estimatedMinutes": 11, "services": ["Primary care", "Pharmacy"] }], "source": "policy-engine-v1" }',
  },
];

function formatCodeBlock(value: string) {
  return value;
}

type APIPreviewProps = {
  clinicCount: number;
  onOpen?: () => void;
};

export function APIPreview({ clinicCount, onOpen }: APIPreviewProps) {
  const endpointCount = REQUEST_EXAMPLES.length;

  const clinicMetric = useMemo(
    () => `${clinicCount} seeded clinics`,
    [clinicCount],
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Builder interface"
        title="API preview"
        description={`Mock partner API surface used by founder demos with ${clinicMetric}.`}
      />

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <p className="text-sm font-medium text-content-emphasis">
            Available endpoint count: {endpointCount}
          </p>
          <p className="mt-1 text-sm text-content-subtle">
            Read-only / write-safe demo endpoints with deterministic local fixtures.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 max-w-full"
            onClick={() => onOpen?.()}
          >
            <BookCheck className="size-4" />
            Mark demo API docs as reviewed
            <Copy className="size-3.5" />
          </Button>
        </div>

        <div className="grid gap-3">
          {REQUEST_EXAMPLES.map((entry) => (
            <article
              key={entry.title}
              className="min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-default"
            >
              <div className="border-b border-border-subtle px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-bg-subtle px-2 py-1 text-[11px] font-semibold">
                    {entry.method}
                  </span>
                  <span className="font-medium text-content-emphasis">{entry.title}</span>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-content-subtle">
                  {entry.path}
                </p>
              </div>

              <div className="grid min-w-0 gap-3 p-3 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-content-subtle">
                    Request
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-subtle p-2 text-[11px] leading-6">
                    <span className="font-mono text-content-subtle">
                      {entry.headers.map((header) => `\n${header}`)}
                      {"\n\n"}
                      {entry.body ? `${formatCodeBlock(entry.body)}\n` : "(no body required)\n"}
                    </span>
                  </pre>
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-content-subtle">
                    Response
                  </p>
                  <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-bg-subtle p-2 text-[11px] leading-6">
                    <span className="font-mono text-content-subtle">
                      <CodeXml className="size-4" />
                      {formatCodeBlock(entry.response)}
                    </span>
                  </pre>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
