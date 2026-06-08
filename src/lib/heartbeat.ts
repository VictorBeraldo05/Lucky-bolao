import cron from "node-cron";

declare global {
  var __luckyHeartbeatStarted__: boolean | undefined;
}

function resolveHeartbeatUrl() {
  const baseUrl =
    process.env.APP_PUBLIC_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    process.env.URL;

  if (!baseUrl) return null;

  return `${baseUrl.replace(/\/+$/, "")}/health`;
}

export function startHeartbeat() {
  if (globalThis.__luckyHeartbeatStarted__) {
    return;
  }

  const heartbeatUrl = resolveHeartbeatUrl();
  const enabled =
    process.env.HEARTBEAT_ENABLED === "true" ||
    (process.env.NODE_ENV === "production" && process.env.HEARTBEAT_ENABLED !== "false");

  if (!enabled) {
    console.info("[heartbeat] disabled for this environment");
    return;
  }

  if (!heartbeatUrl) {
    console.warn("[heartbeat] skipped: no public app URL found in APP_PUBLIC_URL, NEXT_PUBLIC_APP_URL, RENDER_EXTERNAL_URL, or URL");
    return;
  }

  globalThis.__luckyHeartbeatStarted__ = true;

  const task = cron.schedule("*/10 * * * *", async () => {
    try {
      const response = await fetch(heartbeatUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "lucky-boloes-heartbeat/1.0",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(`[heartbeat] ping failed with status ${response.status} ${response.statusText}`);
        return;
      }

      const payload = (await response.json()) as { status?: string; timestamp?: string };
      console.info(`[heartbeat] ping success -> ${heartbeatUrl} | status=${payload.status ?? "unknown"} | at=${payload.timestamp ?? "unknown"}`);
    } catch (error) {
      console.error("[heartbeat] ping error", error);
    }
  });

  task.start();
  console.info(`[heartbeat] scheduled every 10 minutes -> ${heartbeatUrl}`);
}
