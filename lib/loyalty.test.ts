import { describe, expect, it } from "vitest";
import {
  birthdayCronSendsMessages,
  birthdayMatchesDate,
  birthdayOnDates,
  currentCardVisits,
  detectLoyaltyImage,
  displayedCardVisits,
  formatWeeklyNames,
  isRewardAvailable,
  isVisitTooSoon,
  isoWeekKey,
  memberCodeFromScan,
  normalizeLoyaltyPhone,
  upcomingDates,
  weekDatesMondayToSunday,
  zonedDate,
} from "@/lib/loyalty";

describe("teléfono de tarjeta VIP", () => {
  it("guarda 52 más 10 dígitos y acepta espacios, guiones y el prefijo", () => {
    expect(normalizeLoyaltyPhone("5512345678")).toBe("525512345678");
    expect(normalizeLoyaltyPhone("55 1234 5678")).toBe("525512345678");
    expect(normalizeLoyaltyPhone("55-1234-5678")).toBe("525512345678");
    expect(normalizeLoyaltyPhone("525512345678")).toBe("525512345678");
    expect(normalizeLoyaltyPhone("52 55 1234 5678")).toBe("525512345678");
    expect(normalizeLoyaltyPhone("52-5512345678")).toBe("525512345678");
  });

  it("rechaza cualquier otra forma", () => {
    expect(normalizeLoyaltyPhone("+52 55 1234 5678")).toBeNull();
    expect(normalizeLoyaltyPhone("(55) 1234-5678")).toBeNull();
    expect(normalizeLoyaltyPhone("551234567")).toBeNull();
    expect(normalizeLoyaltyPhone("15512345678")).toBeNull();
    expect(normalizeLoyaltyPhone("5255123456789")).toBeNull();
    expect(normalizeLoyaltyPhone("")).toBeNull();
  });
});

describe("cumpleaños en hora centro", () => {
  it("usa el día en America/Mexico_City y no el día UTC", () => {
    const stillPrevious = zonedDate(
      new Date("2026-03-01T05:30:00.000Z"),
      "America/Mexico_City"
    );
    expect(stillPrevious).toMatchObject({ year: 2026, month: 2, day: 28 });

    const nextMorning = zonedDate(
      new Date("2026-03-01T06:30:00.000Z"),
      "America/Mexico_City"
    );
    expect(nextMorning).toMatchObject({ year: 2026, month: 3, day: 1 });
    expect(
      birthdayMatchesDate(2, 29, nextMorning.year, nextMorning.month, nextMorning.day)
    ).toBe(false);
  });

  it("felicita el 29 de febrero el día 28 cuando el año no es bisiesto", () => {
    expect(birthdayMatchesDate(2, 29, 2026, 2, 28)).toBe(true);
    expect(birthdayMatchesDate(2, 29, 2026, 2, 29)).toBe(false);
    expect(birthdayMatchesDate(2, 29, 2028, 2, 29)).toBe(true);
    expect(birthdayMatchesDate(2, 29, 2028, 2, 28)).toBe(false);
  });

  it("arma la semana de lunes a domingo y los próximos 7 días", () => {
    const tuesday = zonedDate(new Date("2026-10-06T18:00:00.000Z"), "America/Mexico_City");
    expect(tuesday).toMatchObject({ year: 2026, month: 10, day: 6, weekday: 2 });

    const week = weekDatesMondayToSunday(tuesday);
    expect(week[0]).toEqual({ year: 2026, month: 10, day: 5 });
    expect(week[6]).toEqual({ year: 2026, month: 10, day: 11 });
    expect(birthdayOnDates(10, 11, week)?.day).toBe(11);
    expect(birthdayOnDates(10, 12, week)).toBeNull();

    const next = upcomingDates(tuesday, 7);
    expect(next).toHaveLength(7);
    expect(next[0]).toEqual({ year: 2026, month: 10, day: 6 });
    expect(next[6]).toEqual({ year: 2026, month: 10, day: 12 });
    expect(isoWeekKey(tuesday)).toBe("2026-41");
  });
});

describe("visitas de la tarjeta actual", () => {
  it("resta lo ya canjeado y no usa el histórico", () => {
    expect(currentCardVisits(8, 5)).toBe(3);
    expect(displayedCardVisits(4, 5)).toBe(0);
    expect(currentCardVisits(4, 5)).toBe(-1);
  });

  it("hay premio cuando el avance llega al umbral vigente", () => {
    expect(isRewardAvailable(5, 5)).toBe(true);
    expect(isRewardAvailable(4, 5)).toBe(false);
    expect(isRewardAvailable(currentCardVisits(9, 5), 5)).toBe(false);
    expect(isRewardAvailable(currentCardVisits(10, 5), 5)).toBe(true);
  });
});

describe("horas mínimas entre visitas", () => {
  const now = new Date("2026-10-06T18:00:00.000Z");

  it("bloquea solo cuando la última visita válida es más reciente que el mínimo", () => {
    const fiveHoursAgo = new Date(now.getTime() - 5 * 3_600_000).toISOString();
    const sixHoursAgo = new Date(now.getTime() - 6 * 3_600_000).toISOString();
    expect(isVisitTooSoon(fiveHoursAgo, 6, now)).toBe(true);
    expect(isVisitTooSoon(sixHoursAgo, 6, now)).toBe(false);
    expect(isVisitTooSoon(null, 6, now)).toBe(false);
  });
});

describe("código del QR", () => {
  const code = "ab".repeat(16);

  it("acepta la URL de la tarjeta y rechaza el folio", () => {
    expect(memberCodeFromScan(`https://elcactus.mx/tarjeta/${code}`)).toBe(code);
    expect(memberCodeFromScan(`https://elcactus.mx/tarjeta/${code}?nueva=1`)).toBe(code);
    expect(memberCodeFromScan("C-0001")).toBeNull();
    expect(memberCodeFromScan("https://elcactus.mx/")).toBeNull();
  });
});

describe("foto y aviso semanal", () => {
  it("reconoce JPEG, PNG y WebP y rechaza otro tipo o un archivo vacío", () => {
    expect(detectLoyaltyImage(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))?.extension).toBe("jpg");
    expect(
      detectLoyaltyImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        ?.extension
    ).toBe("png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(detectLoyaltyImage(webp)?.extension).toBe("webp");
    expect(detectLoyaltyImage(Uint8Array.from([0x47, 0x49, 0x46]))).toBeNull();
    expect(detectLoyaltyImage(new Uint8Array())).toBeNull();
  });

  it("recorta la lista de nombres para no rebasar la plantilla", () => {
    expect(formatWeeklyNames(["Ana", "Luis"])).toBe("Ana, Luis");
    expect(formatWeeklyNames(["a", "b", "c", "d", "e", "f", "g", "h", "i"], 8)).toBe(
      "a, b, c, d, e, f, g, h y 1 más"
    );
  });

  it("con wa.me el cron no envía", () => {
    expect(birthdayCronSendsMessages("wa_me")).toBe(false);
    expect(birthdayCronSendsMessages("whatsapp_cloud")).toBe(true);
  });
});
