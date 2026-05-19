import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          ClinicPulse pilot boundary
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="text-muted-foreground">
          ClinicPulse is provided for controlled pilot evaluation of operational
          workflows, not as a public health authority record or emergency dispatch
          system.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Operational responsibility</h2>
        <p className="text-sm text-muted-foreground">
          Teams using ClinicPulse remain responsible for confirming clinic status,
          service availability, and rerouting decisions through local operational
          processes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pilot use</h2>
        <p className="text-sm text-muted-foreground">
          Do not use scenario-seeded, stale, pending, or failed-sync data as final
          operational truth without review and human confirmation.
        </p>
      </section>

      <footer className="flex gap-4 text-sm">
        <Link className="font-medium underline" href="/legal/safety">
          Safety
        </Link>
        <Link className="font-medium underline" href="/legal/privacy">
          Privacy
        </Link>
      </footer>
    </main>
  );
}
