"use client";

import { AuthMethodsSeparator } from "./auth-methods-separator";
import { EmailSignIn } from "./email-sign-in";
import { GoogleButton } from "./google-button";

export function LoginForm() {
  return (
    <div className="flex flex-col gap-3">
      <EmailSignIn />
      <AuthMethodsSeparator />
      <GoogleButton />
    </div>
  );
}
