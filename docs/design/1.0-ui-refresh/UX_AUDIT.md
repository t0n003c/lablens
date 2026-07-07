# UX Audit

## Senior Product Design Critique

### Apple Lens

- Strength: the health score and next steps create a quick emotional read before showing dense lab tables.
- Risk: health apps can feel falsely authoritative. The score must describe review load and completeness, not "health" as a medical truth.
- Improvement applied: score copy uses "Snapshot score" and explains it as report-readiness, flags, and trend coverage.

### Stripe Lens

- Strength: clearer status, export/delete controls, and data retention states improve trust for a self-hosted app.
- Risk: upload errors and parser warnings can feel like dead ends.
- Improvement applied: upload uses a stepper, visible review state, and explicit save/finalize actions.

### Figma Lens

- Strength: tokens now cover color, spacing, state, component behavior, and chart semantics.
- Risk: mixed one-off styles can make healthcare UI feel less trustworthy.
- Improvement applied: buttons, cards, tables, chips, and tooltips use shared class patterns and lucide icons.

### Final Board Critique

- The boards suggested accent color controls. Rejected for now because color is part of chart meaning and trust; arbitrary accent colors could reduce consistency.
- The boards suggested password/autolock/session controls. Deferred because they need real backend behavior before appearing in Settings.
- The boards suggested Turnstile as a toggle. Replaced with server-configured status to avoid a button that cannot do anything in the app.
- The boards suggested richer mobile bottom-nav flows. Implemented the active nav state and kept the existing six-route product structure.
- Initial implementation looked too much like a plain admin app. Corrected by applying the generated glass/lab material directly to the app shell, dashboard score panel, auth frame, and upload intake flow.

## Accessibility Review

- Contrast: light and OLED dark palettes maintain readable foreground/background contrast and avoid low-contrast gray-on-gray copy.
- Keyboard: controls retain focus-visible outlines; tooltip triggers work on focus and hover.
- Touch: primary controls meet 44 px minimum height where practical.
- Motion: hover motion is small and disabled for users who prefer reduced motion.
- Charts: tooltips expose raw values and percent change; selected line controls are buttons, not color-only interactions.

## Trust And Clarity Decisions

- Put health score at the top to orient the user before dense data.
- Move "My next steps" before "Needs review" because the user preferred direct, short actions.
- Keep "Needs review" focused on range flags and visit prompts, avoiding duplicate recommendation content.
- Keep trend explanation in an info button and the insight panel tied to the selected line.
- Use practical language in next steps: "Take a short walk after lunch or dinner" instead of vague behavior science phrasing.
- Use raw PDF storage and delete/export states as explicit controls in Settings.

## Issues Found In Generated Boards

- One auth mockup showed third-party social login buttons. LabLens does not currently support social login, so the final UI removes those controls.
- One board labeled as high fidelity rendered more like a wireframe. It is retained as wireframe/prototype input, not as final visual target.
- Some generated chart captions were too generic. Final trend panels must use app data and selected metric context.
- Some final boards included unsupported controls such as accent colors, password change, autolock, and session management. These stay out of the app until the backend supports them.

## Remaining Product Opportunities

- Add clinician-ready PDF export of selected report plus trend notes.
- Add per-person notification reminders for repeat labs.
- Add optional clinician-reviewed reference education content.
- Add chart annotations for medication, sleep, travel, illness, or routine changes.
