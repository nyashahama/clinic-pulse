"use client";

import { cn } from "@/lib/utils";
import { useActionState } from "react";

export type SignupActionState = {
  fields?: {
    fullName?: string;
    email?: string;
    organisation?: string;
    role?: string;
  };
  error?: string;
};

export type SignupAction = (
  state: SignupActionState,
  formData: FormData,
) => Promise<SignupActionState>;

const inputClassName =
  "block w-full min-w-0 appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-[#0D7A6B] focus:ring-4 focus:ring-[#0D7A6B]/10 dark:border-border dark:bg-muted dark:text-foreground dark:placeholder:text-muted-foreground";

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold leading-none text-neutral-900 dark:text-foreground">
      {children}
    </label>
  );
}

export function SignupForm({
  action,
  allowPublicRegistration,
}: {
  action: SignupAction;
  allowPublicRegistration: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const submitLabel = allowPublicRegistration
    ? "Request account"
    : "Request access review";

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nomsa Dlamini"
            autoComplete="name"
            required
            defaultValue={state.fields?.fullName ?? ""}
            className={cn(inputClassName)}
          />
        </div>

        <div>
          <FieldLabel htmlFor="role">Role</FieldLabel>
          <select
            id="role"
            name="role"
            required
            defaultValue={state.fields?.role ?? ""}
            className={cn(inputClassName)}
          >
            <option value="" disabled>
              Select role
            </option>
            <option value="district_manager">District manager</option>
            <option value="reporter">Field reporter</option>
            <option value="org_admin">Organisation admin</option>
            <option value="partner">Partner team</option>
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="email">Work email</FieldLabel>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="nomsa@health.gov"
          autoComplete="email"
          required
          defaultValue={state.fields?.email ?? ""}
          className={cn(inputClassName)}
        />
      </div>

      <div>
        <FieldLabel htmlFor="organisation">Organisation</FieldLabel>
        <input
          id="organisation"
          name="organisation"
          type="text"
          placeholder="Tshwane District Health"
          autoComplete="organization"
          required
          defaultValue={state.fields?.organisation ?? ""}
          className={cn(inputClassName)}
        />
      </div>

      {allowPublicRegistration ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className={cn(inputClassName)}
            />
          </div>

          <div>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className={cn(inputClassName)}
            />
          </div>
        </div>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-200"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:shadow-black/30 dark:hover:bg-primary/90"
      >
        {pending ? "Reviewing request..." : submitLabel}
      </button>
    </form>
  );
}
