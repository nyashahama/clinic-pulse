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
  "block w-full min-w-0 appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-[#0D7A6B] focus:ring-4 focus:ring-[#0D7A6B]/10 dark:border-border dark:bg-muted dark:text-foreground dark:placeholder:text-muted-foreground";

const buttonClassName =
  "inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:border-primary dark:bg-primary dark:text-primary-foreground dark:shadow-black/30 dark:hover:bg-primary/90";

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
      className="flex flex-col gap-y-4"
    >
      <label>
        <span className="mb-2 block text-sm font-semibold leading-none text-neutral-900 dark:text-foreground">
          Email
        </span>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="panic@thedis.co"
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
    <form action={formAction} className="flex flex-col gap-y-4">
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}

      <label>
        <span className="mb-2 block text-sm font-semibold leading-none text-neutral-900 dark:text-foreground">
          Email
        </span>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="panic@thedis.co"
          autoComplete="email"
          autoFocus
          required
          defaultValue={state.email ?? ""}
          className={cn(inputClassName)}
        />
      </label>

      <label>
        <span className="mb-2 block text-sm font-semibold leading-none text-neutral-900 dark:text-foreground">
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
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-200"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={buttonClassName}
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
