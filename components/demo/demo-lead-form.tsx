"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

type InterestType = "government" | "ngo" | "investor" | "clinic_operator" | "other";

type DemoLeadFormInput = {
  name: string;
  workEmail: string;
  organization: string;
  role: string;
  interest: InterestType;
  note: string;
};

type DemoLeadFormProps = {
  onSubmit: (lead: DemoLeadFormInput) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
};

const INTEREST_OPTIONS: Array<{ value: InterestType; label: string }> = [
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
  { value: "investor", label: "Investor" },
  { value: "clinic_operator", label: "Clinic Operator" },
  { value: "other", label: "Other" },
];

export function DemoLeadForm({
  onSubmit,
  submitLabel = "Submit request",
  isSubmitting = false,
}: DemoLeadFormProps) {
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [interest, setInterest] = useState<InterestType>("government");
  const [note, setNote] = useState("");

  const isSubmitDisabled =
    isSubmitting ||
    name.trim().length === 0 ||
    workEmail.trim().length === 0 ||
    organization.trim().length === 0 ||
    role.trim().length === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    onSubmit({
      name: name.trim(),
      workEmail: workEmail.trim(),
      organization: organization.trim(),
      role: role.trim(),
      interest,
      note: note.trim(),
    });

    setName("");
    setWorkEmail("");
    setOrganization("");
    setRole("");
    setInterest("government");
    setNote("");
  };

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <header className="border-b border-border-subtle pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-content-subtle">
          Demo booking
        </p>
        <h3 className="mt-1 text-lg font-semibold text-content-emphasis">Request a founder walk-through</h3>
        <p className="mt-1 text-sm text-content-default">
          Provide context and we&apos;ll tailor a live product demo in this flow.
        </p>
      </header>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-content-emphasis">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Your name"
            className="h-9 w-full rounded-lg border border-border-subtle bg-bg-subtle px-3 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-content-emphasis">Work email</span>
          <input
            value={workEmail}
            type="email"
            onChange={(event) => setWorkEmail(event.target.value)}
            required
            placeholder="you@organization.org"
            className="h-9 w-full rounded-lg border border-border-subtle bg-bg-subtle px-3 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-content-emphasis">Organization</span>
          <input
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            required
            placeholder="District health office, NGO, clinic chain..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-bg-subtle px-3 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-content-emphasis">Role</span>
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            required
            placeholder="Chief operations officer, clinic director..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-bg-subtle px-3 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-content-emphasis">Interest focus</span>
          <select
            value={interest}
            onChange={(event) => setInterest(event.target.value as InterestType)}
            className="h-9 w-full rounded-lg border border-border-subtle bg-bg-subtle px-3 text-sm outline-none"
          >
            {INTEREST_OPTIONS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-content-emphasis">
            Optional note
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder="What do you want to validate first?"
            className="w-full resize-none rounded-lg border border-border-subtle bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </label>

        <Button className="w-full" type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
      </form>
    </section>
  );
}

export type { DemoLeadFormInput };
