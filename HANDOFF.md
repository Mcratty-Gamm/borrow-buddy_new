# Handoff: Borrow Buddy (สรุปส่งต่องาน)

อัปเดตล่าสุด: 2026-09-25 (เวอร์ชัน 2: ปิดงานตามที่ผู้ใช้สั่ง ตรวจรับในเบราว์เซอร์ไม่ครบ) อ่านไฟล์นี้ก่อน แล้วอ่าน [CONTEXT.md](./CONTEXT.md), [design.md](./design.md), [Tasks.md](./Tasks.md) เพื่อทำงานต่อ

## โปรเจ็กต์คืออะไร
เว็บหน้าเดียวสำหรับเจ้าของ บันทึกว่าเพื่อนยืมของอะไร เมื่อไร ต้องคืนเมื่อไร และกดคืนแล้วได้
- เวอร์ชัน 1 (เฟส 1 – 4): เก็บข้อมูลใน localStorage
- เวอร์ชัน 2 (เฟส 5 – 8): เก็บ Loan ใน Supabase, เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน (ปิดสมัครเอง), RLS เห็นเฉพาะ Loan ของตัวเอง, นำเข้าข้อมูลเดิมจาก localStorage ได้ครั้งเดียว, ยังไม่มีการลบ Loan

เทคโนโลยี: React 19 + Vite 8 (JavaScript), Vitest 5, `@supabase/supabase-js` 2.117

