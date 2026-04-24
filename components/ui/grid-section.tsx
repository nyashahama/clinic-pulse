import { cn } from "@/lib/utils";

interface GridSectionProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  id?: string;
}

export function GridSection({
  children,
  className,
  innerClassName,
  id,
}: GridSectionProps) {
  return (
    <section
      id={id}
      className={cn("relative border-t border-b border-neutral-200", className)}
    >
      <div
        className={cn(
          "mx-auto max-w-[1200px] border-x border-neutral-200 px-6 sm:px-10",
          "py-16 sm:py-20 lg:py-24",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
