# Mood Board Alignment Plan

Status: partially implemented local post-1.0 work

## Implementation Progress

Completed locally:

- Added material tokens for glass panels, instrument panels, raised surfaces, chart wells, softer borders, stronger borders, score states, and mood-board shadows.
- Added reusable UI primitives: `GlassPanel`, `InstrumentPanel`, `MetricTile`, `MarkerRow`, `StatusDot`, and `SegmentedControl`.
- Added composed dashboard components: `HealthScoreHero` and `TrendInstrument`.
- Generated and saved the expanded asset set:
  - `public/illustrations/lablens-glass-trust.png`
  - `public/illustrations/lablens-trend-lens.png`
  - `public/illustrations/lablens-upload-review.png`
- Rebuilt the dashboard first viewport around the person selector, health score, `Start here`, and three colored status cards: Saved reports, Raw PDF storage, and Needs review.
- Removed the separate dashboard shortcut rail so Saved values stays in the lab table and the detailed `Needs review` section remains the single flagged-values work area.
- Replaced the plain chart card and separate insight card with a dark trend instrument that keeps selected-line insight next to the chart.
- Updated the sidebar, auth frame, upload flow visual, review panel, next steps, and latest lab table to use the material system.
- Replaced the desktop sidebar auth card with a compact account popover next to the LabLens mark so account state is available without making the sidebar feel like an admin panel.
- Added a dedicated mobile health-score composition so the phone dashboard no longer depends on the desktop hero simply stacking into one column.
- Expanded the trend instrument with working Trend, Compare, and Distribution modes, point-specific hover tooltips, first-click line selection, and a cleaner chart area without obvious status/readout panels.
- Reduced the mobile PWA install prompt so it asks to install without covering the first dashboard card or auto-expanding setup instructions.
- Fixed the theme hydration warning caused by the early theme script changing the `<html>` theme attribute before React hydration.

Still planned:

- Deeper Reports page refactor into a report list/table hybrid.
- Deeper People page refactor into profile rows and a clearer edit sheet.
- Settings internal section navigation and final surface polish.
- Dedicated upload intake component if the upload form needs more than the current visual refresh.
- Desktop/tablet/mobile screenshot audit in both Light and OLED Dark before release approval.

## Problem

The current refreshed UI is cleaner than the original app, but it still reads like a generic admin dashboard with a few generated images added. The original `01-moodboard.png` looks better because it has a complete visual system:

- spacious editorial layout
- stronger first-screen brand signal
- glass/lab material imagery used as composition, not decoration
- more confident health-score hierarchy
- fewer generic metric cards
- calmer, more premium light surfaces
- more intentional OLED dark surfaces
- trend modules that feel like focused instruments
- clearer trust/privacy panels

The next iteration should treat the mood board as the design source of truth, not the later generated app boards.

## North Star

LabLens should feel like a private, premium health-review instrument: Apple Health/Oura-level calm, Notion-level clarity, and Stripe-level trust. The app should still be dense enough to be useful, but the first impression should be "this is a thoughtful health product" instead of "this is a database admin UI."

## Non-Negotiables From The Initial UI Prompt

- Keep a comprehensive design system: colors, typography, spacing, components, icons, motion, tokens.
- Support light and OLED dark as first-class palettes.
- Keep every major flow covered: login, sign up, forgot password, dashboard, upload, processing, review, reports, people, settings.
- Keep responsive desktop, tablet, and mobile behavior intentional.
- Keep charts interactive, animated, readable, and zoomable.
- Keep health score at the top of Dashboard.
- Keep one consistent icon family, currently lucide.
- Keep a consistent generated illustration/material style.
- Keep healthcare trust, accessibility, and cautious language ahead of visual novelty.
- Critique generated ideas before implementation; do not ship unsupported controls.

## Gap Analysis

### 1. Layout System Gap

Current app:
- Uses uniform stacked cards and grids.
- Page sections have similar weight, so the dashboard lacks a memorable first viewport.
- Mood-board imagery is present but secondary.

Mood board:
- Uses large composed panels.
- Important modules have intentional asymmetry.
- Trust, clarity, trends, and next steps each have a distinct layout role.

