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

export function EmailSignIn({ action }: { action?: EmailSignInAction }) {
  if (!action) {
    return <EmailOnlySignIn />;
  }

  return <PasswordEmailSignIn action={action} />;
}

function EmailOnlySignIn() {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col gap-y-3"
    >
      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
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
          className={cn(
            "block w-full min-w-0 appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 shadow-sm focus:border-black focus:outline-none focus:ring-black",
          )}
        />
      </label>

      <button
        type="submit"
        className="inline-flex w-full shrink-0 items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Log in with email
      </button>
    </form>
  );
}

function PasswordEmailSignIn({ action }: { action: EmailSignInAction }) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-y-3">
      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
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
          className={cn(
            "block w-full min-w-0 appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 shadow-sm focus:border-black focus:outline-none focus:ring-black",
          )}
        />
      </label>

      <label>
        <span className="text-content-emphasis mb-2 block text-sm font-medium leading-none">
          Password
        </span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cn(
            "block w-full min-w-0 appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 shadow-sm focus:border-black focus:outline-none focus:ring-black",
          )}
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full shrink-0 items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
