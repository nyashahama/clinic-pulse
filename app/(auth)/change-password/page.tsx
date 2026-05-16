import { ClinicPulseMark } from "@/components/brand/clinicpulse-logo";
import {
  ChangePasswordForm,
  type ChangePasswordActionState,
} from "@/components/auth/change-password-form";
import { changePassword, ClinicPulseAuthApiError } from "@/lib/auth/api";
import { getMembershipHomeHref } from "@/lib/auth/role-home";
import { getCurrentSession, getSessionCookieHeader } from "@/lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function changePasswordAction(
  _state: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  "use server";

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const cookieHeader = await getSessionCookieHeader();

  if (!cookieHeader) {
    redirect("/login");
  }

  const session = await getCurrentSession({ cookieHeader });
  if (!session) {
    redirect("/login");
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Complete every password field." };
  }
  if (newPassword.length < 12) {
    return { error: "Use a new password with at least 12 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }
  if (newPassword === currentPassword) {
    return { error: "Choose a new password that differs from the temporary password." };
  }

  try {
    await changePassword(currentPassword, newPassword, {
      init: {
        headers: {
          cookie: cookieHeader,
          "x-clinicpulse-server-mutation": "1",
        },
      },
    });
  } catch (error) {
    if (
      error instanceof ClinicPulseAuthApiError &&
      (error.status === 400 || error.status === 401)
    ) {
      return { error: "The temporary password was not accepted." };
    }

    throw error;
  }

  redirect(getMembershipHomeHref(session.memberships));
}

export default async function ChangePasswordPage() {
  const cookieHeader = await getSessionCookieHeader();
  const session = cookieHeader ? await getCurrentSession({ cookieHeader }) : null;
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between px-4 pb-5 pt-24 sm:px-6">
      <div className="grow basis-0" />

      <main className="relative flex w-full flex-col items-center justify-center">
        <section className="w-full max-w-[28rem] rounded-[2rem] border border-white/70 bg-white/78 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-border dark:bg-card/90 dark:shadow-black/30 sm:p-7">
          <div className="text-center">
            <ClinicPulseMark className="mx-auto mb-4 size-12 rounded-2xl shadow-lg shadow-emerald-950/20" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D7A6B]">
              Password rotation
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-card-foreground">
              Set a new password
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-muted-foreground">
              {session.user.passwordResetRequired
                ? "Your account was provisioned with a temporary password. Replace it before entering the workspace."
                : "Update your ClinicPulse password before returning to the workspace."}
            </p>
          </div>

          <div className="mt-8">
            <ChangePasswordForm action={changePasswordAction} />
          </div>

          {!session.user.passwordResetRequired ? (
            <p className="mt-6 text-center text-sm font-medium text-neutral-500 dark:text-muted-foreground">
              Need to keep your current password?{" "}
              <Link
                href={getMembershipHomeHref(session.memberships)}
                className="font-semibold text-[#0D7A6B] transition-colors hover:text-neutral-900 dark:text-emerald-300 dark:hover:text-foreground"
              >
                Return to workspace
              </Link>
            </p>
          ) : null}
        </section>
      </main>

      <div className="grow basis-0" />
    </div>
  );
}
