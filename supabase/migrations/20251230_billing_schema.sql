-- Create plans table
create table public.plans (
  id text primary key,
  name text not null,
  price_monthly integer,
  price_yearly integer,
  quota_description text,
  features_ui jsonb not null default '[]'::jsonb, -- Renamed for clarity: UI text features
  limits jsonb not null default '{}'::jsonb,      -- operational limits
  flags jsonb not null default '{}'::jsonb,       -- boolean feature flags
  created_at timestamptz default now()
);

alter table public.plans enable row level security;
create policy "Plans are viewable by everyone" on public.plans for select using (true);

-- Insert default plans
insert into public.plans (id, name, price_monthly, price_yearly, quota_description, features_ui, limits, flags) values
('free', 'Free', 0, 0, '30분', 
 '[{"text":"STT(단일 언어)"},{"text":"SRT 다운로드"},{"text":"워터마크","value":"ON"},{"text":"보관 3일"},{"text":"동시 Job 1"}]'::jsonb,
 '{"sttMinutes": 30, "translationLanguages": 0, "concurrentJobs": 1, "storageDays": 3}'::jsonb,
 '{"priority": false, "apiAccess": false, "watermark": true}'::jsonb
),
('creator', 'Creator', 19900, 190800, '450분',
 '[{"text":"STT"},{"text":"번역 3개 언어"},{"text":"SRT/VTT"},{"text":"워터마크","value":"OFF"},{"text":"보관 60일"},{"text":"동시 Job 5"},{"text":"지원: 이메일"}]'::jsonb,
 '{"sttMinutes": 450, "translationLanguages": 3, "concurrentJobs": 5, "storageDays": 60}'::jsonb,
 '{"priority": false, "apiAccess": false, "watermark": false}'::jsonb
),
('pro', 'Pro', 59900, 574800, '1800분',
 '[{"text":"STT"},{"text":"번역 무제한"},{"text":"SRT/VTT/TXT"},{"text":"자막 스타일 커스텀"},{"text":"우선 처리"},{"text":"보관 180일"},{"text":"동시 Job 20"},{"text":"팀 멤버 3"},{"text":"Webhook"},{"text":"API(기본)"}]'::jsonb,
 '{"sttMinutes": 1800, "translationLanguages": 99, "concurrentJobs": 20, "storageDays": 180}'::jsonb,
 '{"priority": true, "apiAccess": true, "watermark": false}'::jsonb
),
('enterprise', 'Enterprise', null, null, '대량/계약',
 '[{"text":"Full API Access"},{"text":"SLA"},{"text":"SSO"},{"text":"감사/로그"},{"text":"전용 인프라(옵션)"},{"text":"커스텀 워크플로우"}]'::jsonb,
 '{"sttMinutes": 99999, "translationLanguages": 99, "concurrentJobs": 99, "storageDays": 365}'::jsonb,
 '{"priority": true, "apiAccess": true, "watermark": false}'::jsonb
);


-- Create subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan_id text references public.plans(id) not null,
  status text not null check (status in ('active', 'canceled', 'past_due', 'incomplete')),
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Service role can manage subscriptions" on public.subscriptions for all using (true);


-- Create usage_ledger table
create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  job_id uuid references public.jobs(id) on delete set null,
  metric text not null check (metric in ('stt_minutes', 'translation_minutes', 'priority_fee')),
  quantity numeric not null,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  period_key text not null, -- 'YYYY-MM'
  status text not null default 'pending' check (status in ('pending', 'posted', 'void')),
  reason text not null check (reason in ('included', 'overage', 'promo', 'failed_job')),
  description text,
  created_at timestamptz default now()
);

alter table public.usage_ledger enable row level security;
create policy "Users can view own ledger" on public.usage_ledger for select using (auth.uid() = user_id);


-- Create invoices table
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  amount numeric not null,
  currency text not null default 'KRW',
  status text not null check (status in ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_pdf text, -- renamed to ensure compatibility if needed, or just pdf_url
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now(),
  line_items jsonb default '[]'::jsonb -- Added line_items for simple display
);

alter table public.invoices enable row level security;
create policy "Users can view own invoices" on public.invoices for select using (auth.uid() = user_id);


-- Add cost columns to jobs table
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'jobs' and column_name = 'cost') then
    alter table public.jobs add column cost numeric;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'jobs' and column_name = 'cost_snapshot') then
    alter table public.jobs add column cost_snapshot jsonb;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'jobs' and column_name = 'usage_metrics') then
      alter table public.jobs add column usage_metrics jsonb;
  end if;
end $$;
