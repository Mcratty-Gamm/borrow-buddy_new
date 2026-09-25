import { describe, expect, it } from 'vitest'
import { IMPORTED_KEY, findLegacyLoans, isImported, markImported, prepareImport } from './legacyImport.js'
import { STORAGE_KEY } from './storage.js'

const memoryStorage = (initial = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
  }
}

const brokenStorage = () => ({
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
})

const uuid = '6f1c2b1e-8a47-4c5e-9d0a-2b7e3f4a5c6d'
const loan = {
  id: uuid,
  friendName: 'ต้น',
  itemName: 'ร่ม',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

describe('findLegacyLoans', () => {
  it('มีข้อมูลเดิมและยังไม่มีธง คืนรายการ', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify([loan]) })
    expect(findLegacyLoans(storage)).toEqual([loan])
  })

  it('ไม่มีข้อมูลเดิม คืนว่าง', () => {
    expect(findLegacyLoans(memoryStorage())).toEqual([])
  })

  it('มีธงแล้ว คืนว่าง', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify([loan]), [IMPORTED_KEY]: 'x' })
    expect(findLegacyLoans(storage)).toEqual([])
  })

  it('JSON เสีย คืนว่างและไม่เขียนทับข้อมูลเดิม', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{broken' })
    expect(findLegacyLoans(storage)).toEqual([])
    expect(storage.data[STORAGE_KEY]).toBe('{broken')
    expect(storage.data[IMPORTED_KEY]).toBeUndefined()
  })

  it('storage อ่านไม่ได้ คืนว่าง', () => {
    expect(findLegacyLoans(brokenStorage())).toEqual([])
  })
})

describe('isImported / markImported', () => {
  it('ตั้งธงแล้วอ่านได้ และไม่ลบข้อมูลเดิม', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify([loan]) })
    expect(isImported(storage)).toBe(false)
    markImported(storage)
    expect(isImported(storage)).toBe(true)
    expect(storage.data[STORAGE_KEY]).toBe(JSON.stringify([loan]))
  })

  it('storage เสียไม่ทำให้ล้ม', () => {
    expect(() => markImported(brokenStorage())).not.toThrow()
    expect(isImported(brokenStorage())).toBe(true)
  })
})

describe('prepareImport', () => {
  const newId = () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

  it('รายการถูกต้องคง id UUID เดิม', () => {
    expect(prepareImport([loan], newId)).toEqual({ valid: [loan], skipped: 0 })
  })

  it('id ไม่ใช่ UUID สร้างใหม่', () => {
    const { valid } = prepareImport([{ ...loan, id: 'kx1-abc' }], newId)
    expect(valid[0].id).toBe(newId())
  })

  it('ไม่มี id สร้างใหม่', () => {
    const { id: _id, ...noId } = loan
    expect(prepareImport([noId], newId).valid[0].id).toBe(newId())
  })

  it('ตัดช่องว่างชื่อ และ returnedDate ไม่มีเป็น null', () => {
    const { valid } = prepareImport([{ ...loan, friendName: ' ต้น ', returnedDate: undefined }], newId)
    expect(valid[0].friendName).toBe('ต้น')
    expect(valid[0].returnedDate).toBeNull()
  })

  it('ข้ามรายการผิดกติกาและนับจำนวน', () => {
    const bad = [
      { ...loan, friendName: '  ' },
      { ...loan, itemName: '' },
      { ...loan, dueDate: '2026-08-01' },
      { ...loan, returnedDate: '2026-08-01' },
      { ...loan, borrowedDate: 'ไม่ใช่วันที่' },
      { ...loan, friendName: 5 },
      null,
      'ข้อความ',
    ]
    expect(prepareImport([loan, ...bad], newId)).toEqual({ valid: [loan], skipped: bad.length })
  })

  it('ไม่แก้อาร์เรย์เดิม', () => {
    const input = [{ ...loan, id: 'old' }]
    prepareImport(input, newId)
    expect(input[0].id).toBe('old')
  })
})
