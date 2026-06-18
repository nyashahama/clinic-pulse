export function AuthMethodsSeparator() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="grow basis-0 border-b border-neutral-200 dark:border-white/10" />
      <span className="text-[11px] font-medium uppercase leading-none tracking-[0.12em] text-neutral-400 dark:text-white/30">
        or
      </span>
      <div className="grow basis-0 border-b border-neutral-200 dark:border-white/10" />
    </div>
  );
}
