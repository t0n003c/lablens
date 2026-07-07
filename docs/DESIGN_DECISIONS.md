# Design Decisions

## Product Identity

Name: LabLens

Concept: a private lens over lab reports. The icon concept is a rounded square with a pulse line inside, suggesting health data review without clinical authority.

## Visual Direction

- Clean, premium, and calm with neutral surfaces, teal primary actions, amber caution, rose danger, green success, and violet analytical accents.
- Cards are used for dashboard metrics and framed workflows only.
- Desktop uses a persistent sidebar. Mobile uses a bottom navigation bar.
- Light and dark modes use the same semantic tokens for contrast consistency.
- The 1.1.0 UI refresh uses a dedicated light palette and OLED-friendly dark palette, backed by semantic CSS tokens.
- Appearance has three choices: System, Light, and OLED Dark. Account settings store the choice for signed-in users, while local storage applies it early enough to avoid a jarring flash on reload.
- Image-generated boards are treated as design input, then critiqued before implementation. Any generated social-login controls are excluded unless the backend actually supports them.
- The generated illustration style is clean lab-report imagery with a glass lens, teal/graphite accents, no text, and no diagnostic claims.

## UX Principles

- The app should make review states obvious: draft, reviewed, finalized, failed.
- Abnormal values should be visible but not alarming without context.
- Every AI or generated health summary must preserve uncertainty and clinician follow-up language.
- Manual entry must be equal to PDF upload in the data model so parsing failure never blocks a user.
- Demo values are a guest-only affordance. Once a user is signed in, the dashboard must reflect that user's saved data or a clear empty state after deletion.
- Biometric login is a second step after email/password, not a passwordless shortcut. If enabled, the login screen should clearly pause after password and ask for the device biometric prompt before creating a session.
- Settings should only turn biometric login on after a successful device registration, so a user is not locked behind a switch that has no usable credential.
- Lab flags should avoid ambiguous user-facing labels: numeric values with one-sided reference ranges are still evaluated, while text-only rows such as `SEE NOTE` are shown as `not evaluated`.
- Dashboard guidance should have distinct jobs: `Needs review` is a test-level flagged-value list, while the trend area pairs the graph with plain-language movement notes so the user can understand what changed and whether it seems better, worse, or inconclusive.
- The standalone `Summary` and short report summary treatment were removed from the dashboard because they repeated what `Needs review` and the lab table already explain.
- `Needs review` explanations should be marker-specific, using the value, supplied range, and practical interpretation context instead of repeating one generic warning for every flagged row.
- Latest lab value test names should explain themselves on hover and keyboard focus with short, cautious descriptions of what the marker is commonly used to review.
- Latest lab value descriptions should include plain low/high associations when useful, such as low MCH often fitting iron deficiency and high MCH often fitting B12/folate, liver, thyroid, alcohol, or medicine context, while avoiding single-value diagnosis.
- Trend charts can combine markers with different units and different healthy directions, so the graph should show relative change from each marker's own first saved result rather than raw lab values on one shared axis.
- Trend matching must be test-specific: HDL, total cholesterol, triglycerides, ratios, and LDL should never be merged into a generic `cholesterol` trend.
- Missing values should remain visibly missing; the chart should not quietly connect lines across reports that did not include that marker.
- The trend area should explain why a marker appears from an info button: lines are limited to supported markers the app can safely match across reports, currently total cholesterol, HDL cholesterol, triglycerides, A1c, and vitamin D.
- Trend insights should follow the selected marker. When a user selects HDL, A1c, triglycerides, or another line, the explanation panel should only discuss that selected marker.
- Trend insights should label the selected marker as Better, Worse, Stable, or Not enough data yet so the user does not have to infer meaning from the line direction alone.
- Recommendations should name the relevant marker and value when possible, suggest small trackable habits, and avoid treatment, medication, or supplement-dose instructions.
- The Routine recommendation section should read like daily behavior guidance: reminders, meal cues, drink habits, and small weekly checklists. Grocery and food swaps belong in Food so Routine does not repeat the same advice in less natural wording.
- For A1c, glucose, and triglyceride food guidance, recommendations should plainly mention cutting back on sugary drinks, desserts, and refined carbs when relevant, while avoiding the misleading idea that all carbs should be eliminated.
- Optional profile context can personalize fit and examples, but must not infer disease risk, change lab thresholds, or stereotype based on age, gender, country, ethnicity, job, or hobbies.
- One login can manage more than one person's labs. The selected person is explicit during upload/manual entry and on the dashboard, because silently mixing household reports would make trends, latest values, and next steps unsafe and confusing.
- Person profiles can have their own age, gender, country/region, cultural background or ethnicity, work, hobbies, and routine notes. These fields personalize examples and daily-fit suggestions only; they do not change lab thresholds or imply different medical rules.
- Report history should offer an `All people` view for account cleanup plus person filters for focused review.
- The separate dashboard recommendation section was removed. The useful version of recommendations is `My next steps`: short, direct, grouped actions that are easy to follow.
- `My next steps` should show short direct action labels generated from the current report's recommendations.
- `My next steps` should support deleting individual steps and a section-level `Reset` that restores deleted steps from the current report.
- `My next steps` should be grouped by habit area so Sleep, Routine, Food, and Movement do not blend into one flat list.
- `My next steps` should help the user prioritize and understand actions: show a top-three starting set, why each step helps the relevant marker, marker tags, frequency, time or effort, and an easy replacement when a step does not fit.
- The `i` popover in `My next steps` should only appear when it can name the relevant lab marker or marker family. Do not show generic explanations like "helps turn this report into one small action."
- `My next steps` should prefer concrete marker-based actions, such as naming vitamin D food examples and using direct liver-marker actions that avoid extra alcohol, supplements, pain relievers, or hard workouts without telling users to stop prescribed care.
- `My next steps` should hide low-value generic labels and profile-only explanation popovers; steps that only tell the user to prepare before the next lab are not shown as current action steps.
- `My next steps` should avoid repeating the same action in both `Start here` and category groups, and should suppress near-duplicate actions such as multiple versions of the same sugar, starch, walk, sleep, or routine setup step.
- `My next steps` should not show grocery-swap wording under Routine; those actions should either be Food steps or be hidden if they are redundant.
- `My next steps` should not include filler maintenance advice like "keep your current habit steady" or broad planning advice like "pick one or two habits"; each visible step should name one concrete behavior.
- In `My next steps`, each card should read vertically: step text first, then a wrapping footer row with labels and action buttons. Labels and buttons can share one row when space allows and wrap to a second row in narrow cards.
- The Sleep, Routine, Food, and Movement cards should stay wide enough for footer labels and action buttons to fit naturally; avoid squeezing all four category cards into one desktop row.
- Dashboard should lead with a cautious health score. The score is a snapshot of report completeness, range flags, and trend coverage, not a diagnosis or medical grade.
- Trend charts should offer range and zoom controls plus selected-line emphasis, because users need to explore changes without guessing what each line means.
- Auth, sign-up, recovery, upload, processing, review, dashboard, reports, people, and settings must share the same visual system so a healthcare app feels consistent and trustworthy.
- The clickable prototype lives in `docs/design/1.0-ui-refresh/prototype.html`; it is design-review material, while the Next.js app remains the source of truth for real behavior.
- Primary navigation should show the active page with `aria-current` on desktop and mobile so users do not lose orientation inside dense health data.
- Desktop account status lives in a compact icon popover beside the LabLens mark. Hovering or clicking it shows signed-in state, name, email, and logout without taking sidebar space away from navigation.
- Settings should not show disabled controls that look broken. Server-configured features such as Turnstile and AI provider are status panels until user-facing controls exist.
- Generated boards can inspire future controls, but app UI only ships controls backed by working behavior.
- The generated glass/lab report illustration is used in functional app contexts, not as loose decoration: auth and upload intake keep the visual trust cue, while the dashboard shell stays focused on usable health data.
- The mood-board alignment pass prioritizes layout composition and material primitives over incremental card styling. The source of truth for the pass is `docs/design/1.0-ui-refresh/MOODBOARD_ALIGNMENT_PLAN.md` and ADR 0003.
- Dashboard first viewport uses a composed `HealthScoreHero` instead of a generic card stack. It leads with the cautious health score and a short reason for the score, places `Start here` beside it, and uses three colored status cards for Saved reports, Raw PDF storage, and Needs review.
- The top Health snapshot header uses the person selector instead of upload/manual actions, because multi-person context changes the whole dashboard and should be visible before reviewing values.
- In the dashboard hero, `Start here` rows keep the action text on the left and align marker tags/buttons to the right edge so the steps read cleanly at a glance.
- Mobile dashboard uses its own compact health-score composition instead of relying on the desktop hero to collapse. This makes the phone view closer to the mood board's mobile cards and avoids a long stack before the user sees key values.
- The dashboard no longer has a separate shortcut rail. The top `Needs review` card is a status shortcut, the detailed `Needs review` section remains the single working flagged-values area, and saved values stay in the lab table.
- Trend charts use a dark `TrendInstrument` surface in both light and OLED modes because the mood board treated trend review as a focused instrument. The selected-line explanation stays beside the graph so users do not separate the visual movement from the plain-language meaning.
- The trend instrument now has working Trend, Compare, and Distribution modes. These are backed by the same saved report data and avoid unsupported controls: Trend shows the zoomable line chart, Compare shows first/latest movement by marker, and Distribution shows latest value within the saved range for the selected marker set.
- Trend chart hover tooltips should describe one marker at one saved date, not every marker on that date, and only that hovered/selected marker should get the active point highlight. The first line/point click should select that marker immediately. Avoid persistent obvious readouts such as Latest update, Matched markers, Chart tools, or Latest point when the chart already communicates that context.
- The mobile PWA install prompt should stay compact by default. It can ask to install the app, but it should not auto-expand instructions or cover the first health-score card.
- The expanded generated asset set has distinct jobs: trust/privacy, trend review, upload/review, and general report-lens imagery. Assets are not used as random decoration.

## Release Decisions

- The current app is release `1.1.0`.
- Future updates should be held locally and tested before asking for approval to push to GitHub or publish a new Docker image.

## Accessibility

- Form controls use visible labels.
- Buttons include icons where the action benefits from quick recognition.
- Focus states use a high-contrast ring.
- Charts are paired with tabular data for readability.
