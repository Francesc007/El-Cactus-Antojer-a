import { describe, expect, it } from "vitest";
import { newReservationSchema } from "@/lib/validation/schemas";

describe("reservation validation", () => {
  it("exige consentimiento y teléfono de 10 dígitos", () => {
    const result = newReservationSchema.safeParse({
      customerName: "Ana",
      phone: "5512345678",
      partySize: 2,
      date: "2026-09-18",
      time: "16:00",
      privacyConsent: true,
    });
    expect(result.success).toBe(true);
    expect(
      newReservationSchema.safeParse({
        customerName: "Ana",
        phone: "123",
        partySize: 2,
        date: "2026-09-18",
        time: "16:00",
        privacyConsent: true,
      }).success
    ).toBe(false);
  });
});
