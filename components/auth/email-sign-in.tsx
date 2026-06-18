"use client";

import { cn } from "@/lib/utils";
import { useActionState, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuthInput } from "./auth-input";
import { PasswordToggle } from "./password-toggle";
import { AuthStagger, AuthFadeIn } from "./auth-stagger";

export type EmailSignInActionState = {
  email?: string;
  error?: string;
};

export type EmailSignInAction = (
  state: EmailSignInActionState,
  formData: FormData,
) => Promise<EmailSignInActionState>;

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
    <form onSubmit={(event) => event.preventDefault()}>
    <AuthStagger className="flex flex-col gap-4">
      <AuthFadeIn>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@health.gov"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </AuthFadeIn>

      <AuthFadeIn>
        <button type="submit" className={buttonClassName}>
          Continue with email
        </button>
      </AuthFadeIn>
    </AuthStagger>
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
  const pw = PasswordToggle();

  return (
    <form action={formAction}>
    <AuthStagger className="flex flex-col gap-4">
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}

      <AuthFadeIn>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@health.gov"
          autoComplete="email"
          autoFocus
          required
          defaultValue={state.email ?? ""}
        />
      </AuthFadeIn>

      <AuthFadeIn>
        <AuthInput
          id="password"
          name="password"
          type={pw.type}
          label="Password"
          autoComplete="current-password"
          required
          trailing={pw.toggle}
        />
      </AuthFadeIn>

      <AuthFadeIn>
        <div className="flex items-center justify-end">
          <a
            href="/forgot-password"
            className="text-xs font-medium text-neutral-500 transition-colors hover:text-[#0D7A6B] dark:text-white/40 dark:hover:text-emerald-300"
          >
            Forgot password?
          </a>
        </div>
      </AuthFadeIn>

      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              animate={{ x: [0, -4, 4, -2, 2, 0] }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <p
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 dark:border-red-500/15 dark:bg-red-500/5 dark:text-red-400"
              >
                {state.error}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthFadeIn>
        <motion.button
          type="submit"
          disabled={pending}
          whileHover={{ scale: pending ? 1 : 1.01 }}
          whileTap={{ scale: pending ? 1 : 0.98 }}
          className={cn(buttonClassName, "relative overflow-hidden")}
        >
          <AnimatePresence mode="wait">
            {pending ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-2"
              >
                <svg
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-25"
                  />
                  <path
                    d="M4 12a8 8 0 0 1 8-8"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="opacity-75"
                  />
                </svg>
                Signing in...
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                Sign in
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </AuthFadeIn>
    </AuthStagger>
    </form>
  );
}

const buttonClassName =
  "inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-[#06251F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a3d33] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500";
