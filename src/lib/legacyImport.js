import { validateLoan } from './loanRules.js'
import { loadLoans } from './storage.js'

// ธงว่าเครื่องนี้นำเข้าหรือเลือกไม่นำเข้าข้อมูลเดิมแล้ว (แถบจะไม่ขึ้นอีก)
export const IMPORTED_KEY = 'borrow-buddy:imported'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const isIsoDate = (value) => typeof value === 'string' && ISO_DATE_RE.test(value)

export function isImported(storage = globalThis.localStorage) {
  try {
    return storage.getItem(IMPORTED_KEY) !== null
  } catch {
    // อ่านไม่ได้ ถือว่านำเข้าแล้ว เพื่อไม่ให้แถบขึ้นซ้ำไม่รู้จบ
    return true
  }
}

export function markImported(storage = globalThis.localStorage) {
  try {
    storage.setItem(IMPORTED_KEY, new Date().toISOString())
  } catch {
    // จำไม่ได้ก็ไม่เป็นไร upsert ข้าม id ซ้ำอยู่แล้ว
  }
}

// ข้อมูลเดิมที่ควรเสนอให้นำเข้า: ยังไม่มีธง, อ่านได้, มีอย่างน้อย 1 รายการ
// JSON เสียคืนรายการว่าง (ไม่แสดงแถบ) อ่านอย่างเดียว ไม่แตะข้อมูลเดิม
export function findLegacyLoans(storage = globalThis.localStorage) {
  if (isImported(storage)) return []
  const { loans, warning } = loadLoans(storage)
  return warning ? [] : loans
}

// คัดรายการที่ผิดกติกาออก และให้ id เป็น UUID เสมอ (ถ้า id เดิมไม่ใช่ UUID สร้างใหม่)
export function prepareImport(loans, createId = () => globalThis.crypto.randomUUID()) {
  const valid = []
  let skipped = 0
  for (const loan of loans) {
    const ok =
      loan !== null &&
      typeof loan === 'object' &&
      typeof loan.friendName === 'string' &&
      typeof loan.itemName === 'string' &&
      isIsoDate(loan.borrowedDate) &&
      isIsoDate(loan.dueDate) &&
      (loan.returnedDate == null || isIsoDate(loan.returnedDate)) &&
      validateLoan(loan).length === 0
    if (!ok) {
      skipped += 1
      continue
    }
    valid.push({
      id: typeof loan.id === 'string' && UUID_RE.test(loan.id) ? loan.id : createId(),
      friendName: loan.friendName.trim(),
      itemName: loan.itemName.trim(),
      borrowedDate: loan.borrowedDate,
      dueDate: loan.dueDate,
      returnedDate: loan.returnedDate ?? null,
    })
  }
  return { valid, skipped }
}
