import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          ClinicPulse pilot boundary
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground">
          ClinicPulse pilot data is used for controlled operational review, field
          reporting, audit evidence, and partner readiness evaluation.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data use</h2>
        <p className="text-sm text-muted-foreground">
          Pilot users should enter only operational information needed to understand
          clinic status, reporting quality, sync health, and readiness evidence.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Access boundaries</h2>
        <p className="text-sm text-muted-foreground">
          Role-based access limits reporter, district, organisation admin, and system
          admin views to the workflows they are allowed to inspect.
        </p>
      </section>

      <footer className="flex gap-4 text-sm">
        <Link className="font-medium underline" href="/legal/safety">
          Safety
        </Link>
        <Link className="font-medium underline" href="/legal/terms">
          Terms
        </Link>
      </footer>
    </main>
  );
}
