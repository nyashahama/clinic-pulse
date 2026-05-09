export function AuthMethodsSeparator() {
  return (
    <div className="flex flex-shrink items-center justify-center gap-3">
      <div className="grow basis-0 border-b border-neutral-200" />
      <span className="text-xs font-semibold uppercase leading-none tracking-[0.16em] text-neutral-400">
        or
      </span>
      <div className="grow basis-0 border-b border-neutral-200" />
    </div>
  );
}
