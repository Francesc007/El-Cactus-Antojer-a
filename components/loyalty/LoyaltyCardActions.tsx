"use client";

import { useState } from "react";
import {
  formatLoyaltyCardWhatsAppMessage,
  loyaltyCardImageFileName,
} from "@/lib/loyalty-card-share";
import { memberCodeFromScan } from "@/lib/loyalty";
import { buildWhatsAppSendUrl } from "@/lib/reservation-whatsapp-message";

type LoyaltyCardActionsProps = {
  firstName: string;
  folio: string;
  phone: string;
  cardUrl: string;
  qrDataUrl: string | null;
};

const STEPS = {
  iphone: [
    { icon: "⬆️", text: "Toca Compartir (el cuadrado con la flecha hacia arriba)." },
    { icon: "➕", text: "Elige “Agregar a pantalla de inicio”." },
    { icon: "✅", text: "Confirma. El icono abre esta misma página, con tus visitas al día." },
  ],
  android: [
    { icon: "⋮", text: "Abre el menú del navegador (los tres puntos)." },
    { icon: "📲", text: "Elige “Agregar a la pantalla principal” o “Instalar app”." },
    { icon: "✅", text: "Confirma. Desde ese icono siempre ves el avance real." },
  ],
} as const;

export function LoyaltyCardActions({
  firstName,
  folio,
  phone,
  cardUrl,
  qrDataUrl,
}: LoyaltyCardActionsProps) {
  const [device, setDevice] = useState<"iphone" | "android">("iphone");
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function sendToSelf() {
    const message = formatLoyaltyCardWhatsAppMessage(firstName, cardUrl);
    window.open(buildWhatsAppSendUrl(phone, message), "_blank", "noopener,noreferrer");
  }

  async function downloadImage() {
    if (!qrDataUrl) {
      setDownloadError("No se pudo armar el código. Recarga la página e inténtalo de nuevo.");
      return;
    }
    setDownloadError(null);
    try {
      const blob = await renderCardPng({
        firstName,
        folio,
        qrDataUrl,
        photoUrl: photoUrlForCard(cardUrl),
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = loyaltyCardImageFileName(folio);
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError("No se pudo crear la imagen. Intenta de nuevo.");
    }
  }

  const steps = STEPS[device];

  return (
    <div className="mt-6 space-y-4 text-left">
      <button type="button" onClick={sendToSelf} className="btn-primary w-full py-3 text-base">
        Enviármela por WhatsApp
      </button>

      <section className="rounded-2xl border border-cactus-sand bg-gradient-to-br from-white to-cactus-cream/50 p-4">
        <p className="text-sm font-bold text-cactus-charcoal">Tenla siempre en tu celular</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          Agrega esta página a la pantalla de inicio.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDevice("iphone")}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              device === "iphone"
                ? "bg-cactus-forest text-white"
                : "bg-white text-stone-600 ring-1 ring-cactus-sand"
            }`}
          >
            🍎 iPhone
          </button>
          <button
            type="button"
            onClick={() => setDevice("android")}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              device === "android"
                ? "bg-cactus-forest text-white"
                : "bg-white text-stone-600 ring-1 ring-cactus-sand"
            }`}
          >
            🤖 Android
          </button>
        </div>
        <ol className="mt-3 space-y-2">
          {steps.map((step) => (
            <li key={step.text} className="flex gap-3 rounded-xl bg-white/80 p-3 ring-1 ring-stone-100">
              <span className="text-xl" aria-hidden>
                {step.icon}
              </span>
              <span className="text-sm leading-relaxed text-stone-700">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <button
        type="button"
        onClick={() => void downloadImage()}
        disabled={!qrDataUrl}
        className="w-full rounded-xl border border-cactus-forest px-4 py-3 text-base font-bold text-cactus-forest disabled:opacity-50"
      >
        Descargar imagen
      </button>
      {downloadError && <p className="text-sm text-red-700">{downloadError}</p>}
    </div>
  );
}

function photoUrlForCard(cardUrl: string): string | null {
  const code = memberCodeFromScan(cardUrl);
  if (!code) {
    return null;
  }
  return `/api/loyalty/card-photo/${code}`;
}

async function renderCardPng(input: {
  firstName: string;
  folio: string;
  qrDataUrl: string;
  photoUrl: string | null;
}): Promise<Blob> {
  const width = 720;
  const height = 1180;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas");
  }

  ctx.fillStyle = "#FDF8F0";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#4BA747";
  ctx.fillRect(0, 0, width, 18);

  const logo = await loadImage("/logo.png");
  const logoSize = 132;
  ctx.drawImage(logo, (width - logoSize) / 2, 48, logoSize, logoSize);

  ctx.textAlign = "center";
  ctx.fillStyle = "#4BA747";
  ctx.font = "700 22px Georgia, serif";
  ctx.fillText("TARJETA VIP", width / 2, 214);

  const photo = input.photoUrl ? await loadImage(input.photoUrl).catch(() => null) : null;
  drawPortrait(ctx, photo, input.firstName, width / 2, 360, 108);

  ctx.fillStyle = "#1A2318";
  ctx.font = "700 52px Georgia, serif";
  ctx.fillText(fitText(ctx, input.firstName, 620), width / 2, 520);
  ctx.fillStyle = "#4BA747";
  ctx.font = "700 26px ui-monospace, monospace";
  ctx.fillText(`Folio ${input.folio}`, width / 2, 566);

  const qr = await loadImage(input.qrDataUrl);
  const frame = 460;
  const frameX = (width - frame) / 2;
  const frameY = 610;
  ctx.fillStyle = "#4BA747";
  roundRect(ctx, frameX, frameY, frame, frame, 28);
  ctx.fill();
  const pad = 18;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, frameX + pad, frameY + pad, frame - pad * 2, frame - pad * 2, 18);
  ctx.fill();
  const qrPad = 34;
  ctx.drawImage(qr, frameX + qrPad, frameY + qrPad, frame - qrPad * 2, frame - qrPad * 2);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/png");
  });
  if (!blob) {
    throw new Error("png");
  }
  return blob;
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement | null,
  name: string,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (photo) {
    const scale = Math.max((radius * 2) / photo.width, (radius * 2) / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    ctx.fillStyle = "#E7F5DF";
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#1A3D18";
    ctx.font = "700 72px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initial = name.trim().slice(0, 1).toUpperCase() || "?";
    ctx.fillText(initial, cx, cy);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#4BA747";
  ctx.lineWidth = 8;
  ctx.stroke();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}…`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("qr"));
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
