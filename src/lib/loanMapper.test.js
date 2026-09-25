import { describe, expect, it } from 'vitest'
import { fromRow, toRow } from './loanMapper.js'

const row = {
  id: '6f1c2b1e-8a47-4c5e-9d0a-2b7e3f4a5c6d',
  owner_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  friend_name: 'ต้น',
  item_name: 'ร่มสีฟ้า',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: '2026-09-20',
  created_at: '2026-09-01T10:00:00+00:00',
}

const loan = {
  id: row.id,
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: '2026-09-20',
}

describe('fromRow', () => {
  it('แปลงแถวเป็น Loan ครบทุกฟิลด์ และไม่มี owner_id', () => {
    expect(fromRow(row)).toEqual(loan)
  })

  it('returned_date null เป็น null', () => {
    expect(fromRow({ ...row, returned_date: null }).returnedDate).toBeNull()
  })
})

describe('toRow', () => {
  it('แปลง Loan เป็นแถว ไม่มี id และ owner_id', () => {
    expect(toRow(loan)).toEqual({
      friend_name: 'ต้น',
      item_name: 'ร่มสีฟ้า',
      borrowed_date: '2026-09-01',
      due_date: '2026-09-24',
      returned_date: '2026-09-20',
    })
  })

  it('returnedDate ไม่มีค่าส่งเป็น null', () => {
    expect(toRow({ ...loan, returnedDate: undefined }).returned_date).toBeNull()
  })

  it('includeId ใส่ id เดิม', () => {
    expect(toRow(loan, { includeId: true }).id).toBe(loan.id)
  })

  it('แปลงไป-กลับได้ค่าเดิม', () => {
    expect(fromRow(toRow(loan, { includeId: true }))).toEqual(loan)
  })
})