Required change:
- Replace generic section stacking with a composed dashboard canvas:
  - first row: Health score overview + key marker table + glass/lens trust panel
  - second row: My next steps + Needs review
  - third row: large Trends instrument + selected insight panel
  - final row: Latest lab values table

### 2. Material System Gap

Current app:
- Most panels are flat bordered rectangles.
- The generated lens image appears in a few places but feels pasted in.

Mood board:
- Has glass, lens, petri dish, and soft clinical materials.
- Uses deep OLED cards as premium contrast anchors.

Required change:
- Add a small material component family:
  - `GlassPanel`
  - `InstrumentPanel`
  - `MetricTile`
  - `TrustPanel`
  - `MarkerRow`
- Use image crops as integrated backgrounds with overlays, not standalone decorative cards.
- Give chart and health-score areas more visual depth while keeping 8px radius.

### 3. Health Score Gap

Current app:
- Score is functional but still text-heavy.
- Score ring is visually modest.

Mood board:
- Health score is the central focal point.
- Score is paired with a compact marker summary and confidence/status context.

Required change:
- Make Health score the true hero of the dashboard:
  - bigger ring
  - clearer label and status
  - compact "in range / needs review / no data" strip
  - latest marker rows visible in the same hero area
  - no diagnostic wording

### 4. Trend Gap

Current app:
- Chart is useful but visually generic.
- Light and dark chart treatments are too similar to a standard Recharts embed.

Mood board:
- Trend chart looks like a premium instrument panel.
- Dark trend card has strong contrast, chips, selected point, and tooltips.

Required change:
- Create a dedicated `TrendInstrument` treatment:
  - darker chart well in both light and OLED modes
  - marker chips under the chart
  - selected metric side panel
  - range buttons styled like segmented controls
  - brush/zoom controls integrated into the panel

### 5. Navigation Gap

Current app:
- Sidebar is functional and now has active state, but it is still blocky.

Mood board:
- Sidebar has product identity, slim navigation, person selector, and trust cue.

Required change:
- Make sidebar lighter in light mode and more polished in OLED:
  - less heavy blocks
  - better person/account selector treatment
  - private/trust card integrated at bottom
  - active nav uses teal background but not a large admin block

### 6. Auth And Upload Gap

Current app:
- Auth is improved but conservative.
- Upload has mood-board image but the form is still dominant.

Mood board:
- Auth/upload feel like guided product experiences.
- Upload stepper and dropzone are visually central.

Required change:
- Auth:
  - stronger split composition on desktop
  - glass/lens image as full-height visual panel
  - concise trust bullets below visual
- Upload:
  - use the three-step process as the spine
  - make the dropzone the main object
  - processing state should be a premium progress module, not only a message
  - review table should read like a verification workflow

### 7. Reports, People, Settings Gap

Current app:
- These pages are mostly conventional forms/lists.

Mood board:
- Reports and People are simpler, cleaner, more product-like.
- Settings uses a left subnav and grouped sections.

Required change:
- Reports:
  - replace full-width repeated table blocks with report list cards/table hybrid
  - use compact status/value columns
  - keep delete clearly available but not visually dominant
- People:
  - show people as profile rows/cards with report counts
  - profile edit form should feel like a side panel or grouped profile sheet
- Settings:
  - add internal section navigation for Appearance, Security, Intelligence, Data
  - keep server-configured features as status panels

## Architecture Plan

### Component Layer

Add mood-board aligned primitives:

- `src/components/ui/glass-panel.tsx`
- `src/components/ui/instrument-panel.tsx`
- `src/components/ui/metric-tile.tsx`
- `src/components/ui/segmented-control.tsx`
- `src/components/ui/status-dot.tsx`
- `src/components/health-score-hero.tsx`
- `src/components/trend-instrument.tsx`
- `src/components/upload-intake-panel.tsx`

These should wrap existing data and behavior; they should not introduce new backend contracts.

### Styling Layer

Extend tokens in `src/app/globals.css`:

- `--surface-glass`
- `--surface-instrument`
- `--surface-raised`
- `--border-soft`
- `--border-strong`
- `--shadow-glass`
- `--shadow-instrument`
- `--score-good`
- `--score-review`
- `--score-careful`

