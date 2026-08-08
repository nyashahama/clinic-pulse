"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";
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
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { BOOKING_OPEN_EVENT } from "@/components/landing/booking-trigger";
import { Button } from "@/components/ui/button";
import {
  shouldOpenBookingModal,
} from "@/lib/landing/booking-modal";
import { cn } from "@/lib/utils";

const timeSlots = ["09:00", "10:30", "12:00", "14:00", "15:30"];
const interestOptions = ["clinic_operator", "government", "ngo", "investor", "other"] as const;
type InterestType = (typeof interestOptions)[number];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthCells(view: Date): (number | null)[] {
  const firstWeekday = startOfMonth(view).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

type BookingDemoControllerProps = {
  children: ReactNode;
};

export function BookingDemoController({ children }: BookingDemoControllerProps) {
  const router = useRouter();
  const [duration, setDuration] = useState<30 | 45>(30);
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("10:30");
  const [company, setCompany] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const returnFocusRef = useRef<HTMLAnchorElement | null>(null);
  const [lead, setLead] = useState({
    name: "",
    workEmail: "",
    organization: "",
    role: "",
    interest: "clinic_operator" as InterestType,
    note: "",
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const cells = useMemo(() => monthCells(viewDate), [viewDate]);
  const monthLabel = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  const isPast = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return d < today;
  };

  const selectedDateLabel = useMemo(() => {
    if (selectedDay == null) return "Select a date";
    return `${viewDate.toLocaleString("en-US", { month: "long" })} ${selectedDay}, ${viewDate.getFullYear()} at ${selectedTime}`;
  }, [selectedDay, viewDate, selectedTime]);

  const requestedDateValue = selectedDay == null ? "" : `${viewDate.getFullYear()}-${pad(viewDate.getMonth() + 1)}-${pad(selectedDay)}`;
  useEffect(() => {
    const syncBookingLocation = () => {
      if (shouldOpenBookingModal(window.location.href)) setIsBookingOpen(true);
    };

    const initialSync = window.setTimeout(syncBookingLocation, 0);
    const openFromTrigger = (event: Event) => {
      const trigger = (event as CustomEvent<HTMLAnchorElement>).detail;
      returnFocusRef.current = trigger;
      setIsBookingOpen(true);
    };

    window.addEventListener("hashchange", syncBookingLocation);
    window.addEventListener("popstate", syncBookingLocation);
    window.addEventListener(BOOKING_OPEN_EVENT, openFromTrigger);
    document.documentElement.dataset.bookingEnhanced = "true";

    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener("hashchange", syncBookingLocation);
      window.removeEventListener("popstate", syncBookingLocation);
      window.removeEventListener(BOOKING_OPEN_EVENT, openFromTrigger);
      delete document.documentElement.dataset.bookingEnhanced;
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsBookingOpen(open);
    if (!open && shouldOpenBookingModal(window.location.href)) {
      router.replace("/", { scroll: false });
    }
    if (!open && returnFocusRef.current) {
      window.requestAnimationFrame(() => returnFocusRef.current?.focus());
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    selectedDay == null ||
    lead.name.trim().length === 0 ||
    lead.workEmail.trim().length === 0 ||
    lead.organization.trim().length === 0 ||
    lead.role.trim().length === 0;

  const updateLead = (field: keyof typeof lead, value: string) => {
    setLead((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (isSubmitDisabled || selectedDay == null) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/walkthrough-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: lead.name.trim(),
          work_email: lead.workEmail.trim(),
          organization: lead.organization.trim(),
          role: lead.role.trim(),
          interest: lead.interest,
          note: lead.note.trim(),
          requested_date: requestedDateValue,
          requested_time: selectedTime,
          duration_minutes: duration,
          company,
        }),
      });
      if (!res.ok) {
        setSubmitError("Something went wrong submitting your request. Please try again.");
        setIsSubmitting(false);
        return;
      }
      router.push(
        `/request-walkthrough/thanks?name=${encodeURIComponent(lead.name)}&organization=${encodeURIComponent(
          lead.organization,
        )}&date=${encodeURIComponent(requestedDateValue)}&time=${encodeURIComponent(selectedTime)}&duration=${duration}`,
      );
    } catch {
      setSubmitError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isBookingOpen} onOpenChange={handleOpenChange}>
      {children}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-neutral-950/52 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className="fixed inset-x-4 top-8 z-50 mx-auto max-h-[calc(100vh-4rem)] w-[540px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl outline-none transition duration-200 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 sm:top-1/2 sm:-translate-y-1/2"
        >
          <BookingPanel
            duration={duration}
            isSubmitDisabled={isSubmitDisabled}
            isSubmitting={isSubmitting}
            lead={lead}
            selectedDateLabel={selectedDateLabel}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            viewDate={viewDate}
            monthLabel={monthLabel}
            cells={cells}
            isPast={isPast}
            onDurationChange={setDuration}
            onLeadChange={updateLead}
            onSelectedDayChange={setSelectedDay}
            onSelectedTimeChange={setSelectedTime}
            onViewDateChange={setViewDate}
            onSubmit={handleSubmit}
            company={company}
            onCompanyChange={setCompany}
            submitError={submitError}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
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
  selectedDay: number | null;
  selectedTime: string;
  viewDate: Date;
  monthLabel: string;
  cells: (number | null)[];
  isPast: (day: number) => boolean;
  onViewDateChange: (date: Date) => void;
  company: string;
  onCompanyChange: (value: string) => void;
  submitError: string | null;
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
  viewDate,
  monthLabel,
  cells,
  isPast,
  onDurationChange,
  onLeadChange,
  onSelectedDayChange,
  onSelectedTimeChange,
  onViewDateChange,
  onSubmit,
  company,
  onCompanyChange,
  submitError,
}: BookingPanelProps) {
  return (
    <section
      id="booking"
      className="mx-auto w-[340px] min-w-0 max-w-[calc(100vw-32px)] overflow-hidden rounded-xl bg-white text-neutral-950 shadow-2xl ring-1 ring-black/10 dark:bg-card dark:text-card-foreground dark:ring-border sm:w-full sm:max-w-[540px]"
      aria-label="Book a Clinic Pulse walkthrough"
    >
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-border">
        <div>
          <Dialog.Title className="text-xl font-semibold">
            Book a Clinic Pulse walkthrough
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Choose a date and tell the Clinic Pulse team what to cover.
          </Dialog.Description>
        </div>
        <Dialog.Close
          render={
            <button
              type="button"
              className="grid size-7 place-items-center rounded-md border border-neutral-300 text-neutral-500 transition hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-border dark:text-muted-foreground dark:hover:text-foreground"
              aria-label="Close booking"
            />
          }
        >
          <X className="size-4" />
        </Dialog.Close>
      </div>

      <form className="max-h-[76vh] overflow-y-auto overflow-x-hidden px-4 py-7 sm:px-6" onSubmit={onSubmit}>
        <div className="flex items-start gap-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[#3f7df1] dark:bg-primary/15 dark:text-primary">
            <UserRound className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-500 dark:text-muted-foreground">Clinic Pulse team</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">Operations walkthrough with Clinic Pulse</h3>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm font-medium text-neutral-700 dark:text-muted-foreground">
          <div className="flex items-center gap-3">
            <Clock3 className="size-4 text-neutral-500 dark:text-muted-foreground" />
            <div className="flex rounded-lg border border-neutral-200 p-1 dark:border-border">
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
                    duration === entry
                      ? "dark:bg-muted dark:text-foreground"
                      : "dark:text-muted-foreground dark:hover:bg-muted",
                  )}
                >
                  {entry}m
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Monitor className="size-4 text-neutral-500 dark:text-muted-foreground" />
            Google Meet
          </div>
          <div className="flex items-center gap-3">
            <Globe2 className="size-4 text-neutral-500 dark:text-muted-foreground" />
            Africa/Johannesburg
            <ChevronDown className="size-4 text-neutral-500 dark:text-muted-foreground" />
          </div>
        </div>

        <div className="mt-9 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{monthLabel}</h3>
          <div className="flex items-center gap-3 text-neutral-400 dark:text-muted-foreground">
            <button type="button" aria-label="Previous month" onClick={() => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="grid size-7 place-items-center rounded-md border border-neutral-300 hover:text-neutral-950 dark:border-border">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Next month" onClick={() => onViewDateChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="grid size-7 place-items-center rounded-md border border-neutral-300 hover:text-neutral-950 dark:border-border">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-7 border-y border-neutral-200 py-3 text-center text-[11px] font-bold text-neutral-700 dark:border-border dark:text-muted-foreground sm:text-xs">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (<span key={day}>{day}</span>))}
        </div>

        <div className="mt-4 grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, index) => {
            if (day == null) return <span key={`b-${index}`} aria-hidden="true" />;
            const past = isPast(day);
            const selected = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                disabled={past}
                onClick={() => onSelectedDayChange(day)}
                className={cn(
                  "relative grid aspect-square min-w-0 place-items-center rounded-md text-xs font-semibold transition sm:rounded-lg sm:text-sm",
                  past ? "text-neutral-400" : "bg-neutral-200 text-neutral-950 hover:bg-neutral-300",
                  selected && "bg-neutral-950 text-white hover:bg-neutral-950",
                  !past && "dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90",
                  selected && "dark:ring-2 dark:ring-white dark:ring-offset-2 dark:ring-offset-card",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-border dark:bg-muted">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950 dark:text-foreground">
            <CalendarDays className="size-4 text-neutral-500 dark:text-muted-foreground" />
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
                  selectedTime === slot
                    ? "dark:border-primary dark:bg-primary dark:text-primary-foreground"
                    : "dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:border-primary/60",
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {submitError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {submitError}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LeadInput label="Name" value={lead.name} onChange={(value) => onLeadChange("name", value)} />
          <LeadInput label="Work email" type="email" value={lead.workEmail} onChange={(value) => onLeadChange("workEmail", value)} />
          <LeadInput label="Organization" value={lead.organization} onChange={(value) => onLeadChange("organization", value)} />
          <LeadInput label="Role" value={lead.role} onChange={(value) => onLeadChange("role", value)} />
          <label className="grid gap-1.5 text-sm font-semibold text-neutral-800 dark:text-foreground sm:col-span-2">
            Focus
            <select value={lead.interest} onChange={(e) => onLeadChange("interest", e.target.value)} className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 outline-none transition focus:border-neutral-950 dark:border-border dark:bg-muted dark:text-foreground dark:focus:border-primary">
              {interestOptions.map((opt) => (<option key={opt} value={opt}>{opt.replace("_", " ")}</option>))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-neutral-800 dark:text-foreground sm:col-span-2">
            Notes
            <textarea value={lead.note} onChange={(e) => onLeadChange("note", e.target.value)} rows={3} placeholder="What should we tailor the walkthrough around?" className="resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 dark:border-border dark:bg-muted dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-primary" />
          </label>
        </div>

        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />

        <Button
          type="submit"
          className="mt-5 h-11 w-full rounded-lg bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? "Scheduling..." : "Confirm walkthrough"}
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
    <label className="grid gap-1.5 text-sm font-semibold text-neutral-800 dark:text-foreground">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-11 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 dark:border-border dark:bg-muted dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-primary"
      />
    </label>
  );
}
