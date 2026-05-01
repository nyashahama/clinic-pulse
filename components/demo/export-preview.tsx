"use client";

import { useMemo, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  DownloadCloud,
  FileJson,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/demo/section-header";
import type { AuditEvent, ClinicRow, DemoLead, ReportEvent } from "@/lib/demo/types";

type ExportPayload = {
  generatedAt: string;
  district: string;
  province: string;
  clinics: Array<Pick<ClinicRow, "id" | "name" | "facilityCode" | "status" | "freshness" | "reason">>;
  leads: DemoLead[];
  alerts: AuditEvent[];
  reports: Array<Pick<ReportEvent, "id" | "clinicId" | "status" | "reason" | "receivedAt" | "source">>;
};

type ExportPreviewProps = {
  payload: ExportPayload;
  onOpen?: () => void;
};

function toCsv(payload: ExportPayload) {
  const header = [
    "clinicId",
    "facilityCode",
    "name",
    "status",
    "freshness",
    "reason",
  ];

  const clinicRows = payload.clinics
    .map(
      (clinic) =>
        `${clinic.id},${clinic.facilityCode},${JSON.stringify(clinic.name)},${clinic.status},${
          clinic.freshness
        },${JSON.stringify(clinic.reason)}`,
    )
    .join("\n");

  const leadHeader = ["leadName", "email", "organization", "interest", "status", "createdAt"];
  const leadRows = payload.leads
    .map(
      (lead) =>
        `${JSON.stringify(lead.name)},${JSON.stringify(lead.workEmail)},${JSON.stringify(
          lead.organization,
        )},${lead.interest},${lead.status},${lead.createdAt}`,
    )
    .join("\n");

  return [
    header.join(","),
    clinicRows,
    "",
    leadHeader.join(","),
    leadRows,
  ]
    .filter((segment) => segment.length > 0)
    .join("\n");
}

export function ExportPreview({ payload, onOpen }: ExportPreviewProps) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [copied, setCopied] = useState(false);

  const jsonText = useMemo(
    () => JSON.stringify(payload, null, 2),
    [payload],
  );
  const csvText = useMemo(() => toCsv(payload), [payload]);

  const previewText = format === "json" ? jsonText : csvText;
  const extension = format === "json" ? "json" : "csv";

  const onCopy = async () => {
    await navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const onDownload = () => {
    const blob = new Blob([previewText], {
      type: format === "json" ? "application/json" : "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const fileUrl = URL.createObjectURL(blob);

    link.href = fileUrl;
    link.download = `clinicpulse-export-${payload.generatedAt}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Founder package"
        title="Export preview"
        description="Generate an export blob to hand into analytics or BI tools during a founder pitch."
      />

      <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border-subtle bg-bg-subtle p-3">
        <div className="flex flex-wrap gap-2">
          {(["json", "csv"] as const).map((nextFormat) => (
            <button
              key={nextFormat}
              onClick={() => setFormat(nextFormat)}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.04em] ${
                format === nextFormat
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-border-subtle bg-bg-default text-content-emphasis"
              }`}
              type="button"
            >
              {nextFormat}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
          <Button size="sm" variant="outline" onClick={() => onOpen?.()} className="justify-center">
            <FileJson className="size-4" />
            Open export schema
            <ChevronRight className="size-3.5" />
          </Button>
          <Button size="sm" className="justify-center" onClick={onCopy}>
            <ClipboardCopy className="size-4" />
            {copied ? "Copied" : "Copy payload"}
            {copied && <CheckCircle2 className="size-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="justify-center"
          >
            <DownloadCloud className="size-4" />
            Download {extension.toUpperCase()}
            <BookMarked className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border-subtle bg-bg-muted p-2">
        <pre className="max-h-80 overflow-auto rounded-lg bg-bg-subtle p-3 text-xs leading-6 text-content-default">
          {previewText}
        </pre>
      </div>
    </section>
  );
}
