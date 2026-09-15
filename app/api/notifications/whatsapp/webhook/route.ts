import { NextResponse } from "next/server";
import { logEvent } from "@/lib/observability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? "";

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const payload = body as { object?: string; entry?: unknown[] };
  logEvent("info", {
    message: "Webhook WhatsApp recibido",
    code: "WA_WEBHOOK",
    extra: {
      object: payload.object ?? "unknown",
      entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
    },
  });
  return NextResponse.json({ received: true });
}
