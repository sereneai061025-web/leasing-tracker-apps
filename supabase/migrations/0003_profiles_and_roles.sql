create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin','sub_admin','user')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
drop policy if exists "profiles_read" on profiles;
create policy "profiles_read" on profiles for select using (true);
drop policy if exists "profiles_write" on profiles;
create policy "profiles_write" on profiles for all using (true) with check (true);

create or replace function create_app_user(p_email text, p_password text, p_full_name text, p_role text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_user_id uuid;
begin
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
  values ('00000000-0000-0000-0000-000000000000',gen_random_uuid(),'authenticated','authenticated',p_email,crypt(p_password,gen_salt('bf')),now(),now(),now(),'','','','') returning id into new_user_id;
  insert into profiles (id,email,full_name,role) values (new_user_id,p_email,p_full_name,p_role);
  return new_user_id;
end;
$$;
