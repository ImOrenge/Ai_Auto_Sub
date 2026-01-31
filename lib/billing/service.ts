import { 
  PlanId, 
  Subscription, 
  EntitlementSummary, 
  UsageLedgerItem, 
  Invoice,
  PlanConfig,
  PlanLimits,
  PlanFeatures
} from "./types";
import { MOCK_USER_ID } from "../utils";
import { getSupabaseServer } from "../supabaseServer";
import { env } from "../env";

// Default fallback limits if DB fetch fails or for Free tier if no record exists
const DEFAULT_FREE_LIMITS: PlanLimits = { sttMinutes: 30, translationLanguages: 0, concurrentJobs: 100, storageDays: 3, maxProjects: 3 };
const DEFAULT_FREE_FEATURES: PlanFeatures = { priority: false, apiAccess: false, watermark: true };

export class BillingService {
  
  // Get Subscription (Mock -> DB)
  static async getSubscription(userId: string = MOCK_USER_ID): Promise<Subscription> {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id as PlanId,
        status: data.status as Subscription['status'],
        cycle: data.billing_cycle as 'monthly' | 'yearly',
        currentPeriodStart: new Date(data.current_period_start),
        currentPeriodEnd: new Date(data.current_period_end),
        cancelAtPeriodEnd: data.cancel_at_period_end,
      };
    }

    // Default to a virtual Free subscription if no record found
    // Fixed: Anchor to start of current month to ensure sticky usage accumulation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      id: "sub_virtual_free",
      userId,
      planId: "free",
      status: "active",
      cycle: "monthly",
      currentPeriodStart: startOfMonth,
      currentPeriodEnd: endOfMonth,
      cancelAtPeriodEnd: false,
    };
  }

  static async getPlanConfig(planId: string): Promise<PlanConfig> {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (data) {
      return {
        id: data.id as PlanId,
        name: data.name,
        priceMonthly: data.price_monthly,
        priceYearly: data.price_yearly,
        limits: data.limits as PlanLimits,
        features: data.flags as PlanFeatures,
      };
    }

    // Fallback if not found (should not happen if migration ran)
    // Return hardcoded Free config to prevent crash
    return {
      id: "free",
      name: "Free",
      priceMonthly: 0,
      priceYearly: 0,
      limits: DEFAULT_FREE_LIMITS,
      features: DEFAULT_FREE_FEATURES
    };
  }

  static getUserId(userId?: string): string {
    if (!userId) return MOCK_USER_ID;
    return userId;
  }

  // Calculate Entitlements (Active Plan + Usage)
  static async getEntitlements(userId: string = MOCK_USER_ID): Promise<EntitlementSummary> {
    const supabase = getSupabaseServer();
    const subscription = await this.getSubscription(userId);
    const planConfig = await this.getPlanConfig(subscription.planId);
    
    // Calculate usage from ledger for CURRENT period
    const ledger = await this.getUsageLedger(userId, { 
      startDate: subscription.currentPeriodStart, 
      endDate: subscription.currentPeriodEnd 
    });
    
    const usedStt = ledger
      .filter(l => l.metric === "stt_minutes" && l.status === "posted")
      .reduce((acc, curr) => acc + curr.quantity, 0);

    // Count active jobs (any status that is actually using processing resources)
    const { count: activeCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('status', 'in', '("done","error","canceled","awaiting_edit","editing","ready_to_export")');

    // Count projects
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      planName: planConfig.name,
      stt: {
        total: planConfig.limits.sttMinutes,
        used: usedStt,
        remaining: Math.max(0, planConfig.limits.sttMinutes - usedStt),
        isOverLimit: usedStt >= planConfig.limits.sttMinutes
      },
      translation: {
        allowedLanguages: planConfig.limits.translationLanguages === 99 ? "unlimited" : planConfig.limits.translationLanguages
      },
      jobs: {
        concurrentLimit: planConfig.limits.concurrentJobs,
        activeCount: activeCount || 0
      },
      projects: {
        maxLimit: planConfig.limits.maxProjects,
        currentCount: projectCount || 0
      },
      features: {
        canRemoveWatermark: !planConfig.features.watermark,
        hasPriorityProcessing: planConfig.features.priority,
        hasApiAccess: planConfig.features.apiAccess
      }
    };
  }

  // Get Usage Ledger
  static async getUsageLedger(userId: string = MOCK_USER_ID, filters?: { startDate?: Date, endDate?: Date }): Promise<UsageLedgerItem[]> {
    const supabase = getSupabaseServer();
    let query = supabase
      .from('usage_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data } = await query;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      jobId: row.job_id,
      metric: row.metric as any,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      amount: Number(row.amount),
      reason: row.reason as any,
      status: row.status as any,
      createdAt: new Date(row.created_at),
      description: row.description || undefined
    }));
  }

  static async getInvoices(userId: string): Promise<Invoice[]> {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      status: row.status as any,
      amountTotal: Number(row.amount),
      currency: row.currency,
      created: new Date(row.created_at),
      periodStart: new Date(row.period_start),
      periodEnd: new Date(row.period_end),
      lineItems: row.line_items as any
    }));
  }

  static async recordJobUsage(jobId: string, userId: string, usage: { durationSec: number, translationCount: number }) {
    const supabase = getSupabaseServer();
    
    // 0. Get Project ID (Resolve from Job -> Queue -> Project)
    const { data: jobData } = await supabase
        .from('jobs')
        .select(`
            queue_id,
            queues (
                project_id
            )
        `)
        .eq('id', jobId)
        .single();
        
    // data structure: { queue_id: "...", queues: { project_id: "..." } }
    // Note: queues could be null if job has no queue (shouldn't happen in new flow)
    // Cast to any to avoid type errors since I know the shape better than the inferred one if types aren't updated
    const projectId = (jobData as any)?.queues?.project_id || null;

    // 1. Get current entitlements to check remaining quota
    const entitlements = await this.getEntitlements(userId);
    const sub = await this.getSubscription(userId); // Need period info for period_key
    
    const minutes = Math.ceil(usage.durationSec / 60);
    const periodKey = `${sub.currentPeriodStart.getFullYear()}-${String(sub.currentPeriodStart.getMonth() + 1).padStart(2, '0')}`;
    
    // Rates (Hardcoded for now, could be in DB)
    const OVERAGE_RATE_STT = 30; // KRW per min per plan check
    
    const ledgerEntries: any[] = [];
    let totalCost = 0;

    // --- STT Usage Logic ---
    let sttIncluded = 0;
    let sttOverage = 0;

    // entitlements.stt.remaining is the unused amount of the base quota
    const remaining = entitlements.stt.remaining;

    if (remaining >= minutes) {
        // Fully covered by included quota
        sttIncluded = minutes;
    } else {
        // Partially covered or fully overage
        sttIncluded = remaining;
        sttOverage = minutes - remaining;
    }

    if (sttIncluded > 0) {
        ledgerEntries.push({
            user_id: userId,
            project_id: projectId,
            job_id: jobId,
            metric: 'stt_minutes',
            quantity: sttIncluded,
            unit_price: 0,
            amount: 0,
            reason: 'included',
            status: 'posted',
            period_key: periodKey,
            description: `STT (Included) - ${sttIncluded}m`
        });
    }

    if (sttOverage > 0) {
        const cost = sttOverage * OVERAGE_RATE_STT;
        totalCost += cost;
        ledgerEntries.push({
            user_id: userId,
            project_id: projectId,
            job_id: jobId,
            metric: 'stt_minutes',
            quantity: sttOverage,
            unit_price: OVERAGE_RATE_STT,
            amount: cost,
            reason: 'overage',
            status: 'posted',
            period_key: periodKey,
            description: `STT Overage - ${sttOverage}m`
        });
    }

    // --- Translation Usage Logic ---
    if (usage.translationCount > 0) {
        const transQuantity = minutes * usage.translationCount;
        ledgerEntries.push({
            user_id: userId,
            project_id: projectId,
            job_id: jobId,
            metric: 'translation_minutes',
            quantity: transQuantity,
            unit_price: 0, 
            amount: 0,
            reason: 'included',
            status: 'posted',
            period_key: periodKey,
            description: `Translation (${usage.translationCount} langs)`
        });
    }

    // Batch Insert Ledger
    if (ledgerEntries.length > 0) {
        // Debug Log
        console.log(`[BillingService] Inserting ledger for project ${projectId}:`, JSON.stringify(ledgerEntries));
        
        const { error } = await supabase.from('usage_ledger').insert(ledgerEntries);
        
        if (error) {
            console.error('[BillingService] Ledger Insert Error:', error);
            throw error;
        }
    } else {
        console.log('[BillingService] No ledger entries to insert (duration 0?)');
    }

    // Update Job with Cost
    const { error: jobError } = await supabase.from('jobs').update({ cost: totalCost }).eq('id', jobId);
    if (jobError) {
        console.error('[BillingService] Job Update Error:', jobError);
        throw jobError;
    }
  }
}
