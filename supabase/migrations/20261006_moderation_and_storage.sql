-- Segunda etapa: impedir listagem ampla de fotos e auditar moderação.
begin;

drop policy "public reads pet photos" on storage.objects;
create policy "owner reads own photo records" on storage.objects
  for select to authenticated using (
    bucket_id = 'pet-photos' and
    (storage.foldername(name))[1] = (select auth.uid())::text
  );

create table public.moderation_actions (
  id bigint generated always as identity primary key,
  occurrence_id bigint not null references public.occurrences(id) on delete cascade,
  admin_id uuid not null references auth.users(id),
  review_status text not null check (review_status in ('aprovada', 'ocultada')),
  created_at timestamptz not null default now()
);
create index moderation_actions_occurrence_idx
  on public.moderation_actions (occurrence_id, created_at desc);
alter table public.moderation_actions enable row level security;
revoke all on public.moderation_actions from anon, authenticated;
grant select, insert on public.moderation_actions to authenticated;

create policy "admins read moderation audit" on public.moderation_actions
  for select to authenticated using (
    exists (select 1 from public.app_admins where user_id = (select auth.uid()))
  );
create policy "admins create own moderation action" on public.moderation_actions
  for insert to authenticated with check (
    admin_id = (select auth.uid()) and
    exists (select 1 from public.app_admins where user_id = (select auth.uid()))
  );

create or replace function public.apply_moderation_action()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.occurrences
     set review_status = new.review_status
   where id = new.occurrence_id;
  return new;
end;
$$;
revoke all on function public.apply_moderation_action() from public, anon, authenticated;
create trigger moderation_action_applies
  after insert on public.moderation_actions
  for each row execute function public.apply_moderation_action();

drop function public.moderate_occurrence(bigint, text);
commit;
