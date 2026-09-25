-- RLS: เจ้าของเห็น/เพิ่ม/แก้ได้เฉพาะ Loan ของตัวเอง ไม่มีการลบ (design.md ข้อ 6)
alter table public.loans enable row level security;

-- ให้สิทธิ์เท่าที่ใช้: anon ไม่มีสิทธิ์เลย, authenticated ไม่มี DELETE
revoke all on table public.loans from anon, authenticated;
grant select, insert, update on table public.loans to authenticated;

create policy "loans_select_own" on public.loans
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "loans_insert_own" on public.loans
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "loans_update_own" on public.loans
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ไม่มี policy สำหรับ DELETE จึงลบไม่ได้แม้มีสิทธิ์ตาราง
