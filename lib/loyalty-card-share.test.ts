import { describe, expect, it } from "vitest";
import {
  formatLoyaltyCardWhatsAppMessage,
  loyaltyCardImageFileName,
} from "@/lib/loyalty-card-share";
import { buildWhatsAppSendUrl } from "@/lib/reservation-whatsapp-message";

describe("tarjeta VIP compartida", () => {
  it("incluye el enlace y el nombre, sin sellos en el texto", () => {
    const url = "https://elcactus.mx/tarjeta/abc123";
    const message = formatLoyaltyCardWhatsAppMessage("María", url);
    expect(message).toContain("María");
    expect(message).toContain(url);
    expect(message).toContain("\u{1F335}");
    expect(message).not.toMatch(/sello|visita/i);
  });

  it("arma el enlace de WhatsApp hacia el teléfono del cliente", () => {
    const message = formatLoyaltyCardWhatsAppMessage("María", "https://elcactus.mx/tarjeta/abc");
    const link = buildWhatsAppSendUrl("525551112222", message);
    expect(link).toContain("phone=525551112222");
    expect(link).toContain(encodeURIComponent("https://elcactus.mx/tarjeta/abc"));
  });

  it("nombra el PNG con el folio", () => {
    expect(loyaltyCardImageFileName("C-9001")).toBe("tarjeta-C-9001.png");
  });
});
