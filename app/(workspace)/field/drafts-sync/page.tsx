import { requireDashboardWorkflowAccess } from "../../workflow-guard";

export default async function Page() {
  await requireDashboardWorkflowAccess("field");

  return (
    <div className="space-y-5" data-field-module="drafts-sync">
      <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Field workflow
        </p>
        <div className="mt-2 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Drafts and sync
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Browser drafts are local-only until submitted. ClinicPulse does not currently expose a
            server-backed draft model for field users, so this page does not claim drafts are
            persisted or visible to district teams before submission.
          </p>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">Local draft storage</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Unsubmitted report drafts remain in the browser on the current device.
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">Submission boundary</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A report becomes server evidence only after the field workflow submits or syncs it.
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">Where to inspect server state</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use the sync queue for server-authoritative queued, synced, failed, duplicate,
            conflict, validation, stale, and confirmation counts.
          </p>
        </article>
      </section>
    </div>
  );
}
