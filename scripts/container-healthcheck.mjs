import os from "node:os";

const port = process.env.PORT || "3000";
const hosts = ["127.0.0.1", "localhost", os.hostname(), "0.0.0.0"];

for (const host of hosts) {
  try {
    const response = await fetch(`http://${host}:${port}/api/health`, { signal: AbortSignal.timeout(3500) });
    if (!response.ok) continue;
    const body = await response.json();
    if (body.status === "ok" || body.status === "degraded") process.exit(0);
  } catch {
    // Try the next local address. Some NAS/container runtimes do not route 127.0.0.1 to the app listener.
  }
}

process.exit(1);
