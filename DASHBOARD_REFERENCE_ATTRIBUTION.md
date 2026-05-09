# Dashboard Reference Attribution

## shadcn/ui

- Source: https://github.com/shadcn-ui/ui
- License: MIT
- Usage: copied the sidebar primitive and the `sidebar-16` block structure through the shadcn CLI. Added the `card`, `badge`, and `table` primitives through the shadcn CLI.
- Dashboard block source: `reference-projects/shadcn-ui/apps/v4/registry/new-york-v4/blocks/dashboard-01/components/section-cards.tsx`
- Primitive sources: `reference-projects/shadcn-ui/apps/v4/registry/new-york-v4/ui/card.tsx`, `reference-projects/shadcn-ui/apps/v4/registry/new-york-v4/ui/badge.tsx`, `reference-projects/shadcn-ui/apps/v4/registry/new-york-v4/ui/table.tsx`
- ClinicPulse changes: replaced sample Acme navigation with role-aware ClinicPulse navigation, wired the shell into the authenticated demo layout, and adapted the `dashboard-01` section-card composition for role-specific operations metrics.

## TailAdmin React

- Source: https://github.com/TailAdmin/free-react-tailwind-admin-dashboard
- License: MIT
- Usage: adapted the panel pattern from `src/components/common/ComponentCard.tsx`.
- ClinicPulse changes: replaced the generic card body with ClinicPulse role evidence, actions, and readiness sections while keeping the TailAdmin header/body panel split.

## TailwindAdmin

- Source: https://github.com/Tailwind-Admin/free-tailwind-admin-dashboard-template
- License: MIT
- Usage: used as a Next.js/shadcn dashboard reference for role-based app-shell composition.
- ClinicPulse changes: adapted the structure to the existing App Router route groups and authenticated demo workspace.

## Excluded source

- Cruip Mosaic Lite was reviewed only as a high-level dashboard reference and no code was copied because its repository states GPL terms and redistribution restrictions.
