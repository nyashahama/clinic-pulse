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
  "block min-h-12 w-full min-w-0 appearance-none rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-base text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-[#0D7A6B] focus:ring-2 focus:ring-[#0D7A6B]/15 focus:shadow-[0_0_0_3px_rgba(13,122,107,0.06)] hover:border-neutral-400";

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
    ? "Validate access setup"
    : "Access is administrator-provisioned";

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
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-neutral-700">
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
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
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
            className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full border border-[#0D7A6B] bg-[#0D7A6B] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(13,122,107,0.18)] transition-colors hover:bg-[#09695d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0D7A6B]/25 disabled:cursor-not-allowed disabled:opacity-50"
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
                  Checking details...
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
