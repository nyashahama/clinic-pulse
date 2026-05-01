import { cn } from "@/lib/utils";

type ServiceListProps = {
  services: string[];
  highlightedServices?: string[];
  compact?: boolean;
  className?: string;
};

function toSet(values: string[]) {
  return new Set(values.map((value) => value.toLowerCase()));
}

export function ServiceList({
  services,
  highlightedServices,
  compact,
  className,
}: ServiceListProps) {
  const highlightSet = highlightedServices ? toSet(highlightedServices) : null;

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1", className)}>
      {services.length === 0 ? (
        <p className="text-sm text-content-subtle">No services configured for this clinic.</p>
      ) : (
        services.map((service) => {
          const isHighlighted =
            highlightSet !== null && highlightSet.has(service.toLowerCase());

          return (
            <div
              key={service}
              className={cn(
                "rounded-md border border-border-subtle px-2.5 py-2 text-xs text-content-default",
                isHighlighted
                  ? "border-primary/60 bg-primary/5 text-primary"
                  : "bg-bg-subtle",
              )}
            >
              {service}
            </div>
          );
        })
      )}
    </div>
  );
}
