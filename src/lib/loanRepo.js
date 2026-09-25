import { fromRow, toRow } from './loanMapper.js'

export const TABLE = 'loans'

export const LOAD_ERROR = 'โหลดรายการไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่'
export const SAVE_ERROR = 'บันทึกไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่'
export const INVALID_DATA_ERROR = 'ฐานข้อมูลปฏิเสธการบันทึก: ชื่อเพื่อน/ของห้ามว่าง และวันที่ต้องไม่ก่อนวันที่ยืม'
export const SESSION_EXPIRED_ERROR = 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง'

// Postgres: 23514 = check_violation, 23502 = not_null_violation
// PostgREST: PGRST301/PGRST303 = JWT ใช้ไม่ได้/หมดอายุ
function toError(res, fallback) {
  const code = res?.error?.code
  if (res?.status === 401 || code === 'PGRST301' || code === 'PGRST303') {
    return { message: SESSION_EXPIRED_ERROR, sessionExpired: true }
  }
  if (code === '23514' || code === '23502') return { message: INVALID_DATA_ERROR, sessionExpired: false }
  return { message: fallback, sessionExpired: false }
}

// ทุกฟังก์ชันรับ client เป็นพารามิเตอร์ และคืน { ... } หรือ { error: { message, sessionExpired } }
// ไม่ต้องกรอง owner เอง RLS กรองให้เฉพาะ Loan ของเจ้าของที่เข้าสู่ระบบอยู่
async function run(query, fallback) {
  try {
    const res = await query
    if (res.error) return { error: toError(res, fallback) }
    return { data: res.data }
  } catch {
    return { error: toError(null, fallback) }
  }
}

export async function fetchLoans(client) {
  const { data, error } = await run(
    client.from(TABLE).select('*').order('due_date', { ascending: true }),
    LOAD_ERROR,
  )
  return error ? { error } : { loans: data.map(fromRow) }
}

export async function createLoan(client, loan) {
  const { data, error } = await run(client.from(TABLE).insert(toRow(loan)).select().single(), SAVE_ERROR)
  return error ? { error } : { loan: fromRow(data) }
}

export async function updateLoan(client, loan) {
  const { data, error } = await run(
    client.from(TABLE).update(toRow(loan)).eq('id', loan.id).select().single(),
    SAVE_ERROR,
  )
  return error ? { error } : { loan: fromRow(data) }
}

// นำเข้าข้อมูลเดิมเป็น batch เดียว id ซ้ำถูกข้าม (ON CONFLICT DO NOTHING) จึงกดซ้ำได้
// คืนจำนวนแถวที่เพิ่มจริง
export async function importLoans(client, loans) {
  if (loans.length === 0) return { inserted: 0 }
  const rows = loans.map((loan) => toRow(loan, { includeId: true }))
  const { data, error } = await run(
    client.from(TABLE).upsert(rows, { onConflict: 'id', ignoreDuplicates: true }).select('id'),
    SAVE_ERROR,
  )
  return error ? { error } : { inserted: data.length }
}
