const port = process.env.PORT || "3000";
const url = `http://127.0.0.1:${port}/api/health`;

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) process.exit(1);
  const body = await response.json();
  process.exit(body.status === "ok" || body.status === "degraded" ? 0 : 1);
} catch {
  process.exit(1);
}
