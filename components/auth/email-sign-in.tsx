"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export function EmailSignIn() {
  const [email, setEmail] = useState("");

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
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
          onChange={(e) => setEmail(e.target.value)}
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
