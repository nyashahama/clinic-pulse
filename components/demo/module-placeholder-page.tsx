import { ReferencePanel } from "@/components/demo/reference-dashboard";

type ModulePlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextSteps: string[];
};

export function ModulePlaceholderPage({
  description,
  eyebrow,
  nextSteps,
  title,
}: ModulePlaceholderPageProps) {
  return (
    <div className="grid gap-4 pb-6">
      <ReferencePanel
        description={description}
        eyebrow={eyebrow}
        title={title}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-950">
              Implementation placeholder
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              This page is intentionally present so the dashboard flow has a
              real destination. The module implementation will be added here
              instead of routing users back to a generic overview.
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Planned build
            </p>
            <ol className="mt-3 grid gap-2 text-sm text-gray-600">
              {nextSteps.map((step, index) => (
                <li className="flex gap-2" key={step}>
                  <span className="font-mono text-xs font-semibold text-gray-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </ReferencePanel>
    </div>
  );
}
