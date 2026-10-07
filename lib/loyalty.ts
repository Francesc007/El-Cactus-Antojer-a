export const PRIVACY_NOTICE_VERSION = "2026-10-06";

export const LOYALTY_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const LOYALTY_PHOTO_SIGNED_SECONDS = 15 * 60;
export const LOYALTY_PHOTO_BUCKET = "loyalty-photos";
export const LOYALTY_SIGNUP_RATE_MAX = 6;
export const LOYALTY_SIGNUP_RATE_WINDOW_MINUTES = 15;
export const BIRTHDAY_ATTEMPT_LIMIT = 3;
export const WEEKLY_NAME_LIMIT = 8;
export const LOYALTY_HONEYPOT_FIELD = "fax_number";

export const PRIVACY_NOTICE_TEXT =
  "El Cactus pide nombre, teléfono, día y mes de nacimiento, año si lo das, y una fotografía, para crear tu tarjeta VIP, contar tus visitas, entregar el premio y enviarte por WhatsApp la felicitación de cumpleaños y promociones. Sin aceptar esos mensajes no se genera la tarjeta. Puedes pedir en el negocio que dejemos de escribirte, corregir tus datos o eliminar tu tarjeta y tu foto. No vendemos estos datos. Tu tarjeta muestra tu foto, tu primer nombre y tu folio; no muestra tu teléfono ni tu fecha de nacimiento.";

export const BIRTHDAY_TEMPLATE_TEXT =
  "Hola {{1}}, ¡feliz cumpleaños! 🎉 En El Cactus queremos celebrarlo contigo. Ven y disfruta con nosotros. ¡Te esperamos!";

export const BIRTHDAY_WEEKLY_TEMPLATE_TEXT =
  "Esta semana hay {{1}} cumpleaños en El Cactus: {{2}}.";

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type ZonedDate = CalendarDate & {
  weekday: number;
};

export type LoyaltyImageKind = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

export function normalizeLoyaltyPhone(input: string): string | null {
  if (!/^[\d\s-]+$/.test(input.trim())) {
    return null;
  }

  const digits = input.replace(/[\s-]/g, "");
  if (/^\d{10}$/.test(digits)) {
    return `52${digits}`;
  }
  if (/^52\d{10}$/.test(digits)) {
    return digits;
  }
  return null;
}

export function normalizeFullName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    return null;
  }
  if (/[\u0000-\u001F]/.test(name)) {
    return null;
  }
  return name;
}

export function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) {
    return trimmed;
  }
  return trimmed.slice(0, space);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidBirthDate(
  month: number,
  day: number,
  year: number | null
): boolean {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }
  if (!Number.isInteger(day) || day < 1) {
    return false;
  }
  const maxDay = DAYS_IN_MONTH[month];
  if (maxDay === undefined || day > maxDay) {
    return false;
  }
  if (year === null) {
    return true;
  }
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return false;
  }
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return false;
  }
  return true;
}

export function observedBirthday(
  birthMonth: number,
  birthDay: number,
  year: number
): CalendarDate {
  if (birthMonth === 2 && birthDay === 29 && !isLeapYear(year)) {
    return { year, month: 2, day: 28 };
  }
  return { year, month: birthMonth, day: birthDay };
}

export function birthdayMatchesDate(
  birthMonth: number,
  birthDay: number,
  year: number,
  month: number,
  day: number
): boolean {
  const observed = observedBirthday(birthMonth, birthDay, year);
  return observed.month === month && observed.day === day;
}

export function zonedDate(now: Date, timeZone: string): ZonedDate {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error("TIMEZONE_INVALID");
  }
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function mondayOfWeek(date: CalendarDate): CalendarDate {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  const delta = weekday === 0 ? 6 : weekday - 1;
  return addCalendarDays(date, -delta);
}

export function weekDatesMondayToSunday(date: CalendarDate): CalendarDate[] {
  const start = mondayOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(start, index));
}

export function upcomingDates(date: CalendarDate, count: number): CalendarDate[] {
  return Array.from({ length: count }, (_, index) => addCalendarDays(date, index));
}

