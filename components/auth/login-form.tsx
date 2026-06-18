"use client";

import { AuthMethodsSeparator } from "./auth-methods-separator";
import { EmailSignIn, type EmailSignInAction } from "./email-sign-in";
import { GoogleButton } from "./google-button";
import { AuthFadeIn } from "./auth-stagger";

export function LoginForm({
  loginAction,
  returnTo,
}: {
  loginAction?: EmailSignInAction;
  returnTo?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <EmailSignIn action={loginAction} returnTo={returnTo} />
      <AuthFadeIn>
        <AuthMethodsSeparator />
      </AuthFadeIn>
      <AuthFadeIn>
        <GoogleButton />
      </AuthFadeIn>
    </div>
  );
}
