import { describe, expect, it, vi } from 'vitest'
import {
  EMPTY_FIELDS_ERROR,
  INVALID_CREDENTIALS_ERROR,
  NETWORK_ERROR,
  SIGN_IN_ERROR,
  SIGN_OUT_ERROR,
  signIn,
  signOut,
  toSignInMessage,
  watchSession,
} from './auth.js'

const fakeAuth = (auth) => ({ auth })

describe('toSignInMessage', () => {
  it('ไม่มี error คืน null', () => {
    expect(toSignInMessage(null)).toBeNull()
  })

  it('อีเมล/รหัสผ่านผิด คืนข้อความกลาง ๆ', () => {
    expect(toSignInMessage({ name: 'AuthApiError', status: 400, code: 'invalid_credentials' })).toBe(
      INVALID_CREDENTIALS_ERROR,
    )
  })

  it('เชื่อมต่อไม่ได้', () => {
    expect(toSignInMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(NETWORK_ERROR)
  })

  it('error อื่น', () => {
    expect(toSignInMessage({ name: 'AuthApiError', status: 500 })).toBe(SIGN_IN_ERROR)
  })
})

describe('signIn', () => {
  it('ช่องว่างไม่เรียกเซิร์ฟเวอร์', async () => {
    const signInWithPassword = vi.fn()
    const client = fakeAuth({ signInWithPassword })
    expect(await signIn(client, '  ', 'x')).toBe(EMPTY_FIELDS_ERROR)
    expect(await signIn(client, 'a@b.c', '')).toBe(EMPTY_FIELDS_ERROR)
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('สำเร็จคืน null และตัดช่องว่างอีเมล', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null })
    expect(await signIn(fakeAuth({ signInWithPassword }), ' a@b.c ', 'pw')).toBeNull()
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' })
  })

  it('ผิดคืนข้อความไทย', async () => {
    const signInWithPassword = vi
      .fn()
      .mockResolvedValue({ data: {}, error: { status: 400, code: 'invalid_credentials' } })
    expect(await signIn(fakeAuth({ signInWithPassword }), 'a@b.c', 'pw')).toBe(INVALID_CREDENTIALS_ERROR)
  })

  it('โยน error คืนข้อความเชื่อมต่อไม่ได้', async () => {
    const signInWithPassword = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    expect(await signIn(fakeAuth({ signInWithPassword }), 'a@b.c', 'pw')).toBe(NETWORK_ERROR)
  })
})

describe('signOut', () => {
  it('ออกเฉพาะเบราว์เซอร์นี้', async () => {
    const fn = vi.fn().mockResolvedValue({ error: null })
    expect(await signOut(fakeAuth({ signOut: fn }))).toBeNull()
    expect(fn).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('ไม่สำเร็จคืนข้อความไทย', async () => {
    const fn = vi.fn().mockResolvedValue({ error: { status: 500 } })
    expect(await signOut(fakeAuth({ signOut: fn }))).toBe(SIGN_OUT_ERROR)
  })
})

describe('watchSession', () => {
  it('ส่ง session ให้ callback และเลิกติดตามได้', () => {
    const unsubscribe = vi.fn()
    let handler
    const onAuthStateChange = vi.fn((cb) => {
      handler = cb
      return { data: { subscription: { unsubscribe } } }
    })
    const onChange = vi.fn()
    const stop = watchSession(fakeAuth({ onAuthStateChange }), onChange)
    handler('SIGNED_OUT', null)
    expect(onChange).toHaveBeenCalledWith(null)
    stop()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
