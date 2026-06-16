"use client";

import { cn } from "@/lib/utils";
import { useActionState, useState } from "react";

export type EmailSignInActionState = {
  email?: string;
  error?: string;
};

export type EmailSignInAction = (
  state: EmailSignInActionState,
  formData: FormData,
) => Promise<EmailSignInActionState>;

const inputClassName =
  "block w-full min-w-0 appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#0D7A6B] focus:ring-2 focus:ring-[#0D7A6B]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/10";

const buttonClassName =
  "inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-[#06251F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a3d33] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500";

export function EmailSignIn({
  action,
  returnTo,
}: {
  action?: EmailSignInAction;
  returnTo?: string;
}) {
  if (!action) {
    return <EmailOnlySignIn />;
  }

  return <PasswordEmailSignIn action={action} returnTo={returnTo} />;
}

function EmailOnlySignIn() {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-4"
    >
      <label>
        <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-white/50">
          Email address
        </span>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@health.gov"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={cn(inputClassName)}
        />
      </label>

      <button type="submit" className={buttonClassName}>
        Continue with email
      </button>
    </form>
  );
}

function PasswordEmailSignIn({
  action,
  returnTo,
}: {
  action: EmailSignInAction;
  returnTo?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}

      <label>
        <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-white/50">
          Email address
        </span>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@health.gov"
          autoComplete="email"
          autoFocus
          required
          defaultValue={state.email ?? ""}
          className={cn(inputClassName)}
        />
      </label>

      <label>
        <span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-white/50">
          Password
        </span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cn(inputClassName)}
        />
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={buttonClassName}
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
