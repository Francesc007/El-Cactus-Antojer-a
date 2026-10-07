import { z } from "zod";

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Hora inválida");

export const phoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/, "El teléfono debe tener 10 dígitos");

export const newReservationSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  partySize: z.coerce.number().int().min(1).max(50),
  date: isoDateSchema,
  time: timeSchema,
  privacyConsent: z.literal(true),
});

export const reservationStatusSchema = z.enum([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const updateReservationStatusSchema = z.object({
  status: reservationStatusSchema,
});

export const availabilityQuerySchema = z.object({
  date: isoDateSchema,
  partySize: z.coerce.number().int().min(1).max(50),
});

export const newBlockedSlotSchema = z
  .object({
    date: isoDateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    reason: z.string().trim().max(140).optional(),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "La hora de fin debe ser posterior al inicio",
    path: ["endTime"],
  });

export const newProductSchema = z.object({
  name: z.string().trim().min(2).max(80),
  unit: z.enum(["kg", "lt", "pieza", "paquete", "caja"]),
  minStock: z.coerce.number().min(0).max(100000),
});

export const updateProductSchema = newProductSchema.partial();

export const newMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["in", "out"]),
  quantity: z.coerce.number().positive().max(100000),
  date: isoDateSchema,
  note: z.string().trim().max(180).optional(),
});

export const movementFiltersSchema = z.object({
  productId: z.string().uuid().optional(),
  dateFrom: isoDateSchema.optional(),
  dateTo: isoDateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const updateSettingsSchema = z.object({
  totalCapacity: z.coerce.number().int().min(1).max(500),
  defaultDurationMinutes: z.coerce.number().int().min(30).max(360),
});

export const loyaltySettingsSchema = z.object({
  visitsPerReward: z.coerce.number().int().min(1).max(20),
  rewardDescription: z.string().trim().min(2).max(120),
  minHoursBetweenVisits: z.coerce.number().int().min(1).max(72),
  birthdayMessage: z.string().trim().min(10).max(500),
});

export const loyaltyVisitSchema = z.object({
  source: z.enum(["scan", "manual"]),
  force: z.boolean().optional().default(false),
});

export const voidLoyaltyVisitSchema = z.object({
  reason: z.string().trim().min(3, "Escribe el motivo de la anulación.").max(180),
});

export const updateLoyaltyMemberSchema = z.object({
  fullName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(10).max(20).optional(),
  birthDay: z.coerce.number().int().min(1).max(31).optional(),
  birthMonth: z.coerce.number().int().min(1).max(12).optional(),
  birthYear: z.union([z.coerce.number().int().min(1900).max(2100), z.null()]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  marketingConsent: z.boolean().optional(),
});

export const markBirthdaySentSchema = z.object({
  memberId: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(2100),
});
