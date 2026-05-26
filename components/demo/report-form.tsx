"use client";

import type { FormEvent, ReactNode } from "react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldReportReceipt,
  type FieldReportFeedback,
} from "@/components/demo/report-feedback";
import { SectionHeader } from "@/components/demo/section-header";
import {
  clearFieldReportDraft,
  getFieldReportDraft,
  saveFieldReportDraft,
  type FieldReportDraftInput,
} from "@/lib/demo/field-report-draft";
import type {
  ClinicStatus,
  OfflineReportQueueItem,
  QueuePressure,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";
import type { OnlineFieldReportInput } from "@/lib/demo/field-report";

type FieldReportFormProps = {
  clinicId: string;
  clinicName: string;
  submitting: boolean;
  onSubmit: (input: OnlineFieldReportInput) => boolean | Promise<boolean> | void;
  feedback?: FieldReportFeedback | null;
  editingReport?: OfflineReportQueueItem | null;
};

const STATUS_OPTIONS: Array<{ value: ClinicStatus; label: string }> = [
  { value: "operational", label: "Operational" },
  { value: "degraded", label: "Degraded" },
  { value: "non_functional", label: "Non-functional" },
  { value: "unknown", label: "Unknown" },
];

const STAFF_OPTIONS: Array<{ value: StaffPressure; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "strained", label: "Strained" },
  { value: "critical", label: "Critical" },
  { value: "unknown", label: "Unknown" },
];

const STOCK_OPTIONS: Array<{ value: StockPressure; label: string }> = [
  { value: "normal", label: "Available" },
  { value: "low", label: "Low stock" },
  { value: "stockout", label: "Stockout" },
  { value: "unknown", label: "Unknown" },
];

const QUEUE_OPTIONS: Array<{ value: QueuePressure; label: string }> = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "unknown", label: "Unknown" },
];

const FIELD_SEGMENT_CLASS =
  "inline-flex flex-1 items-center justify-center rounded-lg border border-border-subtle px-2 py-2 text-sm font-medium transition-colors has-[input:checked]:border-neutral-900 has-[input:checked]:bg-neutral-900 has-[input:checked]:text-white";

const DEFAULT_DRAFT_INPUT = {
  status: "operational",
  staffPressure: "normal",
  stockPressure: "normal",
  queuePressure: "low",
  notes: "",
} satisfies {
  status: ClinicStatus;
  staffPressure: StaffPressure;
  stockPressure: StockPressure;
  queuePressure: QueuePressure;
  notes: string;
};

function isMeaningfulDraft(input: FieldReportDraftInput) {
  return (
    input.status !== DEFAULT_DRAFT_INPUT.status ||
    input.staffPressure !== DEFAULT_DRAFT_INPUT.staffPressure ||
    input.stockPressure !== DEFAULT_DRAFT_INPUT.stockPressure ||
    input.queuePressure !== DEFAULT_DRAFT_INPUT.queuePressure ||
    input.notes.trim().length > 0
  );
}

type Option = {
  value: string;
  label: string;
};

type SegmentedOptionProps = {
  name: string;
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
};

