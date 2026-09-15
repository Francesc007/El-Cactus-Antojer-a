type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  message: string;
  code?: string;
  extra?: Record<string, string | number | boolean | null>;
};

async function sendToSentry(level: LogLevel, payload: LogPayload) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace("/", "");
    const ingest = `${url.protocol}//${url.host}/api/${projectId}/store/`;

    await fetch(ingest, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=el-cactus/1.0`,
      },
      body: JSON.stringify({
        message: payload.message,
        level,
        tags: { code: payload.code ?? "none" },
        extra: payload.extra ?? {},
        timestamp: Date.now() / 1000,
      }),
    });
  } catch {
    // Observability must never break the main flow.
  }
}

export function logEvent(level: LogLevel, payload: LogPayload) {
  const line = `[${level}] ${payload.code ?? "APP"} ${payload.message}`;
  if (level === "error") {
    console.error(line, payload.extra ?? "");
  } else if (level === "warn") {
    console.warn(line, payload.extra ?? "");
  } else {
    console.info(line, payload.extra ?? "");
  }

  void sendToSentry(level, payload);
}
