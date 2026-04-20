alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.listings
  add column if not exists featured boolean not null default false,
  add column if not exists featured_at timestamptz,
  add column if not exists featured_until timestamptz,
  add column if not exists featured_by uuid references public.profiles(id),
  add column if not exists featured_order integer;

update public.profiles
set is_admin = true
where lower(email) in ('senayabraha.w@gmail.com');

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'listings'
      and policyname = 'Admins can update all listings'
  ) then
    create policy "Admins can update all listings"
      on public.listings
      for update
      to authenticated
      using (public.is_current_user_admin())
      with check (public.is_current_user_admin());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'listings'
      and policyname = 'Admins can read all listings'
  ) then
    create policy "Admins can read all listings"
      on public.listings
      for select
      to authenticated
      using (public.is_current_user_admin());
  end if;
end $$;
