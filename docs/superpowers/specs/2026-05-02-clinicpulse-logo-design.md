# ClinicPulse Logo Design

## Goal

Create and link a clinical, official-feeling logo for ClinicPulse that works in the product chrome and browser/app icon surfaces.

## Direction

Use a shielded clinic cross with a pulse line. The mark should feel restrained and public-health oriented, not decorative or consumer-health casual. It should stay legible at small sizes and align with the existing green availability/status language already used across the app.

## Implementation Shape

- Add a reusable logo component for visible brand placement in the nav and footer.
- Add a file-based `app/icon.svg` so Next automatically links the favicon/app icon metadata.
- Add an `app/apple-icon.tsx` generated icon for Apple touch icon support, following the local Next metadata file convention docs.
- Keep colors close to the existing palette: neutral ink, white, and ClinicPulse green.

## Testing

Run lint/build checks available in the project. Confirm the new files are picked up by Next metadata conventions and that the logo renders in existing navigation/footer surfaces without layout regression.
