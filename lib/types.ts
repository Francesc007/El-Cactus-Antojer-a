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

export type LoyaltyStatus = "active" | "inactive";
export type LoyaltyVisitSource = "scan" | "manual";
export type BirthdaySendStatus = "sent" | "failed" | "pending" | "none";

export type LoyaltyListItem = {
  id: string;
  fullName: string;
  folio: string;
  phone: string;
  photoUrl: string | null;
  currentVisits: number;
  visitsPerReward: number;
  status: LoyaltyStatus;
  rewardAvailable: boolean;
};

export type LoyaltyPreview = {
  id: string;
  fullName: string;
  folio: string;
  photoUrl: string | null;
  currentVisits: number;
  visitsPerReward: number;
  rewardDescription: string;
  rewardAvailable: boolean;
  visitsUntilReward: number;
  tooSoon: boolean;
  minHours: number;
  status: LoyaltyStatus;
};

export type LoyaltyVisitRecord = {
  id: string;
  visitedAtLabel: string;
  source: LoyaltyVisitSource;
  voided: boolean;
  voidReason: string | null;
};

export type LoyaltyRedemptionRecord = {
  id: string;
  redeemedAtLabel: string;
  visitsConsumed: number;
};

export type LoyaltyMemberDetail = {
  id: string;
  fullName: string;
  folio: string;
  phone: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  photoUrl: string | null;
  marketingConsent: boolean;
  status: LoyaltyStatus;
  currentVisits: number;
  visitsPerReward: number;
  rewardDescription: string;
  rewardAvailable: boolean;
  visitsUntilReward: number;
  tooSoon: boolean;
  minHours: number;
  visits: LoyaltyVisitRecord[];
  redemptions: LoyaltyRedemptionRecord[];
};

export type PublicLoyaltyCard = {
  firstName: string;
  folio: string;
  photoUrl: string | null;
  currentVisits: number;
  visitsPerReward: number;
  rewardDescription: string;
  rewardAvailable: boolean;
  visitsUntilReward: number;
  cardUrl: string;
};

export type UpdateLoyaltyMemberInput = {
  fullName?: string;
  phone?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number | null;
  status?: LoyaltyStatus;
  marketingConsent?: boolean;
};

export type LoyaltySettingsView = {
  visitsPerReward: number;
  rewardDescription: string;
  minHoursBetweenVisits: number;
  birthdayMessage: string;
};

export type BirthdayEntry = {
  id: string;
  fullName: string;
  firstName: string;
  folio: string;
  photoUrl: string | null;
  whenLabel: string;
  year: number;
  sendStatus: BirthdaySendStatus;
  whatsappUrl: string | null;
  messagePreview: string;
};

export type BirthdayBoard = {
  provider: "wa_me" | "whatsapp_cloud";
  today: BirthdayEntry[];
  week: BirthdayEntry[];
  upcoming: BirthdayEntry[];
};
