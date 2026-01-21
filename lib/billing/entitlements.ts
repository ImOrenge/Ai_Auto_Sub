/**
 * Entitlements and plan-based feature limits
 */

export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
  concurrentJobs: number;
  maxMonthlyJobs: number;
  maxVideoLength: number; // in minutes
  costPerJob: number; // in USD
}

const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    concurrentJobs: 1,
    maxMonthlyJobs: 10,
    maxVideoLength: 10,
    costPerJob: 0.10,
  },
  pro: {
    concurrentJobs: 3,
    maxMonthlyJobs: 100,
    maxVideoLength: 60,
    costPerJob: 0.05,
  },
  enterprise: {
    concurrentJobs: 5,
    maxMonthlyJobs: -1, // unlimited
    maxVideoLength: -1, // unlimited
    costPerJob: 0.03,
  },
};

/**
 * Get concurrency limit based on user's plan
 */
export function getConcurrencyLimit(plan: UserPlan): number {
  return PLAN_LIMITS[plan].concurrentJobs;
}

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Check user's current plan
 * TODO: Implement actual subscription check from billing table
 */
export async function checkUserPlan(userId: string): Promise<UserPlan> {
  // For MVP, default to 'free'
  // Future: Query billing/subscription table
  // const { data } = await supabase
  //   .from('subscriptions')
  //   .select('plan')
  //   .eq('user_id', userId)
  //   .single();
  // return data?.plan || 'free';
  
  return 'free';
}

/**
 * Calculate estimated cost for batch processing
 */
export function getEstimatedCost(jobCount: number, plan: UserPlan): number {
  const { costPerJob } = PLAN_LIMITS[plan];
  return Number((jobCount * costPerJob).toFixed(2));
}

/**
 * Get month string in YYYY-MM format
 */
function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function getNextMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  const nextDate = new Date(year, mon, 1); // mon is 0-indexed in Date constructor
  return nextDate.toISOString().slice(0, 7);
}

/**
 * Get number of jobs created this month
 */
export async function getMonthlyJobCount(userId: string, month?: string): Promise<number> {
  // Lazy import to avoid circular dependency
  const { getSupabaseServer } = await import('@/lib/supabaseServer');
  const supabase = getSupabaseServer();
  
  const currentMonth = month || getCurrentMonth();
  const nextMonth = getNextMonth(currentMonth);
  
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${currentMonth}-01`)
    .lt('created_at', `${nextMonth}-01`);
  
  if (error) {
    console.error('[Entitlements] Error counting monthly jobs:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Check if user can run a batch of jobs
 */
export async function canRunBatch(
  userId: string,
  jobCount: number
): Promise<{ allowed: boolean; reason?: string; plan: UserPlan; currentUsage?: number }> {
  const plan = await checkUserPlan(userId);
  const limits = PLAN_LIMITS[plan];

  // Check monthly limit (if not unlimited)
  if (limits.maxMonthlyJobs !== -1) {
    const usageThisMonth = await getMonthlyJobCount(userId);
    
    if (usageThisMonth + jobCount > limits.maxMonthlyJobs) {
      return {
        allowed: false,
        reason: `Monthly limit reached (${usageThisMonth}/${limits.maxMonthlyJobs}). Upgrade to continue.`,
        plan,
        currentUsage: usageThisMonth
      };
    }
  }

  return { allowed: true, plan };
}
