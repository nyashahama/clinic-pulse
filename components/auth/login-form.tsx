"use client";

import { AuthMethodsSeparator } from "./auth-methods-separator";
import { EmailSignIn, type EmailSignInAction } from "./email-sign-in";
import { GoogleButton } from "./google-button";

export function LoginForm({ loginAction }: { loginAction?: EmailSignInAction }) {
  return (
    <div className="flex flex-col gap-3">
      <EmailSignIn action={loginAction} />
      <AuthMethodsSeparator />
      <GoogleButton />
    </div>
  );
}
