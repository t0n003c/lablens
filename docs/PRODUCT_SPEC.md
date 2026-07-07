# Product Spec

Release: `1.1.0`

## Product Concept

LabLens helps a self-hosting user upload or manually enter lab results, review extracted values, understand range-based flags, and generate cautious wellness-oriented summaries.

## Core Features

- Account creation, login, sessions, 2FA setup, biometric login, and recovery-ready schema.
- MyQuest PDF upload with extraction of test name, value, unit, and reference range.
- Manual report entry when parsing fails or the user has non-PDF results.
- Multiple people under one login, so a household account can keep each person's reports, trends, and next steps separated.
- Draft review of extracted results with editable rows, skipped rows, and report finalization.
- Health summary grouped by cholesterol, glucose, kidney, liver, blood count, vitamins, thyroid, inflammation, electrolytes, and other.
- Marker-specific food, movement, routine, sleep, and clinician-visit recommendations.
- Optional person-specific profile context in People so recommendations can fit age, gender, country/region, cultural background or ethnicity, work, hobbies, and daily routine without changing medical thresholds.
- Short `My next steps` actions generated from report-based recommendations.
- Prioritized `My next steps` cards with why-this-step notes, frequency, effort, marker tags, and replacement actions.
- Dashboard health score, cards, trend charts, recent results, flags, and shortcuts.
- Premium 1.1 UI refresh with documented light/OLED palettes, System/Light/OLED Dark appearance control, responsive layouts, clickable prototype, generated illustration asset, and shadcn-style Tailwind primitives.
- Mood-board visual identity applied to real product surfaces through glass/lens report imagery, private-by-design cards, and stronger health-score hierarchy.
- Report history with search, person filters, and future compare/export workflows.
- People tab for report profiles; Settings for security, 2FA, Turnstile, AI provider, data export/deletion, and theme.
- Active navigation state on desktop and mobile.
- Phone-installable PWA shell with home-screen icons and a mobile install prompt.

## User Flows

### Upload Flow

1. User logs in.
2. User chooses the person the report belongs to or adds a new person.
3. User uploads a MyQuest PDF.
4. App validates file type, size, and extension.
5. App extracts text and lab rows.
6. App saves a draft report with warnings and parsed values for that person.
7. User reviews extracted rows and can change the assigned person if needed.
8. User saves review changes or finalizes the report.

### People Flow

1. User opens People.
2. User adds each person who may have reports in the account.
3. User can set one default person for new uploads and manual entries.
4. User can add optional profile context per person.
5. Dashboard and Reports can filter to one person so latest values, trends, and next steps do not mix household data.

### Action Plan Flow

1. Dashboard turns report-based recommendations into short grouped next steps.
2. Dashboard highlights the top three steps in `Start here`.
3. Each step shows why it was chosen, how often to try it, expected effort, and linked marker tags.
4. User can mark steps done, replace a step with an easier option, or delete steps they do not want to see.
5. User can use Reset to restore deleted steps from the current report.
6. Dashboard keeps steps grouped by Sleep, Routine, Food, and Movement.

### Manual Entry Flow

1. User opens Manual.
2. User chooses the person the result belongs to or adds a new person.
3. User enters report date, lab, test, value, unit, range, and notes.
4. App categorizes and flags the value.
5. App saves the report and generates the same style summary as PDF reports.

### Summary Flow

1. App groups results by category.
2. App flags values from reference ranges.
3. AI provider receives structured lab JSON and strict safety instructions.
4. If AI fails, local summary generation returns a safe fallback.

### Security Flow

1. User creates a strong-password account.
2. User can enable TOTP.
3. User can enable biometric login from Settings on a supported secure browser.
4. If biometric login is on, the login screen accepts email/password first, then asks for Face ID, fingerprint, device PIN, or the platform biometric prompt before creating a session.
5. Login, upload, settings, delete, and export events are audit logged.
6. Server-configured protections such as Turnstile are shown as status, not as inactive buttons.

### Phone Install Flow

1. User opens LabLens on a phone browser.
2. App registers its service worker and checks whether it is already installed.
3. If not installed or recently dismissed, the app shows an install prompt.
4. Android Chrome can open the native install flow. iPhone Safari shows Add to Home Screen steps.

## Things Considered

- Raw PDFs may contain more sensitive data than parsed rows, so storage is off by default.
- The PWA service worker should not cache lab pages or API responses; health data should stay server-backed.
- Local AI should be preferred for highly sensitive reports.
- Docker backups must include both database volume and upload volume if raw PDF storage is enabled.
- HIPAA-like operation requires host-level policies, not just application code.
- Future product updates should be tested locally and held until explicit approval to push or publish.
