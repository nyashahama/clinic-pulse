import Link from "next/link";

export default function SafetyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">
          ClinicPulse pilot boundary
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Pilot safety and operational disclaimer
        </h1>
        <p className="text-muted-foreground">
          ClinicPulse helps teams understand clinic operating status, field reports,
          and routing context. It does not replace clinical judgment, emergency
          services, or local operational confirmation.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Human confirmation is required</h2>
        <p className="text-sm text-muted-foreground">
          Clinic availability, service status, queue pressure, and rerouting guidance
          must be confirmed by responsible staff before real-world patient movement or
          public communication.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data trust states matter</h2>
        <p className="text-sm text-muted-foreground">
          Data marked as pending review, stale, needs confirmation, demo-seeded, or
          failed sync should not be treated as reviewed current operating truth.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Pilot scope</h2>
        <p className="text-sm text-muted-foreground">
          The pilot is intended for controlled operational evaluation. It is not a
          legal compliance certification, emergency dispatch system, medical device, or
          public health authority record.
        </p>
      </section>

      <footer className="flex gap-4 text-sm">
        <Link className="font-medium underline" href="/legal/privacy">
          Privacy
        </Link>
        <Link className="font-medium underline" href="/legal/terms">
          Terms
        </Link>
      </footer>
    </main>
  );
}
