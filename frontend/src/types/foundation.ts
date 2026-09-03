export type Cadence = "weekly" | "monthly";

export interface Profile {
  id: string;
  currency: "SGD";
  timezone: "Asia/Singapore";
  onboardingCompleted: boolean;
  /**
   * The opening balance only. Never displayed: the balance a user recognises is
   * {@link Profile.emergencyFundBalanceCents}.
   */
  latestEmergencySavingsCents: number;
  /** Opening balance + deposits − withdrawals. The single displayed balance. */
  emergencyFundBalanceCents: number;
  displayName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
}

export interface RecurringWorkCost {
  id: string;
  category: "vehicle_rental" | "insurance" | "subscription" | "equipment" | "other";
  label: string;
  amountCents: number;
  cadence: Cadence;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EssentialExpense {
  id: string;
  category: "housing" | "food" | "transport" | "utilities" | "healthcare" | "caregiving" | "debt" | "other";
  label: string;
  amountCents: number;
  cadence: Cadence;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarningItem {
  id: string;
  platformCode: "grab" | "gojek" | "tada" | "deliveroo" | "foodpanda" | "lalamove" | "other";
  platformLabel?: string | null;
  amountCents: number;
}

export interface VariableCostItem {
  id: string;
  category: "fuel" | "charging" | "tolls" | "parking" | "repairs" | "platform_fees" | "cpf" | "other";
  label: string;
  amountCents: number;
}

export interface InputSnapshot {
  id: string;
  sourceId?: string | null;
  inputKind: "recurring_work_cost" | "essential_expense";
  category: string;
  label: string;
  amountCents: number;
  cadence: Cadence;
}

export interface WeeklyEntry {
  id: string;
  weekStart: string;
  expectedRevision?: number | null;
  hadNoIncome: boolean;
  emergencySavingsCents: number;
  status: "draft" | "confirmed";
  revision: number;
  earnings: EarningItem[];
  variableCosts: VariableCostItem[];
  inputSnapshots: InputSnapshot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  entryType: "income" | "cost";
  amountCents: number;
  description?: string | null;
  occurredOn: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoundationBootstrap {
  profile: Profile;
  recurringWorkCosts: RecurringWorkCost[];
  essentialExpenses: EssentialExpense[];
  weeklyEntries: WeeklyEntry[];
  transactions: Transaction[];
  syncedAt: string;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

/**
 * The backend's single error shape. Every route returns it under `error`.
 * HTTP 401 responses carry the code `UNAUTHENTICATED`.
 */
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { serverRecord?: WeeklyEntry } & Record<string, unknown>;
  fieldErrors?: ApiFieldError[];
  requestId?: string;
}

export interface ApiErrorBody {
  error: ApiErrorPayload;
}