function SegmentedOptions({ options, value, name, onChange }: SegmentedOptionProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => (
        <label key={option.value} className={FIELD_SEGMENT_CLASS}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function VisitStep({
  children,
  description,
  number,
  title,
}: {
  children: ReactNode;
  description: string;
  number: number;
  title: string;
}) {
  return (
    <fieldset className="rounded-lg border border-border-subtle bg-bg-subtle p-3">
      <legend className="sr-only">{title}</legend>
      <div className="mb-3 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
          {number}
        </span>
        <div>
          <p className="text-sm font-medium text-content-emphasis">{title}</p>
          <p className="text-xs leading-5 text-content-subtle">{description}</p>
        </div>
      </div>
      {children}
    </fieldset>
  );
}

export function ReportForm({
  clinicId,
  clinicName,
  editingReport = null,
  onSubmit,
  submitting,
  feedback = null,
}: FieldReportFormProps) {
  const submitInFlight = useRef(false);
  const restoredDraft = getFieldReportDraft(clinicId);
  const restoredInput = editingReport
    ? {
        status: editingReport.status,
        staffPressure: editingReport.staffPressure,
        stockPressure: editingReport.stockPressure,
        queuePressure: editingReport.queuePressure,
        notes: editingReport.notes,
      }
    : restoredDraft?.input ?? DEFAULT_DRAFT_INPUT;
  const [status, setStatus] = useState<ClinicStatus>(restoredInput.status);
  const [staff, setStaff] = useState<StaffPressure>(restoredInput.staffPressure);
  const [stock, setStock] = useState<StockPressure>(restoredInput.stockPressure);
  const [queue, setQueue] = useState<QueuePressure>(restoredInput.queuePressure);
  const [notes, setNotes] = useState(restoredInput.notes);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(
    editingReport ? null : restoredDraft?.updatedAt ?? null,
  );
  const isEditingSavedReport = editingReport !== null;

  const submitDisabled =
    !clinicId || (notes.trim().length > 250) || submitting;

  const persistDraft = (input: FieldReportDraftInput) => {
    if (isEditingSavedReport) {
      return;
    }

    if (!clinicId || !isMeaningfulDraft(input)) {
      clearFieldReportDraft(clinicId);
      setDraftSavedAt(null);
      return;
    }

    const draft = saveFieldReportDraft(clinicId, input);
    setDraftSavedAt(draft.updatedAt);
  };

  const updateStatus = (value: ClinicStatus) => {
    setStatus(value);
    persistDraft({
      status: value,
      staffPressure: staff,
      stockPressure: stock,
      queuePressure: queue,
      notes,
    });
  };

  const updateStaff = (value: StaffPressure) => {
    setStaff(value);
    persistDraft({
      status,
      staffPressure: value,
      stockPressure: stock,
      queuePressure: queue,
      notes,
    });
  };

  const updateStock = (value: StockPressure) => {
    setStock(value);
    persistDraft({
      status,
      staffPressure: staff,
      stockPressure: value,
      queuePressure: queue,
      notes,
    });
  };

  const updateQueue = (value: QueuePressure) => {
    setQueue(value);
    persistDraft({
      status,
      staffPressure: staff,
      stockPressure: stock,
      queuePressure: value,
      notes,
    });
  };

  const updateNotes = (value: string) => {
    setNotes(value);
    persistDraft({
      status,
      staffPressure: staff,
      stockPressure: stock,
      queuePressure: queue,
      notes: value,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clinicId || submitting || submitInFlight.current) {
      return;
    }

    submitInFlight.current = true;

    try {
      const submitted = await onSubmit({
        reporterName: "Field worker",
        notes,
        status,
        reason: `${clinicName} status update from field worker report.`,
        staffPressure: staff,
        stockPressure: stock,
        queuePressure: queue,
      });

      if (submitted !== false) {
        clearFieldReportDraft(clinicId);
        setDraftSavedAt(null);
        setStatus(DEFAULT_DRAFT_INPUT.status);
        setStaff(DEFAULT_DRAFT_INPUT.staffPressure);
        setStock(DEFAULT_DRAFT_INPUT.stockPressure);
        setQueue(DEFAULT_DRAFT_INPUT.queuePressure);
        setNotes("");
      }
    } finally {
      submitInFlight.current = false;
    }
  };

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Visit report"
        title="Submit clinic status"
        description="Capture the field update, confirm pressure, then send it for district review or save it on this device."
      />

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <VisitStep
          number={1}
          title="Confirm clinic"
          description="This report will be attached to the selected facility."
        >
          <p className="rounded-md border border-border-subtle bg-bg-default px-3 py-2 text-sm font-medium text-content-emphasis">
            {clinicName}
          </p>
        </VisitStep>

        <VisitStep
          number={2}
          title="Set service status"
          description="Choose the operating state the district team should review."
        >
          <SegmentedOptions
            name="clinic-status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => updateStatus(value as ClinicStatus)}
          />
        </VisitStep>

        <VisitStep
          number={3}
          title="Capture pressure"
          description="Record staffing, stock, and queue pressure while you are on site."
        >
          <div className="grid gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-content-emphasis">
                Staff availability
              </p>
              <SegmentedOptions
                name="staff-pressure"
                value={staff}
                options={STAFF_OPTIONS}
                onChange={(value) => updateStaff(value as StaffPressure)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-content-emphasis">
                Medicine/stock availability
              </p>
              <SegmentedOptions
                name="stock-pressure"
                value={stock}
                options={STOCK_OPTIONS}
                onChange={(value) => updateStock(value as StockPressure)}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-content-emphasis">
                Queue pressure
              </p>
              <SegmentedOptions
                name="queue-pressure"
                value={queue}
                options={QUEUE_OPTIONS}
                onChange={(value) => updateQueue(value as QueuePressure)}
              />
            </div>
          </div>
        </VisitStep>

        <VisitStep
          number={4}
          title="Add visit notes"
          description="Capture the reason, barriers, and what changed today."
        >
          <textarea
            value={notes}
            onChange={(event) => updateNotes(event.target.value)}
            rows={5}
            maxLength={250}
            placeholder="Add context, barriers, and what changed today."
            className="min-h-20 w-full resize-none rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-content-default outline-none ring-0 focus:border-neutral-900"
          />
          <p className="text-xs text-content-subtle">
            {notes.length}/250 characters
          </p>
          {draftSavedAt ? (
            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/35 dark:text-sky-100">
              <p className="font-medium">Draft saved on this device</p>
              <p className="mt-1 text-xs">
                Returning to {clinicName} restores this in-progress report before
                it is submitted or queued.
              </p>
            </div>
          ) : null}
          {isEditingSavedReport ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
              <p className="font-medium">Editing saved device report</p>
              <p className="mt-1 text-xs">
                Updating this form replaces the queued copy before it syncs.
              </p>
            </div>
          ) : null}
        </VisitStep>

        <VisitStep
          number={5}
          title="Review and send"
          description="Online reports go to district review. Offline reports are saved on this device."
        >
          <Button type="submit" disabled={submitDisabled} className="w-full">
            {submitting
              ? "Submitting..."
              : isEditingSavedReport
                ? "Update saved report"
                : "Submit report"}
          </Button>
          <FieldReportReceipt feedback={feedback} />
        </VisitStep>
      </form>
    </section>
  );
}
