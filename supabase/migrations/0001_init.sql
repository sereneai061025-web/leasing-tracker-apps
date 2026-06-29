create table if not exists authorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  abbreviation text,
  country text default 'Singapore',
  website text,
  created_at timestamptz not null default now()
);

alter table authorities enable row level security;
drop policy if exists "authorities_v1_read" on authorities;
create policy "authorities_v1_read" on authorities for select using (true);
drop policy if exists "authorities_v1_write" on authorities;
create policy "authorities_v1_write" on authorities for all using (true) with check (true);

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  address text,
  outlet_code text,
  created_at timestamptz not null default now()
);

alter table outlets enable row level security;
drop policy if exists "outlets_v1_read" on outlets;
create policy "outlets_v1_read" on outlets for select using (true);
drop policy if exists "outlets_v1_write" on outlets;
create policy "outlets_v1_write" on outlets for all using (true) with check (true);

create table if not exists licences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  licence_number text,
  licence_name text not null,
  category text,
  authority_id uuid references authorities(id),
  outlet_id uuid references outlets(id),
  assigned_to text,
  issue_date date,
  expiry_date date not null,
  status text not null default 'active',
  renewal_period_months integer,
  renewal_period_months_source text,
  renewal_period_months_confidence numeric,
  renewal_period_months_review_status text default 'unreviewed',
  risk_level text,
  risk_level_source text,
  risk_level_confidence numeric,
  risk_level_review_status text default 'unreviewed',
  notes text,
  document_url text,
  created_at timestamptz not null default now()
);

alter table licences enable row level security;
drop policy if exists "licences_v1_read" on licences;
create policy "licences_v1_read" on licences for select using (true);
drop policy if exists "licences_v1_write" on licences;
create policy "licences_v1_write" on licences for all using (true) with check (true);

create table if not exists renewal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  licence_id uuid references licences(id) on delete cascade,
  action_type text not null,
  actioned_by text,
  action_date date not null default current_date,
  notes text,
  new_expiry_date date,
  new_licence_number text,
  created_at timestamptz not null default now()
);

alter table renewal_logs enable row level security;
drop policy if exists "renewal_logs_v1_read" on renewal_logs;
create policy "renewal_logs_v1_read" on renewal_logs for select using (true);
drop policy if exists "renewal_logs_v1_write" on renewal_logs;
create policy "renewal_logs_v1_write" on renewal_logs for all using (true) with check (true);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor text,
  action text not null,
  object_type text,
  object_id uuid,
  object_label text,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table activities enable row level security;
drop policy if exists "activities_v1_read" on activities;
create policy "activities_v1_read" on activities for select using (true);
drop policy if exists "activities_v1_write" on activities;
create policy "activities_v1_write" on activities for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor text,
  action text not null,
  table_name text,
  record_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into authorities (id, name, abbreviation, website) values
  ('a1000000-0000-0000-0000-000000000001', 'Singapore Food Agency', 'SFA', 'https://www.sfa.gov.sg'),
  ('a1000000-0000-0000-0000-000000000002', 'Ministry of Manpower', 'MOM', 'https://www.mom.gov.sg'),
  ('a1000000-0000-0000-0000-000000000003', 'Singapore Tourism Board', 'STB', 'https://www.stb.gov.sg')
on conflict (id) do nothing;

insert into outlets (id, name, address, outlet_code) values
  ('b1000000-0000-0000-0000-000000000001', 'Orchard Central Outlet', '181 Orchard Rd, #05-01', 'OC-01'),
  ('b1000000-0000-0000-0000-000000000002', 'Raffles City Branch', '252 North Bridge Rd, #03-20', 'RC-02'),
  ('b1000000-0000-0000-0000-000000000003', 'Vivocity Kiosk', '1 HarbourFront Walk, #01-08', 'VC-03')
on conflict (id) do nothing;

insert into licences (id, licence_number, licence_name, category, authority_id, outlet_id, assigned_to, issue_date, expiry_date, status, renewal_period_months, notes) values
  ('c1000000-0000-0000-0000-000000000001', 'SFA-2022-OC-4421', 'Food Shop Licence', 'Food Hygiene', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Priya Nair', '2023-01-15', '2025-01-14', 'expiring_soon', 12, 'Renewal submitted, awaiting SFA approval.'),
  ('c1000000-0000-0000-0000-000000000002', 'SFA-2021-RC-3310', 'Liquor Licence (Class 3A)', 'Liquor', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'James Tan', '2021-06-01', '2024-05-31', 'expired', 36, 'Pending re-application.'),
  ('c1000000-0000-0000-0000-000000000003', 'MOM-2023-WP-8892', 'Work Pass (S-Pass) Quota', 'Employment', 'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Priya Nair', '2023-03-01', '2026-02-28', 'active', 36, NULL),
  ('c1000000-0000-0000-0000-000000000004', 'STB-2022-TA-0055', 'Tourism Operator Licence', 'Tourism', 'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Wei Liang', '2022-09-01', '2024-08-31', 'expired', 24, 'Need to resubmit with updated business profile.'),
  ('c1000000-0000-0000-0000-000000000005', 'SFA-2024-VC-5503', 'Hawker Stall Licence', 'Food Hygiene', 'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'James Tan', '2024-02-01', '2026-01-31', 'active', 24, NULL)
on conflict (id) do nothing;

insert into renewal_logs (id, licence_id, action_type, actioned_by, action_date, notes, new_expiry_date) values
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Renewal Submitted', 'Priya Nair', '2024-12-10', 'Submitted online via SFA portal. Reference #RN-20241210-01.', '2026-01-14'),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Renewal Overdue — Escalated', 'James Tan', '2024-06-05', 'Escalated to Finance Director. Awaiting budget approval for penalty fee.', NULL)
on conflict (id) do nothing;

insert into activities (id, actor, action, object_type, object_id, object_label) values
  ('e1000000-0000-0000-0000-000000000001', 'Priya Nair', 'logged renewal submission', 'licence', 'c1000000-0000-0000-0000-000000000001', 'Food Shop Licence — OC-01'),
  ('e1000000-0000-0000-0000-000000000002', 'James Tan', 'escalated expired licence', 'licence', 'c1000000-0000-0000-0000-000000000002', 'Liquor Licence — RC-02'),
  ('e1000000-0000-0000-0000-000000000003', 'Wei Liang', 'flagged licence for re-application', 'licence', 'c1000000-0000-0000-0000-000000000004', 'Tourism Operator Licence — VC-03')
on conflict (id) do nothing;