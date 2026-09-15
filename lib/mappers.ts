import type {
  BlockedSlot,
  CapacityConfig,
  OperatingHour,
  ProductWithStock,
  Reservation,
  ReservationStatus,
  StaffProfile,
  StockMovement,
  UserRole,
} from "@/lib/types";

function asDate(value: string): string {
  return value.slice(0, 10);
}

function asTime(value: string): string {
  return value.slice(0, 5);
}

export function mapReservation(row: {
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
}): Reservation {
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    partySize: row.party_size,
    date: asDate(row.date),
    time: asTime(row.time),
    durationMinutes: row.duration_minutes,
    status: row.status,
    privacyConsent: row.privacy_consent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBlockedSlot(row: {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}): BlockedSlot {
  return {
    id: row.id,
    date: asDate(row.date),
    startTime: asTime(row.start_time),
    endTime: asTime(row.end_time),
    reason: row.reason ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapSettings(row: {
  total_capacity: number;
  default_duration_minutes: number;
}): CapacityConfig {
  return {
    totalCapacity: row.total_capacity,
    defaultDurationMinutes: row.default_duration_minutes,
  };
}

export function mapOperatingHour(row: {
  day_of_week: number;
  open_time: string;
  close_time: string;
  label: string;
  is_closed: boolean;
}): OperatingHour {
  return {
    dayOfWeek: row.day_of_week,
    openTime: asTime(row.open_time),
    closeTime: asTime(row.close_time),
    label: row.label,
    isClosed: row.is_closed,
  };
}

export function mapProduct(row: {
  id: string;
  name: string;
  unit: string;
  min_stock: number | string;
  stock?: number | string;
}): ProductWithStock {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    minStock: Number(row.min_stock),
    stock: Number(row.stock ?? 0),
  };
}

export function mapMovement(row: {
  id: string;
  product_id: string;
  type: "in" | "out";
  quantity: number | string;
  date: string;
  note: string | null;
  created_at: string;
  created_by: string | null;
}): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type,
    quantity: Number(row.quantity),
    date: asDate(row.date),
    note: row.note ?? undefined,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function mapProfile(row: {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
}): StaffProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
  };
}
