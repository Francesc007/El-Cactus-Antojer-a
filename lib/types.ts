export type UserRole = "owner" | "staff";

export type StaffProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
};

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Reservation = {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  durationMinutes: number;
  status: ReservationStatus;
  privacyConsent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CapacityConfig = {
  totalCapacity: number;
  defaultDurationMinutes: number;
};

export type OperatingHour = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  label: string;
  isClosed: boolean;
};

export type NewReservationInput = {
  customerName: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  privacyConsent: boolean;
};

export type BlockedSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: string;
};

export type NewBlockedSlotInput = {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
};

export type Product = {
  id: string;
  name: string;
  unit: string;
  minStock: number;
};

export type ProductWithStock = Product & {
  stock: number;
};

export type StockMovementType = "in" | "out";

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  date: string;
  note?: string;
  createdAt: string;
  createdBy?: string | null;
};

export type NewProductInput = {
  name: string;
  unit: string;
  minStock: number;
};

export type UpdateProductInput = {
  name?: string;
  unit?: string;
  minStock?: number;
};

export type NewMovementInput = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  date: string;
  note?: string;
};

export type MovementFilters = {
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type AvailabilitySlot = {
  time: string;
  available: boolean;
};

export type ApiErrorBody = {
  error: string;
  code?: string;
};
