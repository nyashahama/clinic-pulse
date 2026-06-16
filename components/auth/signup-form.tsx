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
  "block w-full min-w-0 appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#0D7A6B] focus:ring-2 focus:ring-[#0D7A6B]/10 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-emerald-500/50 dark:focus:ring-emerald-500/10";

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-muted-foreground">
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
    <form action={formAction} className="grid gap-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
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
        <div className="grid gap-3.5 sm:grid-cols-2">
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
          className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/15 dark:bg-amber-500/5 dark:text-amber-300"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-[#06251F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a3d33] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        {pending ? "Reviewing request..." : submitLabel}
      </button>
    </form>
  );
}
