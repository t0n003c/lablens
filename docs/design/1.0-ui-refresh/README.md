# LabLens 1.0 UI Refresh

This folder records the UI refresh direction that shipped with LabLens `1.1.0`.

## Generated Boards

- `01-moodboard.png` - premium healthcare mood board, illustration style, trust cues.
- `02-desktop-hifi.png` - low-fidelity desktop journey map; used as wireframe input.
- `03-responsive-hifi.png` - token and responsive exploration for light/OLED modes.
- `04-auth-upload-flow.png` - auth, upload, review, and mobile flow exploration.
- `05-design-system.png` - high-fidelity desktop product surfaces in light/dark mode.
- `06-wireframe-prototype.png` - end-to-end clickable journey reference.
- `07-final-desktop-flows.png` - final desktop light/OLED flow board for Dashboard, Upload, Reports, People, and Settings.
- `08-final-responsive-flows.png` - final phone/tablet responsive flow board for auth, upload, dashboard, trends, people, and appearance.
- `09-final-prototype-motion.png` - final clickable journey and motion-state storyboard.

## Final Product Direction

LabLens should feel private, calm, and intelligent: closer to Apple Health, Oura, and Notion than to a hospital portal. The first screen should answer, in order:

1. How am I doing overall?
2. What should I do next?
3. What needs a careful human review?
4. What changed over time?
5. What exact values were saved?

The UI must never imply diagnosis. It can explain range-based flags, trend direction, and practical behaviors to discuss with a clinician.

## Alignment Plan

The app is now partially through the deeper mood-board alignment pass. See `MOODBOARD_ALIGNMENT_PLAN.md` for the detailed gap analysis, architecture plan, implementation progress, remaining phases, and acceptance criteria.

Implemented locally so far:

- material tokens and reusable glass/instrument primitives
- expanded generated asset set for trust, trends, and upload review
- composed dashboard health-score hero
- compact dashboard shortcut rail
- dark trend instrument with selected-line insight
- material-system styling for sidebar, auth, upload, next steps, needs review, and latest lab values

## Senior Critique Decisions

The final boards are visual direction, not a contract for unsupported features. During critique, these generated ideas were intentionally rejected or deferred:

- Accent-color customization is not shipped; LabLens uses a controlled healthcare palette for trust and chart consistency.
- Social login is not shown in the app because the backend does not support it.
- Password change, device naming, auto-lock, and session management are deferred until backend support exists.
- Turnstile is shown as server-configured status, not as a dead Settings button.
- Any diagnosis or treatment phrasing in generated mock text is ignored; the app keeps cautious range-review language.

## Local Prototype

Open `prototype.html` in a browser to click through the planned journey. The production app is still the source of truth for real data and behavior.
