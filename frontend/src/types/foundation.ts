export type Cadence = "weekly" | "monthly";

export interface Profile {
  id: string;
  currency: "SGD";
  timezone: "Asia/Singapore";
  onboardingCompleted: boolean;
  latestEmergencySavingsCents: number;
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

export interface FoundationBootstrap {
  profile: Profile;
  recurringWorkCosts: RecurringWorkCost[];
  essentialExpenses: EssentialExpense[];
  weeklyEntries: WeeklyEntry[];
  syncedAt: string;
}

export interface CsvPreviewRow {
  rowNumber: number;
  status: "valid" | "invalid";
  weekStart?: string | null;
  recordType?: "earning" | "variable_work_cost" | null;
  source?: string | null;
  category?: string | null;
  description?: string | null;
  amountCents?: number | null;
  errors: string[];
}

export interface CsvPreview {
  fileName: string;
  fileSha256: string;
  rows: CsvPreviewRow[];
  validCount: number;
  invalidCount: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fieldErrors?: Array<{ path: string; message: string }>;
    details?: { serverRecord?: WeeklyEntry };
    requestId?: string;
  };
}
