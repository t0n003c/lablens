# LabLens App Standards

## Safety

- Use "may", "can", "is marked", and "ask your doctor" language.
- Do not write that a user has a disease or needs treatment.
- Always preserve the disclaimer for generated summaries.
- Abnormal flags are based on supplied reference ranges, not diagnosis.

## Privacy

- Keep `.env` out of git.
- Do not log raw PDF text, passwords, 2FA secrets, AI keys, or session tokens.
- Raw PDF storage must remain opt-in.
- Prefer local AI for sensitive deployments.

## Architecture

- Keep Prisma migrations explicit.
- Use route handlers under `src/app/api`.
- Keep parser and summary logic in `src/lib` and unit-testable.
- Keep Docker Compose compatible with NAS deployments.

## Verification

- Parser changes need tests in `tests/lab-parser.test.ts`.
- Summary changes need tests for cautious language.
- Auth and upload changes need lint/build and a manual smoke path when a live database is available.
