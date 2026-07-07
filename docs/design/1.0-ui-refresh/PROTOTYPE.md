# Clickable Prototype Notes

The clickable prototype is `prototype.html`.

## Journey

1. Login or create account.
2. Upload a PDF.
3. Watch processing state.
4. Review extracted rows and parser warnings.
5. Finalize the report.
6. Land on Dashboard with snapshot score, next steps, review flags, trends, and latest values.
7. Open Reports, People, and Settings for saved data management.
8. Change Appearance between System, Light, and OLED Dark.

## Responsive Behavior

- Desktop: sidebar stays fixed, dashboard uses two-column chart/insight and four stat cards.
- Tablet: content stays in one app shell but cards wrap to two columns.
- Mobile: top app bar plus bottom nav; dense tables scroll horizontally; next steps stack by group.

## Prototype Caveat

The prototype is for design review only. Real authentication, PDF parsing, trend math, data export, deletion, and biometric setup remain in the Next.js app.

Generated storyboard `09-final-prototype-motion.png` is the final visual journey map. The HTML prototype remains intentionally lightweight so it can be opened locally without a build step.
