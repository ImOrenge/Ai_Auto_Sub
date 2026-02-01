export type PlanId = "starter" | "pro" | "plus" | "max";

export type BillingCycle = "monthly" | "yearly";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete" | "trialing";

export interface PlanLimits {
  monthlyCredits: number;
  concurrentExports: number;
  storageRetentionDays: number;
  queuePriority: "standard" | "priority" | "highest";
  templateAccess: "basic" | "premium" | "cinematic" | "all";
  exportResolutionLimit: "hd" | "fhd" | "uhd";
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
  planId: PlanId;
  planName: string;
  
  // Credit Usage
  credits: {
    total: number;
    used: number;
    remaining: number;
    isOverLimit: boolean;
  };

  // Job Limits
  jobs: {
    concurrentExportsLimit: number;
    activeCount: number;
  };
  
  storage: {
    retentionDays: number;
  };

  // Feature Flags
  features: {
    queuePriority: "standard" | "priority" | "highest";
    templateAccess: "basic" | "premium" | "cinematic" | "all";
  };
  exportResolutionLimit: "hd" | "fhd" | "uhd";
}

// Usage Ledger (The "Source of Truth" for billing)
export type LedgerMetric = "processing_credits" | "export_credits" | "priority_fee";
export type LedgerReason = "included" | "overage" | "topup" | "bonus" | "adjustment";
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