## กติกาที่ต้องทำตาม
- ตอบเป็นภาษาไทยสุภาพ กระชับ ประหยัด token
- ใช้ JavaScript เท่านั้น (ไม่ใช้ TypeScript)
- ทำตามคำสั่งผู้ใช้เท่านั้น
- **ห้ามลบไฟล์โดยไม่ถามก่อน** (รวมถึงไฟล์ `.gitkeep`)
- ห้ามแสดงข้อมูลส่วนตัว
- **งาน git ทั้งหมดในโปรเจ็กต์นี้ให้มอบ agent `git-manager` ทำ** ไม่รัน git เองผ่าน Bash (แม้แต่ `git status`) และไม่ push
- ผู้ใช้สั่งให้ **commit ทุกครั้งที่ทำ task เสร็จ** ข้อความ commit ภาษาอังกฤษ รูปแบบ `feat: T3.x ...` ปิดท้ายด้วย `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- ก่อนตั้งค่า/ใช้ไลบรารี (Vite, React, Vitest, supabase-js) ให้ตรวจเอกสารล่าสุดผ่าน Context7 หรือ Supabase docs (React: `/websites/react_dev`)
- รอให้ commit ของ task หนึ่งเสร็จก่อนเริ่มแก้ไฟล์ของ task ถัดไป เพื่อไม่ให้งานปนกัน
- **ห้ามใส่ service_role / secret key ในโค้ดฝั่งเว็บ** ใช้เฉพาะ publishable key

## สถานะงาน

**เวอร์ชัน 1 (เฟส 1 – 4): เสร็จครบ** hash ด้านล่างมาจาก repository เดิม (`borrow-buddy`) ใน repository นี้ (`borrow-buddy_new`) มีแค่ commit `0303015 Initial commit`

| Task | สถานะ | Commit (repo เดิม) |
|---|---|---|
| T1.1 – T1.3 ตั้งโปรเจ็กต์ | เสร็จ | `f440dbc`, `c25eca7`, `f068441` |
| T2.1 – T2.8 ตรรกะใน `src/lib` | เสร็จ | `ae9e1f5` … `36f05e8` |
| T3.1 – T3.7 UI | เสร็จ | `e868549` … `51bef52` |
| T4.1 – T4.5 ตรวจรับ | เสร็จ | `f7ee8af` … `566becf` |

**เวอร์ชัน 2 (เฟส 5 – 8)**

| Task | สถานะ | หมายเหตุ |
|---|---|---|
| T5.1 supabase-js + `.env.example` | เสร็จ | `.env.local` สร้างแล้ว (git ไม่เก็บ) |
| T5.2 migration ตาราง `loans` | เสร็จ | apply ขึ้น Supabase แล้ว |
| T5.3 migration RLS | เสร็จ | apply ขึ้น Supabase แล้ว |
| T5.4 ตั้งค่า Auth + สร้างบัญชีเจ้าของ | เสร็จ | `disable_signup: true`, มีบัญชีเจ้าของ + บัญชีทดสอบที่สอง (ยืนยันแล้ว) |
| T5.5 Security Advisor + ตรวจ RLS | เสร็จ | Advisor ไม่มีคำเตือน, RLS ผ่านทุกข้อ, signUp ได้ 422 `signup_disabled` |
| T6.1 – T6.5 ตรรกะ + เทสต์ | เสร็จ | |
| T7.1 – T7.6 UI | เสร็จ | ยังไม่ได้ลองในเบราว์เซอร์ด้วยบัญชีจริง |
| T8.1 `npm test` | เสร็จ | 114 ข้อ (9 ไฟล์), lint และ build ผ่าน |
| T8.2 – T8.6 ตรวจรับในเบราว์เซอร์ | **หยุดตามที่ผู้ใช้สั่ง** | T8.2: เข้าสู่ระบบ/เพิ่ม/คืน/ยกเลิกคืน/รีเฟรช/ออกจากระบบ ยืนยันจาก log แล้ว แต่ "แก้ไข" ยังไม่พบคำสั่ง PATCH ใน log, T8.3 – T8.5 ไม่ได้ตรวจ, T8.6 ส่วนโค้ดผ่าน |

งานเวอร์ชัน 2 commit และ push ขึ้น `origin/main` แล้ว

## สิ่งที่ต้องทำต่อ (ถ้าผู้ใช้สั่ง)
1. ตรวจการแก้ไข Loan ในเบราว์เซอร์ให้เห็น PATCH ใน log และตรวจ T8.3 – T8.5 (มีบัญชีเจ้าของ + บัญชีทดสอบที่สองแล้ว) ผู้ใช้กรอกอีเมล/รหัสผ่านเอง ห้ามขอรหัสผ่านในแชต

สิ่งที่รอการตัดสินใจของผู้ใช้:
- ลบไฟล์เทมเพลตที่ไม่ใช้แล้ว (`src/assets/*`, `public/icons.svg`) ต้องถามก่อน
- ฟีเจอร์นอกขอบเขต (ลบ Loan, รีเซ็ตรหัสผ่าน, แจ้งเตือน ฯลฯ) ตาม design ข้อ 12 ให้ทบทวน `CONTEXT.md` ก่อนเพิ่ม

## Supabase
- โปรเจ็กต์: `https://boaouyryodmwtcvgkvqu.supabase.co` (เชื่อมผ่าน Supabase MCP ได้)
- ตาราง `public.loans`: `id` uuid, `owner_id` (default `auth.uid()`, FK `auth.users` **ไม่ cascade** จึงลบบัญชีที่ยังมี Loan ไม่ได้ ตั้งใจไว้), `friend_name`, `item_name`, `borrowed_date`, `due_date`, `returned_date`, `created_at` มี check constraint ชื่อห้ามว่างและลำดับวันที่ + index `owner_id`
- RLS: SELECT/INSERT/UPDATE สำหรับ `authenticated` เมื่อ `owner_id = (select auth.uid())` ไม่มี policy DELETE, เพิกถอนสิทธิ์ทั้งหมดจาก `anon` และ DELETE จาก `authenticated`
- migration ในเครื่อง: `supabase/migrations/20260925000001_create_loans.sql`, `20260925000002_loans_rls.sql` (ตรงกับที่ apply แล้ว)
- วิธีตรวจ RLS ที่ใช้: `DO` block จำลองผู้ใช้ด้วย `set_config('request.jwt.claims', …)` + `set_config('role', …)` แล้วจบด้วย `raise exception` เพื่อย้อนกลับทุกอย่าง (ไม่ทิ้งข้อมูลทดสอบ)
- Performance Advisor มีแค่ INFO "unused index" ของ `loans_owner_id_idx` เพราะตารางยังว่าง ไม่ต้องแก้

## วิธีทดสอบในเบราว์เซอร์
dev server `npm run dev` ที่ http://localhost:5173/ (ต้องมี `.env.local`) เข้าสู่ระบบด้วยบัญชีเจ้าของ
- ทดสอบนำเข้าข้อมูลเดิม: ใส่ข้อมูลใน localStorage คีย์ `borrow-buddy:loans` แล้วรีเฟรช ถ้าจะให้แถบขึ้นใหม่ให้ลบคีย์ `borrow-buddy:imported`
- **ล้างข้อมูลทดสอบทุกครั้งหลังตรวจ** ทั้ง localStorage (`borrow-buddy:loans`, `borrow-buddy:imported`, `borrow-buddy:theme`) และแถวทดสอบในตาราง `loans` (ลบได้ผ่าน SQL ของผู้ดูแลเท่านั้น เพราะ RLS ไม่ให้ลบ) ถามผู้ใช้ก่อนลบข้อมูลใน Supabase

## โครงโค้ดปัจจุบัน
`src/lib` (ตรรกะล้วน มีเทสต์): `today` เป็นสตริง ISO `YYYY-MM-DD` ที่ส่งเข้าฟังก์ชันเสมอ ฟังก์ชันที่คุยกับ Supabase รับ `client` เป็นพารามิเตอร์
- `loanRules.js`: `STATUS`, `STATUS_LABEL`, `getLoanStatus`, `getDaysOverdue`, `validateLoan`, `groupLoans`, `filterLoansByFriend`, `markReturned`, `unmarkReturned`
- `supabaseClient.js`: `createSupabaseClient(env)` โยน `CONFIG_ERROR` เมื่อไม่มีค่า env
- `loanMapper.js`: `fromRow(row)`, `toRow(loan, { includeId })` (ไม่ส่ง `owner_id`)
- `loanRepo.js`: `fetchLoans`, `createLoan`, `updateLoan`, `importLoans` (upsert `ignoreDuplicates` ตาม `id`) คืน `{ loans | loan | inserted }` หรือ `{ error: { message, sessionExpired } }`
- `auth.js`: `signIn` (คืน null หรือข้อความไทย), `signOut` (scope `local`), `watchSession` (ได้เซสชันเดิมทันทีจาก INITIAL_SESSION), `toSignInMessage` ไม่มี `signUp`
- `legacyImport.js`: `findLegacyLoans`, `prepareImport` (คัดรายการผิดกติกา, id ไม่ใช่ UUID สร้างใหม่), `isImported`, `markImported` (คีย์ `borrow-buddy:imported`) ไม่ลบข้อมูลเดิม
- `storage.js`: (เวอร์ชัน 1) ตอนนี้ใช้แค่ `loadLoans` ผ่าน `legacyImport` ส่วน `saveLoans` ไม่ถูกใช้แล้วแต่ยังเก็บไว้พร้อมเทสต์
- `dateFormat.js`: `formatThaiDate(iso)`, `toIsoDate(date)` (วันที่ท้องถิ่น)
- `theme.js`: `getInitialTheme`, `saveTheme`, `toggleTheme`, `THEME` (คีย์ `borrow-buddy:theme` ยังอยู่ใน localStorage)

`src/components` (ไม่มีเทสต์ ตรวจด้วยมือในเบราว์เซอร์): `LoginForm`, `AccountBar`, `ImportBanner`, `LoanForm`, `LoanList`, `LoanItem`, `SearchBox`, `ThemeToggle`
- `LoanForm` และ `LoanItem`: `onSave` / `onMarkReturned` / `onUnmarkReturned` เป็น async คืน `null` หรือข้อความผิดพลาด ปิดปุ่มระหว่างรอ ไม่สำเร็จคงข้อมูลในฟอร์มไว้

`src/App.jsx`:
- `client` สร้างครั้งเดียวระดับโมดูล ถ้าไม่มี env แสดง `CONFIG_ERROR`
- `App`: state `session` (`undefined` = กำลังตรวจ, `null` = หน้าเข้าสู่ระบบ), `notice`, `theme` ธีมตั้งด้วย `useLayoutEffect` บน `data-theme` ของ `<html>`
- `OwnerHome` (ใน App.jsx) ใส่ `key={session.user.id}` ออกจากระบบ/เปลี่ยนบัญชีแล้ว state Loan ถูกล้างเอง อัปเดต state หลังเซิร์ฟเวอร์ตอบสำเร็จเท่านั้น (ไม่ optimistic) เซสชันหมดอายุเรียก `onSessionExpired` → ออกจากระบบ + แจ้งบนหน้าเข้าสู่ระบบ

## ข้อตัดสินใจและสิ่งที่ควรรู้
- `npm test` = `vitest run --passWithNoTests` (จบเองไม่ค้าง watch) มี `npm run test:watch` แยกไว้ให้
- วันที่เก็บเป็นสตริง ISO `YYYY-MM-DD` เทียบด้วยสตริงตรง ๆ ได้ ในฐานข้อมูลเป็นชนิด `date`
- ตรวจความถูกต้องสองชั้น: `validateLoan` ในแอป และ check constraint ในฐานข้อมูล
- เทสต์ใช้ storage / Supabase client จำลอง ไม่ต้องใช้ jsdom (Vitest ใช้สภาพแวดล้อม node)
- `.env.local` มี URL + publishable key (เปิดเผยได้ตามปกติของฝั่งเว็บ) และอยู่ใน `.gitignore` แล้ว
- `index.css` (ตัวแปรสี + ธีม `data-theme`) และ `App.css` (สไตล์ component) ถูกเขียนทับจากเทมเพลตแล้ว
- ไฟล์เทมเพลตที่ไม่ถูกใช้แล้ว แต่ยังอยู่: `src/assets/*` (`hero.png`, `react.svg`, `vite.svg`) และ `public/icons.svg` การลบต้องถามผู้ใช้ก่อน
- `package-lock.json` ถูก commit ไว้ ไม่ได้อยู่ใน `.gitignore`
- `src/components/.gitkeep` และ `src/lib/.gitkeep` เก็บไว้ ห้ามลบโดยไม่ถาม
- `oxlint` มากับเทมเพลต (`npm run lint`)
