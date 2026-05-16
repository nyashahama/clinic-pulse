"use client";

import { useActionState } from "react";

import { cn } from "@/lib/utils";

export type ChangePasswordActionState = {
  error?: string;
};

export type ChangePasswordAction = (
  state: ChangePasswordActionState,
  formData: FormData,
) => Promise<ChangePasswordActionState>;

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
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold leading-none text-neutral-900 dark:text-foreground"
    >
      {children}
    </label>
  );
}

export function ChangePasswordForm({
  action,
}: {
  action: ChangePasswordAction;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-4">
      <div>
        <FieldLabel htmlFor="currentPassword">Temporary password</FieldLabel>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={cn(inputClassName)}
        />
      </div>

      <div>
        <FieldLabel htmlFor="newPassword">New password</FieldLabel>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          className={cn(inputClassName)}
        />
      </div>

      <div>
        <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
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
        {pending ? "Updating password..." : "Set new password"}
      </button>
    </form>
  );
}
