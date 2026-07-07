# Design Decisions

## Product Identity

Name: LabLens

Concept: a private lens over lab reports. The icon concept is a rounded square with a pulse line inside, suggesting health data review without clinical authority.

## Visual Direction

- Clean, premium, and calm with warm neutral surfaces, teal primary actions, amber caution, rose danger, green success, and violet analytical accents.
- Cards are used for dashboard metrics and framed workflows only.
- Desktop uses a persistent sidebar. Mobile uses a bottom navigation bar.
- Light and dark modes use the same semantic tokens for contrast consistency.

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

## Accessibility

- Form controls use visible labels.
- Buttons include icons where the action benefits from quick recognition.
- Focus states use a high-contrast ring.
- Charts are paired with tabular data for readability.
