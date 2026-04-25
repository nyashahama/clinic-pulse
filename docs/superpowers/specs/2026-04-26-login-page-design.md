# Login Page — dub.co-style Split Screen

**Date:** 2026-04-26
**Status:** Approved

## Summary

Implement a dub.co-style login page for ClinicPulse at `/login`. A split-screen layout with branding on the left and the auth form on the right. Supports two auth methods (UI-only, no backend wiring): email magic link and Google OAuth.

## Decisions

- **Auth methods:** Email magic link + Google OAuth (UI only, no database or auth logic for now)
- **Layout:** Split screen — left side with branding/grid background, right side with form
- **Route:** `app/(auth)/login/page.tsx`
- **Auth layout:** `app/(auth)/layout.tsx` — shared across future auth pages (register, forgot-password, etc.)

## Component Architecture

```
LoginPage (server)
└── AuthLayout (server) — split screen shell
    ├── BrandingPanel (left side, hidden on mobile)
    │   ├── ClinicPulse wordmark text logo
    │   ├── Dot grid pattern background
    │   └── Conic gradient glow
    └── LoginPanel (right side, full width on mobile)
        ├── Heading ("Log in to your ClinicPulse account")
        ├── LoginForm (client — "use client")
        │   ├── EmailSignIn — email input + "Log in with email" button
        │   ├── AuthMethodsSeparator — "OR" divider
        │   └── GoogleButton — "Continue with Google" button
        ├── Sign-up link ("Don't have an account? Sign up")
        └── Terms footer
```

## Files

| File | Purpose |
|------|---------|
| `app/(auth)/layout.tsx` | Auth layout — split screen with terms |
| `app/(auth)/login/page.tsx` | Login page — server component |
| `components/auth/login-form.tsx` | Client form — method switching |
| `components/auth/email-sign-in.tsx` | Email field + submit button |
| `components/auth/google-button.tsx` | Google OAuth button |
| `components/auth/auth-methods-separator.tsx` | "OR" divider |
| `components/auth/branding-panel.tsx` | Left side branding panel |

## Design Details

### Split Screen Layout

```css
grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_440px] lg:grid-cols-[minmax(0,1fr)_595px]
```

- **Desktop (≥900px):** Two columns — left is flexible, right is fixed width (440px-595px)
- **Mobile (<900px):** Single column, right panel fills screen
- **Height:** `min-h-[100dvh] min-h-screen`

### Left Panel (BrandingPanel)

- Background: white `bg-white`
- Dot grid pattern across full panel with `[mask-image:linear-gradient(black,transparent_320px),linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]`
- Conic gradient glow orb at top-center: `size-[80px]` with `mix-blend-overlay blur-[50px] saturate-[2]`
- ClinicPulse wordmark centered at top: text-based logo matching the nav's typography
- Clean, minimal — no testimonial content for now

### Right Panel (LoginPanel)

- Background: `bg-neutral-50` with `border-l border-black/5`
- Content vertically and horizontally centered via flexbox
- Form max-width: `max-w-sm` (384px)
- Consistent border styling with existing border tokens

### Form Components

**LoginForm** — client component
- Wraps EmailSignIn and GoogleButton
- Email field shown by default
- Google button shown below "OR" separator
- No password field (magic link only, no credentials provider)

**EmailSignIn**
- Label: "Email"
- Input: email type, auto-focused on desktop, placeholder: "panic@thedis.co"
- Button: "Log in with email" (disabled state when processing)
- Styling: matches dub.co — rounded-md border, neutral-300 border, shadow-sm

**GoogleButton**
- Button: "Continue with Google" with Google icon (from lucide-react or SVG)
- Variant: secondary/outline style

**AuthMethodsSeparator**
- Horizontal lines with "OR" text centered
- Muted styling: `border-b border-neutral-200` with `text-content-muted text-xs uppercase`

### Footer

- Terms of Service and Privacy Policy links
- Styled: `text-xs font-medium text-neutral-500`
- Links to placeholder pages or external legal pages

## Styling Notes

- Use existing CSS variables: `--color-content-emphasis`, `--color-content-default`, `--color-content-subtle`, `--color-content-muted`
- Use existing border tokens: `--color-border-default`, `--color-border-muted`, `--color-border-subtle`
- Follow existing Tailwind v4 patterns from globals.css
- Font: Inter for body, Satoshi for .font-display
- Use `cn()` from `@/lib/utils` for class merging

## What's NOT Included

- Auth logic (signIn calls, next-auth, database)
- Password authentication
- Registration page
- Forgot password page
- Middleware/route protection
- Error handling / toast notifications
- Dark mode

## Dependencies

No new dependencies needed. All components use:
- `lucide-react` (already installed) for Google icon
- Tailwind CSS v4 (already configured)
- `next/link` for navigation
- `@/lib/utils` for `cn()`
