import { cn } from "@/lib/utils";

type ClinicPulseLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function ClinicPulseLogo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
}: ClinicPulseLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md bg-[#0D7A6B] text-white shadow-sm ring-1 ring-[#0D7A6B]/20",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" fill="none" className="size-5">
          <path
            d="M16 3.75 25 7.1v7.25c0 6.05-3.55 11.12-9 13.9-5.45-2.78-9-7.85-9-13.9V7.1l9-3.35Z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M16 3.75 25 7.1v7.25c0 6.05-3.55 11.12-9 13.9-5.45-2.78-9-7.85-9-13.9V7.1l9-3.35Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M16 9v9M11.5 13.5h9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M8.75 20.25h4.2l1.4-2.9 2.65 5.3 1.45-2.4h4.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight text-neutral-900",
            wordmarkClassName,
          )}
        >
          ClinicPulse
        </span>
      ) : null}
    </span>
  );
}
