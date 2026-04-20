create table if not exists public.thread_reads (
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

alter table public.thread_reads enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'thread_reads'
      and policyname = 'Users can read their thread read receipts'
  ) then
    create policy "Users can read their thread read receipts"
      on public.thread_reads
      for select
      to authenticated
      using (
        user_id = auth.uid()
        and exists (
          select 1
          from public.threads
          where threads.id = thread_reads.thread_id
            and (threads.buyer_id = auth.uid() or threads.seller_id = auth.uid())
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'thread_reads'
      and policyname = 'Users can upsert their thread read receipts'
  ) then
    create policy "Users can upsert their thread read receipts"
      on public.thread_reads
      for insert
      to authenticated
      with check (
        user_id = auth.uid()
        and exists (
          select 1
          from public.threads
          where threads.id = thread_reads.thread_id
            and (threads.buyer_id = auth.uid() or threads.seller_id = auth.uid())
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'thread_reads'
      and policyname = 'Users can update their thread read receipts'
  ) then
    create policy "Users can update their thread read receipts"
      on public.thread_reads
      for update
      to authenticated
      using (
        user_id = auth.uid()
        and exists (
          select 1
          from public.threads
          where threads.id = thread_reads.thread_id
            and (threads.buyer_id = auth.uid() or threads.seller_id = auth.uid())
        )
      )
      with check (
        user_id = auth.uid()
        and exists (
          select 1
          from public.threads
          where threads.id = thread_reads.thread_id
            and (threads.buyer_id = auth.uid() or threads.seller_id = auth.uid())
        )
      );
  end if;
end $$;
