"use client";

import { EmailSignIn, type EmailSignInAction } from "./email-sign-in";

export function LoginForm({
  loginAction,
  returnTo,
}: {
  loginAction?: EmailSignInAction;
  returnTo?: string;
}) {
  return (
    <div>
      <EmailSignIn action={loginAction} returnTo={returnTo} />
    </div>
  );
}