Avoid arbitrary gradients or decorative blobs. Use subtle material depth, image overlays, border contrast, and chart surfaces.

### Asset Layer

Current single image is not enough. Generate or crop a small asset set:

- `lablens-report-lens.png` existing general image
- `lablens-glass-trust.png` privacy/trust panel image
- `lablens-upload-review.png` upload/review image
- `lablens-trend-lens.png` trend/instrument image
- optional mobile-friendly crops for auth/upload

Every asset must be used in a functional context, not as random decoration.

### Page Refactor Layer

Refactor by surface, not by scattered class edits:

1. Dashboard composition
2. Trend instrument
3. Upload/review flow
4. Auth frame
5. Reports/People/Settings
6. Mobile/tablet pass

## Implementation Phases

### Phase 1 - Visual Foundation

Goal: make the base app feel like the mood board before touching every page.

- Add material tokens and panel primitives.
- Add final image asset set.
- Update sidebar and page background treatment.
- Update button, badge, and tile styles.
- Verify light/OLED contrast.

Acceptance:
- Dashboard screenshot immediately resembles the mood board in layout and material feel.
- Sidebar no longer feels like a generic admin nav.
- No horizontal overflow at 390px mobile.

### Phase 2 - Dashboard Redesign

Goal: dashboard becomes the strongest visual proof.

- Replace current health-score section with `HealthScoreHero`.
- Fold top stat cards into the hero or a compact status strip.
- Redesign My next steps cards using marker rows and compact action controls.
- Redesign Needs review as a focused review panel.
- Keep Latest lab values tooltip behavior intact.

Acceptance:
- First viewport shows Health score, key markers, trend/review context, and private visual.
- My next steps remain above Needs review.
- No diagnostic claims.

### Phase 3 - Trend Instrument

Goal: chart feels intentional and premium.

- Build `TrendInstrument` around existing trend math.
- Use dark chart well in both themes.
- Keep selected metric insight behavior.
- Integrate zoom/range/brush controls visually.

Acceptance:
- Trend area looks like the mood board's "Trends" module.
- Selected line changes the insight panel.
- Tooltip raw values remain readable.

### Phase 4 - Auth And Upload

Goal: onboarding and PDF intake become guided experiences.

- Auth frame uses mood-board visual composition and trust bullets.
- Upload uses visual stepper + prominent dropzone.
- Processing uses progress/instrument treatment.
- Review rows use verification state styling.

Acceptance:
- Login, sign-up, forgot password, upload, processing, review are visually coherent.
- No unsupported social login.
- Upload errors and review controls remain functional.

### Phase 5 - Reports, People, Settings

Goal: secondary surfaces stop feeling like plain forms.

- Reports: cleaner list/table hybrid.
- People: profile list + profile details composition.
- Settings: internal section navigation and status panels.

Acceptance:
- Every major flow resembles the same product.
- Export/delete/report deletion remain working.
- No dead buttons.

### Phase 6 - Responsive And QA

Goal: make desktop/tablet/mobile feel designed, not merely stacked.

- Desktop 1280 and wide layout.
- Tablet 768 layout.
- Mobile 390 layout.
- OLED dark and light screenshots.
- Button hover/focus states.
- Chart interaction.
- PWA install prompt check.

Acceptance:
- Browser smoke has no console errors.
- No horizontal overflow.
- `npm run lint`, `npm run test`, `npm run build` pass.
- Update screenshots and docs.

## What Not To Do

- Do not add fake controls to match generated mockups.
- Do not add social login unless auth backend exists.
- Do not add arbitrary accent-color settings; chart color meaning matters.
- Do not use generic gradient blobs or decorative orbs.
- Do not make dashboard sections into nested card stacks.
- Do not make health score sound like a diagnosis.
- Do not change multi-person data boundaries.

## Completion Checklist

- Mood-board asset set exists in `public/illustrations/`.
- Design-system doc reflects implemented tokens/components.
- Dashboard first viewport matches the mood board's hierarchy.
- Auth/upload use generated material imagery as composition.
- Reports/People/Settings follow the same material system.
- Light/OLED dark screenshots captured.
- Desktop/tablet/mobile smoke complete.
- Docs updated with final decisions and test results.
- No push/publish until explicit approval.
