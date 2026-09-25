import { createClient } from '@supabase/supabase-js'

export const CONFIG_ERROR =
  'ยังไม่ได้ตั้งค่าการเชื่อมต่อฐานข้อมูล กรุณาใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY ใน .env.local'

// env รับเป็นพารามิเตอร์ เพื่อให้ทดสอบกรณีไม่มีค่าได้
// ใช้เฉพาะ publishable key ห้ามใช้ service_role / secret key ฝั่งเว็บ
export function createSupabaseClient(env = import.meta.env) {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) throw new Error(CONFIG_ERROR)
  return createClient(url, key)
}
