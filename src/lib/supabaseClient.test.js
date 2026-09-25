import { describe, expect, it } from 'vitest'
import { CONFIG_ERROR, createSupabaseClient } from './supabaseClient.js'

describe('createSupabaseClient', () => {
  it('แจ้งข้อความชัดเมื่อไม่มี URL', () => {
    expect(() => createSupabaseClient({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toThrow(
      CONFIG_ERROR,
    )
  })

  it('แจ้งข้อความชัดเมื่อไม่มี key หรือเป็นช่องว่าง', () => {
    expect(() =>
      createSupabaseClient({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: ' ' }),
    ).toThrow(CONFIG_ERROR)
  })

  it('สร้าง client ได้เมื่อมีค่าครบ', () => {
    const client = createSupabaseClient({
      VITE_SUPABASE_URL: 'https://x.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
    })
    expect(typeof client.from).toBe('function')
    expect(typeof client.auth.signInWithPassword).toBe('function')
  })
})
