-- Refactor Pricing Model
-- This migration updates the plans table and usage_ledger constraints to match the new credit-based system.

-- 1. Update metric check constraint in usage_ledger
ALTER TABLE public.usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_metric_check;

-- Delete old ledger entries as they follow the old billing model
DELETE FROM public.usage_ledger WHERE metric NOT IN ('processing_credits', 'export_credits', 'priority_fee');

ALTER TABLE public.usage_ledger ADD CONSTRAINT usage_ledger_metric_check CHECK (metric IN ('processing_credits', 'export_credits', 'priority_fee'));

-- 2. Clear old plans and insert new ones
DELETE FROM public.plans;

INSERT INTO public.plans (id, name, price_monthly, price_yearly, quota_description, features_ui, limits, flags) VALUES
('starter', 'Starter', 30, 30, '330 Credits', 
 '[{"text":"330 크레딧"},{"text":"HD/FHD 렌더링"},{"text":"보관 7일"},{"text":"1개 동시 Export"}]'::jsonb,
 '{"monthlyCredits": 330, "concurrentExports": 1, "storageRetentionDays": 7, "queuePriority": "standard", "templateAccess": "basic"}'::jsonb,
 '{"priority": false, "apiAccess": false, "watermark": false}'::jsonb
),
('pro', 'Pro', 60, 60, '660 Credits', 
 '[{"text":"660 크레딧"},{"text":"HD/FHD/4K 지원"},{"text":"보관 30일"},{"text":"2개 동시 Export"}]'::jsonb,
 '{"monthlyCredits": 660, "concurrentExports": 2, "storageRetentionDays": 30, "queuePriority": "standard", "templateAccess": "all"}'::jsonb,
 '{"priority": false, "apiAccess": false, "watermark": false}'::jsonb
),
('plus', 'Plus', 120, 120, '1320 Credits', 
 '[{"text":"1320 크레딧"},{"text":"우선 순위 큐"},{"text":"보관 60일"},{"text":"3개 동시 Export"}]'::jsonb,
 '{"monthlyCredits": 1320, "concurrentExports": 3, "storageRetentionDays": 60, "queuePriority": "priority", "templateAccess": "all"}'::jsonb,
 '{"priority": true, "apiAccess": true, "watermark": false}'::jsonb
),
('max', 'Max', 180, 180, '1980 Credits', 
 '[{"text":"1980 크레딧"},{"text":"최고 우선 순위"},{"text":"보관 90일"},{"text":"5개 동시 Export"}]'::jsonb,
 '{"monthlyCredits": 1980, "concurrentExports": 5, "storageRetentionDays": 90, "queuePriority": "highest", "templateAccess": "all"}'::jsonb,
 '{"priority": true, "apiAccess": true, "watermark": false}'::jsonb
);

-- 3. Update existing subscriptions (optional, but good for consistency)
-- For this refactor, we assume new users or manual migration for existing.
-- UPDATE public.subscriptions SET plan_id = 'starter' WHERE plan_id = 'free';
-- UPDATE public.subscriptions SET plan_id = 'pro' WHERE plan_id = 'creator';
