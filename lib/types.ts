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
  createdAt: string;
};

export type CapacityConfig = {
  totalCapacity: number;
  defaultDurationMinutes: number;
};

export type NewReservationInput = {
  customerName: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
};

export type Product = {
  id: string;
  name: string;
  unit: string;
  minStock: number;
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
};
