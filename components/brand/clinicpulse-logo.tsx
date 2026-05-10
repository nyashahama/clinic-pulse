import { cn } from "@/lib/utils";

type ClinicPulseMarkProps = {
  className?: string;
};

type ClinicPulseLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function ClinicPulseMark({ className }: ClinicPulseMarkProps) {
  return (
    <span
      aria-hidden="true"
      data-brand-mark="clinicpulse"
      className={cn(
        "grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#06251F] text-white shadow-lg shadow-emerald-950/20 ring-1 ring-white/15",
        className,
      )}
    >
      <svg viewBox="0 0 64 64" fill="none" className="size-[82%]">
        <path
          d="M43.5 12.5C35.8 10.4 27.6 11.7 21.8 16.2C15.8 20.9 13.1 28.4 14.8 35.2C16.7 44.8 25.6 51.2 35.6 49.5C39.2 48.9 42.2 47.4 44.4 45.5"
          stroke="#F8FFFB"
          strokeWidth="5.4"
          strokeLinecap="round"
        />
        <path
          d="M32.8 18.8H39C45.1 18.8 49.2 22.7 49.2 28.1C49.2 33.6 45.1 37.4 39 37.4H31.6"
          stroke="#F8FFFB"
          strokeWidth="5.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.5 38.8H25.4L28.8 31.6L35.2 45.5L38.8 38.8H48.4"
          stroke="#7AF2C5"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M44 14.6V24.6M39 19.6H49"
          stroke="#CFFBE7"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function ClinicPulseLogo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
}: ClinicPulseLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ClinicPulseMark className={iconClassName} />
      {showWordmark ? (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight text-neutral-950 dark:text-foreground",
            wordmarkClassName,
          )}
        >
          ClinicPulse
        </span>
      ) : null}
    </span>
  );
}
