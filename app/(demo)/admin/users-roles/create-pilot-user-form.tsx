"use client";

import { useRef, useState } from "react";
import { UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CreatePilotUserFormProps = {
  createUserAction: (formData: FormData) => Promise<{ user: { email: string; displayName: string }; temporaryPassword: string }>;
};

const selectClassName =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const roleOptions = [
  { value: "reporter", label: "Field reporter" },
  { value: "district_manager", label: "District manager" },
  { value: "org_admin", label: "Organisation admin" },
  { value: "system_admin", label: "System admin" },
];

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
      {children}
    </label>
  );
}

export function CreatePilotUserForm({ createUserAction }: CreatePilotUserFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<{
    email: string;
    displayName: string;
    password: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setFeedback(null);
    setTemporaryPassword(null);
    try {
      const result = await createUserAction(formData);
      setTemporaryPassword({
        email: result.user.email,
        displayName: result.user.displayName,
        password: result.temporaryPassword,
      });
      formRef.current?.reset();
      setFeedback({ tone: "success", message: `User ${result.user.displayName} created.` });
    } catch (error) {
      setFeedback({ tone: "error", message: error instanceof Error ? error.message : "Failed to create user." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-default p-3 shadow-sm">
        <div>
          <p className="text-sm font-medium text-foreground">Create pilot user</p>
          <p className="text-xs text-muted-foreground">
            Add users with the correct role, organisation, and district scope.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showForm ? "secondary" : "default"}
          onClick={() => setShowForm((v) => !v)}
        >
          <UserPlusIcon className="size-4" />
          <span>{showForm ? "Cancel" : "Create pilot user"}</span>
        </Button>
      </div>

      {showForm && (
        <form
          ref={formRef}
          action={handleSubmit}
          className="grid gap-3 rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3"
        >
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-email">Work email</FieldLabel>
            <Input id="pilot-email" name="email" type="email" autoComplete="off" placeholder="pilot@example.test" required />
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-display-name">Display name</FieldLabel>
            <Input id="pilot-display-name" name="displayName" autoComplete="off" placeholder="Pilot User" required />
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-role">Role</FieldLabel>
            <select id="pilot-role" name="role" required defaultValue="reporter" className={selectClassName}>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-organisation-id">Organisation ID</FieldLabel>
            <Input id="pilot-organisation-id" name="organisationId" type="number" min="1" inputMode="numeric" placeholder="1" />
          </div>
          <div className="grid gap-1">
            <FieldLabel htmlFor="pilot-district">District</FieldLabel>
            <Input id="pilot-district" name="district" autoComplete="off" placeholder="Tshwane" />
          </div>
          <div className="flex items-end md:col-span-2 xl:col-span-1">
            <Button type="submit" size="sm" disabled={pending}>
              <UserPlusIcon className="size-4" />
              <span>{pending ? "Creating..." : "Create account"}</span>
            </Button>
          </div>
        </form>
      )}

      {temporaryPassword && (
        <section aria-live="polite" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold">Temporary password</p>
              <p className="break-words text-sm">
                {temporaryPassword.displayName} ({temporaryPassword.email})
              </p>
              <code className="block w-fit max-w-full rounded-md bg-white/70 px-2 py-1 text-sm font-semibold text-amber-950 dark:bg-black/20 dark:text-amber-100">
                {temporaryPassword.password}
              </code>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setTemporaryPassword(null)}>
              Clear
            </Button>
          </div>
        </section>
      )}

      {feedback && (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium",
            feedback.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100",
            feedback.tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
          )}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
