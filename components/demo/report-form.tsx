"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/demo/section-header";
import type {
  ClinicStatus,
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

export function ReportForm({ clinicId, clinicName, onSubmit, submitting }: FieldReportFormProps) {
  const submitInFlight = useRef(false);
  const [status, setStatus] = useState<ClinicStatus>("operational");
  const [staff, setStaff] = useState<StaffPressure>("normal");
  const [stock, setStock] = useState<StockPressure>("normal");
  const [queue, setQueue] = useState<QueuePressure>("low");
  const [notes, setNotes] = useState("");

  const submitDisabled =
    !clinicId || (notes.trim().length > 250) || submitting;

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
        setNotes("");
      }
    } finally {
      submitInFlight.current = false;
    }
  };

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Report form"
        title="Submit clinic status"
        description="Use the five core fields to send an updated status."
      />

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <fieldset className="space-y-2">
          <p className="text-sm font-medium text-content-emphasis">Clinic status</p>
          <SegmentedOptions
            name="clinic-status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => setStatus(value as ClinicStatus)}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <p className="text-sm font-medium text-content-emphasis">Staff availability</p>
          <SegmentedOptions
            name="staff-pressure"
            value={staff}
            options={STAFF_OPTIONS}
            onChange={(value) => setStaff(value as StaffPressure)}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <p className="text-sm font-medium text-content-emphasis">Medicine/stock availability</p>
          <SegmentedOptions
            name="stock-pressure"
            value={stock}
            options={STOCK_OPTIONS}
            onChange={(value) => setStock(value as StockPressure)}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <p className="text-sm font-medium text-content-emphasis">Queue pressure</p>
          <SegmentedOptions
            name="queue-pressure"
            value={queue}
            options={QUEUE_OPTIONS}
            onChange={(value) => setQueue(value as QueuePressure)}
          />
        </fieldset>

        <fieldset className="space-y-2">
          <p className="text-sm font-medium text-content-emphasis">Notes</p>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
            maxLength={250}
            placeholder="Add context, barriers, and what changed today."
            className="min-h-20 w-full resize-none rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-content-default outline-none ring-0 focus:border-neutral-900"
          />
          <p className="text-xs text-content-subtle">
            {notes.length}/250 characters
          </p>
        </fieldset>

        <Button type="submit" disabled={submitDisabled} className="w-full">
          {submitting ? "Submitting…" : "Submit report"}
        </Button>
      </form>
    </section>
  );
}
