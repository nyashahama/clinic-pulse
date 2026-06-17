"use client";

import { cn } from "@/lib/utils";
import { useActionState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuthInput } from "./auth-input";
import { PasswordToggle } from "./password-toggle";
import { AuthStagger, AuthFadeIn } from "./auth-stagger";

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

const selectClassName =
  "block w-full min-w-0 appearance-none rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-[#0D7A6B] focus:ring-2 focus:ring-[#0D7A6B]/15 focus:shadow-[0_0_0_3px_rgba(13,122,107,0.06)] hover:border-neutral-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-emerald-400/50 dark:focus:ring-emerald-400/15 dark:hover:border-white/20";

export function SignupForm({
  action,
  allowPublicRegistration,
}: {
  action: SignupAction;
  allowPublicRegistration: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const pw = PasswordToggle();
  const confirmPw = PasswordToggle();
  const submitLabel = allowPublicRegistration
    ? "Request account"
    : "Request access review";

  return (
    <form action={formAction} className="grid gap-4">
      <AuthStagger className="grid gap-4">
        <AuthFadeIn>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthInput
              id="fullName"
              name="fullName"
              type="text"
              label="Full name"
              placeholder="Nomsa Dlamini"
              autoComplete="name"
              required
              defaultValue={state.fields?.fullName ?? ""}
            />

            <div>
              <label htmlFor="role" className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-white/50">
                Role
              </label>
              <select
                id="role"
                name="role"
                required
                defaultValue={state.fields?.role ?? ""}
                className={cn(selectClassName)}
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
        </AuthFadeIn>

        <AuthFadeIn>
          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Work email"
            placeholder="nomsa@health.gov"
            autoComplete="email"
            required
            defaultValue={state.fields?.email ?? ""}
          />
        </AuthFadeIn>

        <AuthFadeIn>
          <AuthInput
            id="organisation"
            name="organisation"
            type="text"
            label="Organisation"
            placeholder="Tshwane District Health"
            autoComplete="organization"
            required
            defaultValue={state.fields?.organisation ?? ""}
          />
        </AuthFadeIn>

        {allowPublicRegistration ? (
          <AuthFadeIn>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthInput
                id="password"
                name="password"
                type={pw.type}
                label="Password"
                autoComplete="new-password"
                minLength={12}
                required
                trailing={pw.toggle}
              />

              <AuthInput
                id="confirmPassword"
                name="confirmPassword"
                type={confirmPw.type}
                label="Confirm password"
                autoComplete="new-password"
                minLength={12}
                required
                trailing={confirmPw.toggle}
              />
            </div>
          </AuthFadeIn>
        ) : null}

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
            className="inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-[#06251F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0a3d33] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
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
                  Reviewing request...
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {submitLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </AuthFadeIn>
      </AuthStagger>
    </form>
  );
}
