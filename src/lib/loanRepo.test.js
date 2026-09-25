import { describe, expect, it } from 'vitest'
import {
  INVALID_DATA_ERROR,
  LOAD_ERROR,
  SAVE_ERROR,
  SESSION_EXPIRED_ERROR,
  createLoan,
  fetchLoans,
  importLoans,
  updateLoan,
} from './loanRepo.js'

// client จำลอง: บันทึกทุกเมธอดที่เรียก และตอบด้วย response ที่กำหนด (หรือโยน error)
const fakeClient = (response) => {
  const calls = []
  const builder = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') {
          return (resolve, reject) =>
            response instanceof Error ? reject(response) : resolve(response)
        }
        return (...args) => {
          calls.push([prop, ...args])
          return builder
        }
      },
    },
  )
  return {
    calls,
    from: (table) => {
      calls.push(['from', table])
      return builder
    },
  }
}

const row = {
  id: '6f1c2b1e-8a47-4c5e-9d0a-2b7e3f4a5c6d',
  owner_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  friend_name: 'ต้น',
  item_name: 'ร่ม',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
}

const loan = {
  id: row.id,
  friendName: 'ต้น',
  itemName: 'ร่ม',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

const call = (client, name) => client.calls.find(([method]) => method === name)

describe('fetchLoans', () => {
  it('โหลดจากตาราง loans และแปลงเป็น Loan', async () => {
    const client = fakeClient({ data: [row], error: null, status: 200 })
    expect(await fetchLoans(client)).toEqual({ loans: [loan] })
    expect(call(client, 'from')).toEqual(['from', 'loans'])
  })

  it('ไม่กรอง owner เอง (ให้ RLS กรอง)', async () => {
    const client = fakeClient({ data: [], error: null, status: 200 })
    await fetchLoans(client)
    expect(call(client, 'eq')).toBeUndefined()
  })

  it('error คืนข้อความไทย', async () => {
    const client = fakeClient({ data: null, error: { code: 'XX000' }, status: 500 })
    expect(await fetchLoans(client)).toEqual({ error: { message: LOAD_ERROR, sessionExpired: false } })
  })

  it('เน็ตหลุด (โยน error) คืนข้อความไทย', async () => {
    const client = fakeClient(new TypeError('Failed to fetch'))
    expect((await fetchLoans(client)).error.message).toBe(LOAD_ERROR)
  })

  it('JWT หมดอายุ บอกว่าเซสชันหมดอายุ', async () => {
    const client = fakeClient({ data: null, error: { code: 'PGRST303' }, status: 401 })
    expect(await fetchLoans(client)).toEqual({
      error: { message: SESSION_EXPIRED_ERROR, sessionExpired: true },
    })
  })
})

describe('createLoan', () => {
  it('insert โดยไม่ส่ง id และ owner_id แล้วคืน Loan จากเซิร์ฟเวอร์', async () => {
    const client = fakeClient({ data: row, error: null, status: 201 })
    const { id: _id, ...draft } = loan
    expect(await createLoan(client, draft)).toEqual({ loan })
    const [, sent] = call(client, 'insert')
    expect(sent).not.toHaveProperty('id')
    expect(sent).not.toHaveProperty('owner_id')
    expect(sent.friend_name).toBe('ต้น')
  })

  it('ถูก check constraint ปฏิเสธ คืนข้อความไทยเฉพาะ', async () => {
    const client = fakeClient({ data: null, error: { code: '23514' }, status: 400 })
    expect((await createLoan(client, loan)).error.message).toBe(INVALID_DATA_ERROR)
  })

  it('error อื่นคืนข้อความบันทึกไม่สำเร็จ', async () => {
    const client = fakeClient({ data: null, error: { code: '' }, status: 0 })
    expect((await createLoan(client, loan)).error.message).toBe(SAVE_ERROR)
  })
})

describe('updateLoan', () => {
  it('update ตาม id โดยไม่ส่ง id และ owner_id ในข้อมูล', async () => {
    const client = fakeClient({ data: { ...row, returned_date: '2026-09-10' }, error: null, status: 200 })
    const result = await updateLoan(client, { ...loan, returnedDate: '2026-09-10' })
    expect(result.loan.returnedDate).toBe('2026-09-10')
    expect(call(client, 'eq')).toEqual(['eq', 'id', loan.id])
    const [, sent] = call(client, 'update')
    expect(sent).not.toHaveProperty('id')
    expect(sent).not.toHaveProperty('owner_id')
  })

  it('ไม่พบแถว (เช่นไม่ใช่ของตัวเอง) คืนข้อความบันทึกไม่สำเร็จ', async () => {
    const client = fakeClient({ data: null, error: { code: 'PGRST116' }, status: 406 })
    expect((await updateLoan(client, loan)).error.message).toBe(SAVE_ERROR)
  })
})

describe('importLoans', () => {
  it('upsert เป็น batch เดียวด้วย id เดิม และข้าม id ซ้ำ', async () => {
    const client = fakeClient({ data: [{ id: loan.id }], error: null, status: 201 })
    expect(await importLoans(client, [loan])).toEqual({ inserted: 1 })
    const [, rows, options] = call(client, 'upsert')
    expect(rows).toEqual([expect.objectContaining({ id: loan.id, friend_name: 'ต้น' })])
    expect(rows[0]).not.toHaveProperty('owner_id')
    expect(options).toEqual({ onConflict: 'id', ignoreDuplicates: true })
  })

  it('รายการว่างไม่เรียกเซิร์ฟเวอร์', async () => {
    const client = fakeClient({ data: [], error: null })
    expect(await importLoans(client, [])).toEqual({ inserted: 0 })
    expect(client.calls).toEqual([])
  })

  it('error คืนข้อความไทย', async () => {
    const client = fakeClient({ data: null, error: { code: 'XX000' }, status: 500 })
    expect((await importLoans(client, [loan])).error.message).toBe(SAVE_ERROR)
  })
})
