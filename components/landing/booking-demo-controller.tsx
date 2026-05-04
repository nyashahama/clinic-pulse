"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Monitor,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import {
  shouldOpenBookingModal,
  shouldOpenBookingModalFromSearchParams,
} from "@/lib/landing/booking-modal";
import { cn } from "@/lib/utils";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";

const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const leadingBlankDays = Array.from({ length: 5 }, (_, index) => `blank-${index}`);
const timeSlots = ["09:00", "10:30", "12:00", "14:00", "15:30"];

type InterestType = DemoLeadFormInput["interest"];

type BookingDemoControllerProps = {
  children: (controls: { openBooking: () => void }) => ReactNode;
};

type BookingApiResponse = {
  booking?: {
    calendarEventId: string;
    calendarUrl: string;
    meetUrl: string;
  };
  error?: string;
};

export function BookingDemoController({ children }: BookingDemoControllerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addDemoLead } = useDemoStore();
  const [duration, setDuration] = useState<30 | 45>(30);
  const [selectedDay, setSelectedDay] = useState(4);
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [lead, setLead] = useState({
    name: "",
    workEmail: "",
    organization: "",
    role: "",
    interest: "clinic_operator" as InterestType,
    note: "",
  });

  const selectedDateLabel = useMemo(
    () => `May ${selectedDay}, 2026 at ${selectedTime}`,
    [selectedDay, selectedTime],
  );
  const bookingUrlOpen = shouldOpenBookingModalFromSearchParams(searchParams);
  const bookingOpen = isBookingOpen || bookingUrlOpen;

  useEffect(() => {
    const syncBookingHash = () => {
      if (window.location.hash === "#booking") {
        setIsBookingOpen(true);
      }
    };

    const openBooking = window.setTimeout(syncBookingHash, 0);
    window.addEventListener("hashchange", syncBookingHash);

    return () => {
      window.clearTimeout(openBooking);
      window.removeEventListener("hashchange", syncBookingHash);
    };
  }, []);

  const closeBooking = () => {
    setIsBookingOpen(false);

    if (shouldOpenBookingModal(window.location.href)) {
      router.replace("/", { scroll: false });
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    lead.name.trim().length === 0 ||
    lead.workEmail.trim().length === 0 ||
    lead.organization.trim().length === 0 ||
    lead.role.trim().length === 0;

  const updateLead = (field: keyof typeof lead, value: string) => {
    setLead((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const trimmedLead = {
      ...lead,
      name: lead.name.trim(),
      workEmail: lead.workEmail.trim(),
      organization: lead.organization.trim(),
      role: lead.role.trim(),
      note: lead.note.trim(),
    };

    const note = [
      trimmedLead.note,
      `Requested slot: ${selectedDateLabel}`,
      `Duration: ${duration} minutes`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/book-demo", {
        body: JSON.stringify({
          lead: trimmedLead,
          slot: {
            day: selectedDay,
            duration,
            time: selectedTime,
          },
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as BookingApiResponse;

      if (!response.ok || !payload.booking) {
        throw new Error(payload.error ?? "Unable to create the Google Meet booking.");
      }

      const bookingNote = [
        note,
        `Google Meet: ${payload.booking.meetUrl}`,
        `Calendar event: ${payload.booking.calendarUrl}`,
      ].join("\n");

      addDemoLead({
        ...trimmedLead,
        note: bookingNote,
        createdAt: new Date().toISOString(),
        status: "scheduled",
      });

      const params = new URLSearchParams({
        calendarUrl: payload.booking.calendarUrl,
        meetUrl: payload.booking.meetUrl,
        name: trimmedLead.name,
        organization: trimmedLead.organization,
      });

      router.push(`/book-demo/thanks?${params.toString()}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create the Google Meet booking.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children({ openBooking: () => setIsBookingOpen(true) })}

      {bookingOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-neutral-950/52 px-4 py-8 backdrop-blur-[2px] sm:place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Book a Clinic Pulse demo"
        >
          <BookingPanel
            duration={duration}
            isSubmitDisabled={isSubmitDisabled}
            isSubmitting={isSubmitting}
            lead={lead}
            selectedDateLabel={selectedDateLabel}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            submitError={submitError}
            onClose={closeBooking}
            onDurationChange={setDuration}
            onLeadChange={updateLead}
            onSelectedDayChange={setSelectedDay}
            onSelectedTimeChange={setSelectedTime}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </>
  );
}

type BookingPanelProps = {
  duration: 30 | 45;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  lead: {
    name: string;
    workEmail: string;
    organization: string;
    role: string;
    interest: InterestType;
    note: string;
  };
  selectedDateLabel: string;
  selectedDay: number;
  selectedTime: string;
  submitError: string;
  onClose: () => void;
  onDurationChange: (duration: 30 | 45) => void;
  onLeadChange: (field: keyof BookingPanelProps["lead"], value: string) => void;
  onSelectedDayChange: (day: number) => void;
  onSelectedTimeChange: (time: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

function BookingPanel({
  duration,
  isSubmitDisabled,
  isSubmitting,
  lead,
  selectedDateLabel,
  selectedDay,
  selectedTime,
  submitError,
  onClose,
  onDurationChange,
  onLeadChange,
  onSelectedDayChange,
  onSelectedTimeChange,
  onSubmit,
}: BookingPanelProps) {
  return (
    <section
      id="booking"
      className="mx-auto w-[340px] min-w-0 max-w-[calc(100vw-32px)] overflow-hidden rounded-xl bg-white text-neutral-950 shadow-2xl ring-1 ring-black/10 sm:w-full sm:max-w-[540px]"
      aria-label="Book a Clinic Pulse demo"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <h2 className="text-xl font-semibold">Book a demo</h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-md border border-neutral-300 text-neutral-500 transition hover:text-neutral-950"
          aria-label="Close booking"
        >
          <X className="size-4" />
        </button>
      </div>

      <form className="max-h-[76vh] overflow-y-auto overflow-x-hidden px-4 py-7 sm:px-6" onSubmit={onSubmit}>
        <div className="flex items-start gap-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[#3f7df1]">
            <UserRound className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500">Clinic Pulse team</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Demo with Clinic Pulse</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm font-medium text-neutral-700">
          <div className="flex items-center gap-3">
            <Clock3 className="size-4 text-neutral-500" />
            <div className="flex rounded-lg border border-neutral-200 p-1">
              {[30, 45].map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onDurationChange(entry as 30 | 45)}
                  className={cn(
                    "h-9 rounded-md px-4 text-sm font-semibold transition",
                    duration === entry
                      ? "bg-neutral-200 text-neutral-950"
                      : "text-neutral-600 hover:bg-neutral-100",
                  )}
                >
                  {entry}m
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Monitor className="size-4 text-neutral-500" />
            Google Meet
          </div>
          <div className="flex items-center gap-3">
            <Globe2 className="size-4 text-neutral-500" />
            Africa/Johannesburg
            <ChevronDown className="size-4 text-neutral-500" />
          </div>
        </div>

        <div className="mt-9 flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            May <span className="text-neutral-500">2026</span>
          </h3>
          <div className="flex items-center gap-3 text-neutral-400">
            <ChevronLeft className="size-5" />
            <ChevronRight className="size-5" />
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-7 border-y border-neutral-200 py-3 text-center text-[11px] font-bold text-neutral-700 sm:text-xs">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
          {leadingBlankDays.map((day) => (
            <span key={day} aria-hidden="true" />
          ))}
          {monthDays.map((day) => {
            const isAvailable = day !== 1 && day !== 2 && day !== 3;
            return (
              <button
                key={day}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelectedDayChange(day)}
                className={cn(
                  "relative grid aspect-square min-w-0 place-items-center rounded-md text-xs font-semibold transition sm:rounded-lg sm:text-sm",
                  isAvailable
                    ? "bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
                    : "bg-transparent text-neutral-400",
                  selectedDay === day && "bg-neutral-950 text-white hover:bg-neutral-950",
                )}
              >
                {day}
                {day === 2 ? (
                  <span className="absolute bottom-1.5 size-1 rounded-full bg-neutral-400" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
            <CalendarDays className="size-4 text-neutral-500" />
            {selectedDateLabel}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectedTimeChange(slot)}
                className={cn(
                  "h-10 rounded-lg border text-sm font-semibold transition",
                  selectedTime === slot
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <LeadInput label="Name" value={lead.name} onChange={(value) => onLeadChange("name", value)} />
          <LeadInput
            label="Work email"
            type="email"
            value={lead.workEmail}
            onChange={(value) => onLeadChange("workEmail", value)}
          />
          <LeadInput
            label="Organization"
            value={lead.organization}
            onChange={(value) => onLeadChange("organization", value)}
          />
          <LeadInput label="Role" value={lead.role} onChange={(value) => onLeadChange("role", value)} />
          <label className="grid gap-1.5 text-sm font-semibold text-neutral-800">
            Focus
            <select
              value={lead.interest}
              onChange={(event) => onLeadChange("interest", event.target.value)}
              className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 outline-none transition focus:border-neutral-950"
            >
              <option value="clinic_operator">Clinic Operator</option>
              <option value="government">Government</option>
              <option value="ngo">NGO</option>
              <option value="investor">Investor</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-neutral-800">
            Notes
            <textarea
              value={lead.note}
              onChange={(event) => onLeadChange("note", event.target.value)}
              rows={3}
              placeholder="What should we tailor the walkthrough around?"
              className="resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
            />
          </label>
        </div>

        {submitError ? (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {submitError}
          </div>
        ) : null}

        <Button
          type="submit"
          className="mt-5 h-11 w-full rounded-lg bg-neutral-950 text-white hover:bg-neutral-800"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? "Creating Google Meet..." : "Confirm demo"}
          {!isSubmitting ? <Check className="size-4" /> : null}
        </Button>
      </form>
    </section>
  );
}

type LeadInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
};

function LeadInput({ label, onChange, type = "text", value }: LeadInputProps) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-neutral-800">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
      />
    </label>
  );
}
