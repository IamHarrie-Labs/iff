# Iff wordmark

Selected direction: 07, the geometric wordmark. The rebuilt SVG uses a squared i dot and matching 45-degree cuts on the two f ascenders. The custom geometry does not depend on an installed font.

- `public/iff-wordmark.svg`: transparent, one-color wordmark.
- `public/iff-wordmark-light.svg`: ivory wordmark for dark surfaces.
- `public/favicon.svg`: dark rounded-square icon.
- `public/icon-180.svg`, `icon-192.svg`, `icon-512.svg`: scalable icon variants.
- `app/components/IffLogo.tsx`: inline, theme-aware component.

Use at least 42 px width for the full wordmark in navigation, keep a clear area of half the i-stem width around it, and avoid stretching or rotating. Use the square icon in browser tabs and app launchers. Small-size optical changes should preserve the dot gap and both counters.

The former generated concepts remain in `design/logo-options` for reference. The selected SVG is a clean geometric reconstruction, not an automatic trace of raster artifacts.