export function birthdayOnDates(
  birthMonth: number,
  birthDay: number,
  dates: CalendarDate[]
): CalendarDate | null {
  for (const date of dates) {
    if (birthdayMatchesDate(birthMonth, birthDay, date.year, date.month, date.day)) {
      return date;
    }
  }
  return null;
}

export function isoWeekKey(date: CalendarDate): string {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const day = utc.getUTCDay() || 7;
  const thursday = new Date(utc);
  thursday.setUTCDate(utc.getUTCDate() + 4 - day);
  const weekYear = thursday.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${weekYear}-${String(week).padStart(2, "0")}`;
}

export function birthdayMessageKey(memberId: string, year: number): string {
  return `birthday:${memberId}:${year}`;
}

export function birthdayWeekKey(date: CalendarDate): string {
  return `birthday-week:${isoWeekKey(date)}`;
}

export function formatSpanishDay(date: CalendarDate): string {
  const month = MONTH_NAMES[date.month - 1] ?? "";
  return `${date.day} de ${month}`;
}

export function currentCardVisits(validVisits: number, visitsConsumed: number): number {
  return validVisits - visitsConsumed;
}

export function displayedCardVisits(validVisits: number, visitsConsumed: number): number {
  return Math.max(0, currentCardVisits(validVisits, visitsConsumed));
}

export function isRewardAvailable(currentVisits: number, visitsPerReward: number): boolean {
  return currentVisits >= visitsPerReward;
}

export function visitsUntilReward(currentVisits: number, visitsPerReward: number): number {
  return Math.max(0, visitsPerReward - currentVisits);
}

export function isVisitTooSoon(
  lastVisitAt: string | null,
  minHours: number,
  now: Date
): boolean {
  if (!lastVisitAt) {
    return false;
  }
  const last = new Date(lastVisitAt).getTime();
  if (Number.isNaN(last)) {
    return false;
  }
  const elapsedHours = (now.getTime() - last) / 3_600_000;
  return elapsedHours < minHours;
}

export function isDemoLoyaltyMember(folio: string, fullName: string): boolean {
  return fullName.startsWith("Demo ·") || /^C-900\d$/.test(folio);
}

export function composeBirthdayMessage(template: string, fullName: string): string {
  const name = firstName(fullName);
  if (template.includes("{{1}}")) {
    return template.replaceAll("{{1}}", name);
  }
  return `Hola ${name}, ${template.trim()}`;
}

export function formatWeeklyNames(firstNames: string[], limit = WEEKLY_NAME_LIMIT): string {
  const clean = firstNames
    .map((name) => name.replace(/[\r\n\t]+/g, " ").trim())
    .filter((name) => name.length > 0);
  if (clean.length <= limit) {
    return clean.join(", ");
  }
  const rest = clean.length - limit;
  return `${clean.slice(0, limit).join(", ")} y ${rest} más`;
}

export function birthdayWaMeUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function loyaltyCardUrl(appUrl: string, memberCode: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/tarjeta/${memberCode}`;
}

export function memberCodeFromScan(text: string): string | null {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter((part) => part.length > 0);
    if (parts.length === 2 && parts[0] === "tarjeta") {
      return normalizeMemberCode(parts[1] ?? "");
    }
    return null;
  } catch {
    return normalizeMemberCode(trimmed);
  }
}

export function normalizeMemberCode(value: string): string | null {
  const code = value.trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(code)) {
    return null;
  }
  return code;
}

export function detectLoyaltyImage(bytes: Uint8Array): LoyaltyImageKind | null {
  if (bytes.byteLength === 0 || bytes.byteLength > LOYALTY_PHOTO_MAX_BYTES) {
    return null;
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

export function loyaltyPhotoPath(id: string, extension: LoyaltyImageKind["extension"]): string {
  return `${id}.${extension}`;
}

export function scrubSensitiveText(value: string): string {
  return value.replace(/\d{10,}/g, "[numero]").slice(0, 300);
}

export function birthdayCronSendsMessages(provider: "wa_me" | "whatsapp_cloud"): boolean {
  return provider === "whatsapp_cloud";
}

export function templateParameter(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 900);
}

export function formatBusinessDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
