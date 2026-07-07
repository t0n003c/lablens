# ADR 0003: Mood-Board Aligned UI Architecture

Date: 2026-07-06

## Status

Accepted and partially implemented for local post-1.0 work.

## Context

The first UI refresh improved functionality and consistency but did not closely match the stronger generated mood board. The app still reads too much like a generic admin dashboard because visual improvements were applied mostly through class changes and a single illustration, rather than through a coherent layout/material architecture.

The mood board's strongest qualities are:

- composed dashboard sections rather than uniform stacked cards
- glass/lens clinical material language
- confident health score hierarchy
- distinct trend instrument panels
- clearer privacy/trust surfaces
- dedicated light and OLED dark palettes
- consistent lucide-style icon language

## Decision

Refactor the UI around reusable mood-board-aligned primitives instead of continuing one-off Tailwind edits.

Add a small component layer for:

- glass/material panels
- instrument panels for chart-heavy surfaces
- metric tiles and marker rows
- segmented controls
- health score hero
- trend instrument
- upload intake panel

Extend CSS tokens for material surfaces, shadows, and health-score states. Generate or crop a small set of consistent glass/lab illustration assets and use them in functional contexts.

First implementation pass:

- Added the material token layer in `src/app/globals.css`.
- Added `GlassPanel`, `InstrumentPanel`, `MetricTile`, `MarkerRow`, `StatusDot`, and `SegmentedControl`.
- Added `HealthScoreHero` and `TrendInstrument`.
- Added trust, trend, and upload/review generated assets.
- Rebuilt the dashboard first viewport and trend area around those primitives, with the dashboard hero focused on health score, Start here, Saved reports, Raw PDF storage, and Needs review instead of duplicate shortcut content.

## Consequences

Positive:

- The implementation can match the mood board more closely and consistently.
- Dashboard, auth, upload, reports, people, and settings can share a recognizable product language.
- Future UI work has clear primitives instead of scattered class decisions.
- Accessibility, dark mode, and responsive behavior can be checked at the primitive level.

Tradeoffs:

- This is a larger refactor than incremental polish.
- Some current components will need structural changes.
- More screenshots and browser smoke checks are required.

## Boundaries

- Do not ship controls that are not backed by working behavior.
- Do not change backend contracts unless a later product feature explicitly needs it.
- Do not change health interpretation logic or make diagnostic claims.
- Do not publish the post-1.0 UI work until the user explicitly approves.

## Verification

Before considering the work complete:

- `npm run lint`
- `npm run test`
- `npm run build`
- Browser smoke on desktop, tablet, and mobile
- Light and OLED dark screenshots
- Chart interaction smoke
- Upload/review smoke
- Settings export/delete controls smoke
