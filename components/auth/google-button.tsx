export function GoogleButton() {
  return (
    <button
      type="button"
      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.25-.66-.38-1.36-.38-2.09s.14-1.43.38-2.09V7.07H2.18a11.99 11.99 0 0 0 0 10.86l3.66-3.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.59 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.93l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  );
}
