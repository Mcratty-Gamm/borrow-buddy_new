// เข้า/ออกจากระบบด้วยอีเมล + รหัสผ่าน ไม่มีการสมัครสมาชิก (ไม่เรียก signUp)
// ทุกฟังก์ชันรับ client เป็นพารามิเตอร์ เพื่อทดสอบด้วย client จำลองได้

export const EMPTY_FIELDS_ERROR = 'กรุณากรอกอีเมลและรหัสผ่าน'
export const INVALID_CREDENTIALS_ERROR = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
export const NETWORK_ERROR = 'เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่'
export const SIGN_IN_ERROR = 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่'
export const SIGN_OUT_ERROR = 'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'

// ไม่บอกว่าอีเมลหรือรหัสผ่านผิดช่องไหน
export function toSignInMessage(error) {
  if (!error) return null
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return NETWORK_ERROR
  if (error.code === 'invalid_credentials' || error.status === 400) return INVALID_CREDENTIALS_ERROR
  return SIGN_IN_ERROR
}

// คืน null เมื่อสำเร็จ หรือข้อความผิดพลาดภาษาไทย
export async function signIn(client, email, password) {
  if (!email.trim() || !password) return EMPTY_FIELDS_ERROR
  try {
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    return toSignInMessage(error)
  } catch {
    return NETWORK_ERROR
  }
}

// ออกเฉพาะเบราว์เซอร์นี้ (scope local) ไม่ต้องพึ่งเน็ต
export async function signOut(client) {
  try {
    const { error } = await client.auth.signOut({ scope: 'local' })
    return error ? SIGN_OUT_ERROR : null
  } catch {
    return SIGN_OUT_ERROR
  }
}

// ติดตามเซสชัน: ได้เซสชันเดิมที่จำไว้ทันที (INITIAL_SESSION) และทุกครั้งที่เข้า/ออก/ต่ออายุ/หมดอายุ คืนฟังก์ชันเลิกติดตาม
// callback ต้องไม่เรียก client ต่อข้างใน (ตามคำแนะนำของ supabase-js)
export function watchSession(client, onChange) {
  const { data } = client.auth.onAuthStateChange((_event, session) => onChange(session ?? null))
  return () => data.subscription.unsubscribe()
}
