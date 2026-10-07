import { describe, expect, it } from "vitest";
import {
  buildWhatsAppSendUrl,
  formatReservationWhatsAppMessage,
} from "@/lib/reservation-whatsapp-message";

const sample = {
  customerName: "Francisco Ortiz",
  phone: "5554590883",
  date: "2026-10-11",
  time: "20:30",
  partySize: 2,
};

describe("formatReservationWhatsAppMessage", () => {
  it("incluye emojis UTF-8 válidos (cactus y etiquetas)", () => {
    const message = formatReservationWhatsAppMessage(sample);
    expect(message).toContain("\u{1F335}");
    expect(message).toContain("\u{1F464}");
    expect(message).toContain("\u{1F4F1}");
    expect(message).not.toContain("\uFFFD");
    expect(message).toContain("Francisco Ortiz");
  });

  it("codifica la URL con bytes UTF-8 del cactus", () => {
    const message = formatReservationWhatsAppMessage(sample);
    const url = buildWhatsAppSendUrl("527731394921", message);
    expect(url).toContain("phone=527731394921");
    expect(url).toContain("%F0%9F%8C%B5");
    expect(url).not.toContain("\u{1F335}");
  });
});
