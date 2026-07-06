export const APP_NAME = "LabLens";
export const APP_TAGLINE = "Private lab clarity, self-hosted.";
export const SESSION_COOKIE = "lablens_session";
export const DEFAULT_MAX_UPLOAD_MB = 12;
export const HEALTH_DISCLAIMER =
  "LabLens explains lab data for general education only. It does not diagnose, treat, or replace a clinician.";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/manual", label: "Manual" },
  { href: "/reports", label: "Reports" },
  { href: "/people", label: "People" },
  { href: "/settings", label: "Settings" },
] as const;
