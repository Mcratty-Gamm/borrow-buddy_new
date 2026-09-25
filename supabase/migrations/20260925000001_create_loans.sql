-- ตาราง Loan ของเจ้าของแต่ละบัญชี (design.md ข้อ 4)
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id),
  friend_name text not null constraint loans_friend_name_not_blank check (btrim(friend_name) <> ''),
  item_name text not null constraint loans_item_name_not_blank check (btrim(item_name) <> ''),
  borrowed_date date not null,
  due_date date not null,
  returned_date date,
  created_at timestamptz not null default now(),
  constraint loans_due_not_before_borrowed check (due_date >= borrowed_date),
  constraint loans_returned_not_before_borrowed check (returned_date is null or returned_date >= borrowed_date)
);

create index loans_owner_id_idx on public.loans (owner_id);
