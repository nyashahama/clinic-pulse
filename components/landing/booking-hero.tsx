"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  MapPin,
  Monitor,
  Route,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/demo/demo-store";
import { shouldOpenBookingModal } from "@/lib/landing/booking-modal";
import { cn } from "@/lib/utils";
import type { DemoLeadFormInput } from "@/components/demo/demo-lead-form";

const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const leadingBlankDays = Array.from({ length: 5 }, (_, index) => `blank-${index}`);
const timeSlots = ["09:00", "10:30", "12:00", "14:00", "15:30"];
const customerLogos = ["District Health", "CareAccess", "Ubuntu Clinics", "FieldOps", "Community Care"];

type InterestType = DemoLeadFormInput["interest"];

export function BookingHero() {
  const router = useRouter();
  const { addDemoLead } = useDemoStore();
  const [duration, setDuration] = useState<30 | 45>(30);
  const [selectedDay, setSelectedDay] = useState(4);
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    const syncBookingUrl = () => {
      if (shouldOpenBookingModal(window.location.href)) {
        setIsBookingOpen(true);
      }
    };

    const notifyLocationChange = () => {
      window.dispatchEvent(new Event("clinicpulse-locationchange"));
    };
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function pushState(...args) {
      const result = originalPushState.apply(this, args);
      notifyLocationChange();
      return result;
    };
    window.history.replaceState = function replaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      notifyLocationChange();
      return result;
    };

    const openBooking = window.setTimeout(syncBookingUrl, 0);
    window.addEventListener("hashchange", syncBookingUrl);
    window.addEventListener("popstate", syncBookingUrl);
    window.addEventListener("clinicpulse-locationchange", syncBookingUrl);

    return () => {
      window.clearTimeout(openBooking);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("hashchange", syncBookingUrl);
      window.removeEventListener("popstate", syncBookingUrl);
      window.removeEventListener("clinicpulse-locationchange", syncBookingUrl);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitDisabled) {
      return;
    }

    setIsSubmitting(true);

    const note = [
      lead.note.trim(),
      `Requested slot: ${selectedDateLabel}`,
      `Duration: ${duration} minutes`,
    ]
      .filter(Boolean)
      .join("\n");

    addDemoLead({
      ...lead,
      name: lead.name.trim(),
      workEmail: lead.workEmail.trim(),
      organization: lead.organization.trim(),
      role: lead.role.trim(),
      note,
      createdAt: new Date().toISOString(),
      status: "new",
    });

    router.push(
      `/book-demo/thanks?name=${encodeURIComponent(lead.name)}&organization=${encodeURIComponent(
        lead.organization,
      )}`,
    );
  };

  return (
    <>
      <section className="relative mx-auto mt-4 w-[calc(100vw-32px)] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl bg-[#77909b] shadow-2xl sm:w-[calc(100vw-64px)] sm:max-w-[calc(100vw-64px)]">
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:4px_4px]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(98,119,128,0.92)_0%,rgba(119,144,155,0.9)_43%,rgba(119,144,155,0.2)_72%)]" />

        <div className="relative grid min-h-[560px] min-w-0 grid-cols-1 items-center gap-8 px-6 py-12 sm:px-10 lg:min-h-[620px] lg:grid-cols-[minmax(390px,0.9fr)_minmax(560px,1.1fr)] lg:px-20 lg:py-16">
          <div className="w-full min-w-0 max-w-full text-white lg:ml-[12vw] lg:max-w-[540px]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              Live routing workspace
            </p>
            <h1 className="max-w-[300px] font-display text-4xl leading-[1.08] text-white sm:max-w-[540px] sm:text-5xl lg:text-[62px]">
              Live clinic<br className="sm:hidden" /> routing,<br /> automated.
            </h1>
            <p className="mt-6 w-full max-w-[300px] text-base leading-7 text-white/68 sm:max-w-[500px]">
              Track which clinics can serve patients right now, verify field reports, and reroute visits before people arrive at a closed door.
            </p>

            <div className="mt-7 flex w-full max-w-[300px] flex-col gap-2 rounded-2xl border border-white/10 bg-white/10 p-1.5 shadow-2xl backdrop-blur-md sm:max-w-[460px] sm:flex-row sm:items-center sm:rounded-full sm:p-1">
              <input
                aria-label="Work email"
                placeholder="Enter your email"
                value={lead.workEmail}
                onChange={(event) => updateLead("workEmail", event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/42"
              />
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100 sm:px-5"
              >
                Schedule a call
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          <ProductRoutingPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-9 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#6f8790]">
          Trusted by
        </p>
        <div className="mx-auto mt-7 grid max-w-[320px] grid-cols-2 items-center justify-items-center gap-x-6 gap-y-5 text-[#213138] sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-x-14 sm:gap-y-6">
          {customerLogos.map((logo) => (
            <span key={logo} className="text-sm font-semibold tracking-wide sm:text-base">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {isBookingOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-start overflow-y-auto bg-neutral-950/52 px-4 py-8 backdrop-blur-[2px] sm:place-items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Book a ClinicPulse demo"
        >
          <BookingPanel
            duration={duration}
            isSubmitDisabled={isSubmitDisabled}
            isSubmitting={isSubmitting}
            lead={lead}
            selectedDateLabel={selectedDateLabel}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
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

function ProductRoutingPreview() {
  const clinics = [
    ["Alexandra PHC", "Non-functional", "Reroute", "18 min"],
    ["Mamelodi Clinic", "Degraded", "Limit", "7 min"],
    ["Diepsloot CHC", "Operational", "Accepting", "Now"],
  ];

  return (
    <div className="relative hidden min-h-[430px] lg:block">
      <div className="absolute left-8 top-8 w-[680px] overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[11px] font-semibold text-neutral-500">
          <div className="flex items-center gap-3">
            <ArrowRight className="size-3 rotate-180" />
            <span>Gauteng District</span>
            <span>Clinic Availability</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-neutral-200 px-2.5 py-1 text-neutral-700">Export</button>
            <button className="rounded-md bg-[#0D7A6B] px-2.5 py-1 text-white">Publish routing</button>
          </div>
        </div>

        <div className="grid grid-cols-[0.92fr_1.08fr]">
          <div className="border-r border-neutral-200 bg-[#f8faf9] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
                  Live operations
                </p>
                <h2 className="mt-1 text-lg font-semibold">Clinic status map</h2>
              </div>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                live
              </span>
            </div>

            <div className="relative mt-4 h-[260px] overflow-hidden rounded-xl border border-neutral-200 bg-[#dfe7e3]">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:32px_32px]" />
              {[
                ["left-[22%] top-[26%]", "bg-green-500"],
                ["left-[45%] top-[32%]", "bg-green-500"],
                ["left-[58%] top-[22%]", "bg-amber-500"],
                ["left-[36%] top-[56%]", "bg-red-500"],
                ["left-[66%] top-[58%]", "bg-green-500"],
                ["left-[50%] top-[72%]", "bg-green-500"],
              ].map(([position, color]) => (
                <span
                  key={position}
                  className={cn(
                    "absolute size-4 rounded-full border-2 border-white shadow-lg",
                    position,
                    color,
                  )}
                />
              ))}
              <div className="absolute bottom-4 left-4 rounded-xl bg-neutral-950 px-4 py-3 text-white shadow-xl">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Capacity score</p>
                <p className="mt-1 text-2xl font-semibold">78%</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="rounded-xl border border-[#b989ff] bg-[#f8f2ff] p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c3aed]">
                    Route alert
                  </p>
                  <h3 className="mt-1 text-sm font-semibold">Alexandra PHC cannot accept ARV visits</h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#0D7A6B]">
                  100% fresh
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                <span>Previous</span>
                <span>5 of 9</span>
                <span>Next</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {clinics.map(([clinic, status, action, time]) => (
                <div key={clinic} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">{clinic}</p>
                      <p className="mt-1 text-sm text-neutral-500">{status}</p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                      {time}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-[#0D7A6B]">
                    <Route className="size-4" />
                    {action}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                [Activity, "42", "reroutes"],
                [MapPin, "3.5k", "clinics"],
                [ShieldCheck, "99%", "fresh"],
              ].map(([Icon, value, label]) => (
                <div key={label as string} className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
                  <Icon className="size-4 text-[#0D7A6B]" />
                  <p className="mt-2 text-lg font-semibold">{value as string}</p>
                  <p className="text-xs font-medium text-neutral-500">{label as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
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
  onClose: () => void;
  onDurationChange: (duration: 30 | 45) => void;
  onLeadChange: (field: keyof BookingPanelProps["lead"], value: string) => void;
  onSelectedDayChange: (day: number) => void;
  onSelectedTimeChange: (time: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function BookingPanel({
  duration,
  isSubmitDisabled,
  isSubmitting,
  lead,
  selectedDateLabel,
  selectedDay,
  selectedTime,
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
      aria-label="Book a ClinicPulse demo"
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
            <p className="text-sm font-semibold text-neutral-500">ClinicPulse team</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Demo with ClinicPulse</h3>
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

        <Button
          type="submit"
          className="mt-5 h-11 w-full rounded-lg bg-neutral-950 text-white hover:bg-neutral-800"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? "Scheduling..." : "Confirm demo"}
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
