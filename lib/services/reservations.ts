import {
  getAllSlotsForDate,
  isSlotAvailable,
} from "@/lib/availability";
import { AppError } from "@/lib/errors";
import { mapBlockedSlot, mapOperatingHour, mapReservation, mapSettings } from "@/lib/mappers";
import { logEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type {
  AvailabilitySlot,
  BlockedSlot,
  CapacityConfig,
  NewBlockedSlotInput,
  NewReservationInput,
  OperatingHour,
  Reservation,
  ReservationStatus,
} from "@/lib/types";

type ReservationRow = {
  id: string;
  customer_name: string;
  phone: string;
  party_size: number;
  date: string;
  time: string;
  duration_minutes: number;
  status: ReservationStatus;
  privacy_consent: boolean;
  created_at: string;
  updated_at: string;
};

async function loadSettings(admin = createAdminSupabaseClient()) {
  const { data, error } = await admin
    .from("business_settings")
    .select("total_capacity, default_duration_minutes")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    logEvent("error", {
      message: error?.message ?? "Sin fila de configuración",
      code: "SETTINGS_MISSING",
      extra: {
        details: error?.details ?? error?.code ?? "NO_ROW",
        hint: error?.hint ?? "",
      },
    });
    throw new AppError("No hay configuración de capacidad.", "SETTINGS_MISSING", 500);
  }

  return mapSettings(data);
}

async function loadHours(admin = createAdminSupabaseClient()): Promise<OperatingHour[]> {
  const { data, error } = await admin
    .from("operating_hours")
    .select("day_of_week, open_time, close_time, label, is_closed")
    .order("day_of_week");

  if (error) {
    throw new AppError("No se pudieron leer los horarios.", "HOURS_READ", 500);
  }

  return (data ?? []).map(mapOperatingHour);
}

export async function getBusinessConfig(): Promise<{
  capacity: CapacityConfig;
  hours: OperatingHour[];
}> {
  const admin = createAdminSupabaseClient();
  const [capacity, hours] = await Promise.all([loadSettings(admin), loadHours(admin)]);
  return { capacity, hours };
}

export async function updateBusinessSettings(input: {
  totalCapacity: number;
  defaultDurationMinutes: number;
}): Promise<CapacityConfig> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("business_settings")
    .update({
      total_capacity: input.totalCapacity,
      default_duration_minutes: input.defaultDurationMinutes,
    })
    .eq("id", 1)
    .select("total_capacity, default_duration_minutes")
    .single();

  if (error || !data) {
    throw new AppError("No se pudo actualizar la configuración.", "SETTINGS_UPDATE", 500);
  }

  return mapSettings(data);
}

export async function listReservationsByDate(date: string): Promise<Reservation[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("reservations")
    .select(
      "id, customer_name, phone, party_size, date, time, duration_minutes, status, privacy_consent, created_at, updated_at"
    )
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) {
    throw new AppError("No se pudieron leer las reservas.", "RESERVATIONS_READ", 500);
  }

  return ((data ?? []) as ReservationRow[]).map(mapReservation);
}

export async function listBlockedSlots(date: string): Promise<BlockedSlot[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("blocked_slots")
    .select("id, date, start_time, end_time, reason, created_at")
    .eq("date", date)
    .order("start_time");

  if (error) {
    throw new AppError("No se pudieron leer los bloqueos.", "BLOCKS_READ", 500);
  }

  return (data ?? []).map(mapBlockedSlot);
}

export async function getAvailability(
  date: string,
  partySize: number
): Promise<{
  closed: boolean;
  slots: AvailabilitySlot[];
  capacity: CapacityConfig;
}> {
  const [{ capacity, hours }, reservations, blockedSlots] = await Promise.all([
    getBusinessConfig(),
    listReservationsByDate(date),
    listBlockedSlots(date),
  ]);

  const slots = getAllSlotsForDate(date, hours).map((time) => ({
    time,
    available: isSlotAvailable(
      reservations,
      capacity,
      date,
      time,
      partySize,
      blockedSlots,
      hours
    ),
  }));

  return {
    closed: slots.length === 0,
    slots,
    capacity,
  };
}

export async function createReservation(
  input: NewReservationInput
): Promise<Reservation> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("create_reservation_safe", {
    p_customer_name: input.customerName,
    p_phone: input.phone,
    p_party_size: input.partySize,
    p_date: input.date,
    p_time: `${input.time}:00`,
    p_privacy_consent: input.privacyConsent,
  });

  if (error) {
    logEvent("warn", {
      message: "Fallo al crear reserva",
      code: "RESERVATION_CREATE",
      extra: { details: error.message },
    });
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new AppError("No se pudo crear la reserva.", "RESERVATION_CREATE", 500);
  }
  return mapReservation(row as ReservationRow);
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  changedBy: string | null
): Promise<Reservation> {
  const admin = createAdminSupabaseClient();
  const { data: current, error: readError } = await admin
    .from("reservations")
    .select(
      "id, customer_name, phone, party_size, date, time, duration_minutes, status, privacy_consent, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (readError || !current) {
    throw new AppError("La reserva no existe.", "NOT_FOUND", 404);
  }

  const { data, error } = await admin
    .from("reservations")
    .update({ status })
    .eq("id", id)
    .select(
      "id, customer_name, phone, party_size, date, time, duration_minutes, status, privacy_consent, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    throw new AppError("No se pudo actualizar la reserva.", "RESERVATION_UPDATE", 500);
  }

  await admin.from("reservation_status_history").insert({
    reservation_id: id,
    from_status: current.status,
    to_status: status,
    changed_by: changedBy,
  });

  return mapReservation(data as ReservationRow);
}

export async function createBlockedSlot(
  input: NewBlockedSlotInput,
  createdBy: string | null
): Promise<BlockedSlot> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("blocked_slots")
    .insert({
      date: input.date,
      start_time: `${input.startTime}:00`,
      end_time: `${input.endTime}:00`,
      reason: input.reason ?? null,
      created_by: createdBy,
    })
    .select("id, date, start_time, end_time, reason, created_at")
    .single();

  if (error || !data) {
    throw new AppError("No se pudo bloquear el horario.", "BLOCK_CREATE", 500);
  }

  return mapBlockedSlot(data);
}

export async function deleteBlockedSlot(id: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("blocked_slots").delete().eq("id", id);
  if (error) {
    throw new AppError("No se pudo eliminar el bloqueo.", "BLOCK_DELETE", 500);
  }
}
