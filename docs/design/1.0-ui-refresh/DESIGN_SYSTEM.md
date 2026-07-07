# LabLens Design System

## Principles

- Clarity before cleverness: every page starts with the user's current task.
- Trust through restraint: quiet colors, direct copy, visible privacy controls.
- Health language stays careful: use "flagged", "worth reviewing", and "ask your clinician" instead of diagnostic claims.
- Touch friendly by default: 44 px minimum controls, visible hover/focus, comfortable spacing on mobile.
- Responsive density: desktop shows comparison and review side by side; tablet stacks secondary panels; mobile keeps action buttons near the content they affect.

## Color Tokens

### Light

- `background`: `#f6f8f7`
- `foreground`: `#111817`
- `panel`: `#ffffff`
- `panel-muted`: `#edf4f2`
- `surface-glass`: translucent white panel for premium glass surfaces
- `surface-instrument`: `#071716`
- `surface-raised`: `#fbfdfc`
- `surface-chart`: `#061110`
- `border`: `#d8e2df`
- `border-soft`: translucent soft divider for glass panels
- `border-strong`: `#aabcb7`
- `muted`: `#60706c`
- `primary`: `#08776f`
- `primary-strong`: `#065f59`
- `accent`: `#6d5dfc`
- `success`: `#16835c`
- `warning`: `#b35b00`
- `danger`: `#c92d4f`

### OLED Dark

- `background`: `#020605`
- `foreground`: `#eef8f5`
- `panel`: `#0b1211`
- `panel-muted`: `#111d1b`
- `surface-glass`: translucent OLED panel
- `surface-instrument`: `#030807`
- `surface-raised`: `#0f1816`
- `surface-chart`: `#020605`
- `border`: `#223331`
- `border-soft`: translucent soft divider for OLED glass panels
- `border-strong`: `#405b56`
- `muted`: `#9db2ad`
- `primary`: `#3ddac7`
- `primary-strong`: `#86fff0`
- `accent`: `#a99cff`
- `success`: `#59d996`
- `warning`: `#ffb84d`
- `danger`: `#ff7088`

### Charts

- Total cholesterol: primary teal.
- HDL: success green.
- Triglycerides: amber warning.
- A1c: violet accent.
- Vitamin D: rose danger.

Chart lines must support tooltips, selected-line emphasis, reduced opacity for inactive lines, range controls, and a brush/zoom control when enough points exist.

## Typography

- Font: system UI stack, optimized for Apple platforms and readable browser defaults.
- Hero/page title: 30-40 px, semibold.
- Section title: 18-22 px, semibold.
- Body: 14-16 px, 1.55-1.7 line height.
- Metadata and labels: 12-13 px, uppercase only for small eyebrows.
- Letter spacing stays at `0` except small uppercase labels, which use mild tracking.

## Spacing

- Base grid: 4 px.
- Page padding: 16 px mobile, 24 px tablet, 32 px desktop.
- Card padding: 16-24 px depending on density.
- Section gap: 24-32 px.
- Inline control gap: 8-12 px.

## Components

- Buttons: icon plus short label when the action is textual; icon-only for repeated row controls with accessible labels and titles.
- Cards: 8 px radius, one card layer only, subtle border, no nested card stacks.
- Glass panels: translucent, blurred, soft-border page modules for dashboard, person selector, next steps, review, and latest values.
- Instrument panels: dark, high-contrast modules for chart-heavy surfaces. They can use generated material imagery as a low-opacity background behind real data.
- Metric tiles: compact count/value modules inside larger composed panels, not a replacement for full sections.
- Marker rows: compact test/value/status rows used inside health-score and review contexts.
- Segmented controls: range/mode controls for charts and similar mode choices.
- Inputs: high-contrast border, 44 px minimum height, visible focus outline.
- Shortcut rail: compact clickable dashboard links for saved values, review flags, reports, and storage status. It replaces the older large stat-card row.
- Health score hero: top dashboard anchor with a large score ring, latest marker rows, in-range/review/trend counts, and a trust visual. It explains confidence without pretending to diagnose. Mobile uses a dedicated compact dark score card plus key-value rows rather than a stacked desktop layout.
- Next steps: grouped by Sleep, Routine, Food, Movement; buttons sit below text and wrap naturally.
- Trend instrument: dark chart well with marker chips, selected-line insight, segmented range controls, zoom/reset controls, and brush control when enough points exist. It includes working Trend, Compare, and Distribution modes, point-specific hover tooltips, and first-click line selection without extra obvious status/readout panels.
- Tooltips: plain-language descriptions, no legal boilerplate, keyboard accessible.
- Navigation: lucide icon family only, desktop sidebar, mobile bottom nav.

## Motion

- Hover: 1-2 px lift plus border/background shift.
- Active: return to resting position.
- Loading: spinner only where the user is waiting for an operation.
- Reduced motion: disable decorative transforms through `prefers-reduced-motion`.

## Illustration

Use one consistent generated bitmap style: clean lab report, glass lens, petri/glass materials, soft teal/graphite accents, no text, no brand logos. Illustrations support functional contexts and should not replace real data.

Current project assets:

- `lablens-report-lens.png`: general report/lens visual.
- `lablens-glass-trust.png`: privacy, sidebar, auth, and trust panels.
- `lablens-trend-lens.png`: dark trend instrument background.
- `lablens-upload-review.png`: upload and extracted-row review context.
