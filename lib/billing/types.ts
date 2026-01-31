export type PlanId = "free" | "creator" | "pro" | "enterprise";

export type BillingCycle = "monthly" | "yearly";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete" | "trialing";

export interface PlanLimits {
  sttMinutes: number; // Monthly allowance
  translationLanguages: number; // Max concurrent languages or total
  concurrentJobs: number;
  storageDays: number;
  maxProjects: number;
}

export interface PlanFeatures {
  priority: boolean;
  apiAccess: boolean;
  watermark: boolean; // true = has watermark (Free), false = no watermark
}

// Plan Configuration (Static)
export interface PlanConfig {
  id: PlanId;
  name: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  limits: PlanLimits;
  features: PlanFeatures;
}

// Active Subscription Context (Dynamic)
export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Entitlements = What user can do RIGHT NOW (Calculated from Sub + Usage)
export interface EntitlementSummary {
  planName: string;
  
  // STT Usage
  stt: {
    total: number; // Minutes
    used: number;
    remaining: number;
    isOverLimit: boolean;
  };

  // Translation Usage (simplifying to language-count logic as per PRD "1개 언어", "5개 언어")
  translation: {
    allowedLanguages: number | "unlimited"; 
  };
  
  // Job Limits
  jobs: {
    concurrentLimit: number;
    activeCount: number;
  };
  
  projects: {
    maxLimit: number;
    currentCount: number;
  };

  // Feature Flags
  features: {
    canRemoveWatermark: boolean;
    hasPriorityProcessing: boolean;
    hasApiAccess: boolean;
  };
}

// Usage Ledger (The "Source of Truth" for billing)
export type LedgerMetric = "stt_minutes" | "translation_minutes" | "priority_fee";
export type LedgerReason = "included" | "overage" | "promo" | "failed_job_void";
export type LedgerStatus = "posted" | "void" | "pending";

export interface UsageLedgerItem {
  id: string;
  userId: string;
  projectId?: string | null;
  jobId?: string | null; // Allow null as per Service logic
  metric: LedgerMetric;
  quantity: number; // e.g. 15 (minutes)
  unitPrice: number; // e.g. 0 (if included) or 30 (won per min)
  amount: number; // quantity * unitPrice
  reason: LedgerReason;
  status: LedgerStatus;
  createdAt: Date;
  description?: string; // Readable text like "Video Transcription (15m)"
}

// Invoice
export interface Invoice {
  id: string;
  userId: string;
  status: "paid" | "open" | "void" | "uncollectible" | "draft";
  amountTotal: number;
  currency: string;
  created: Date;
  periodStart: Date;
  periodEnd: Date;
  pdfUrl?: string; // Dummy for now
  lineItems: {
    description: string;
    amount: number;
    quantity?: number;
  }[];
}
