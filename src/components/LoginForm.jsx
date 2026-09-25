import { useState } from 'react'

// หน้าเข้าสู่ระบบ: อีเมล + รหัสผ่าน ไม่มีลิงก์สมัครสมาชิก
// onSignIn คืน null เมื่อสำเร็จ หรือข้อความผิดพลาดภาษาไทย
export default function LoginForm({ notice, onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const message = await onSignIn(email, password)
    // สำเร็จแล้วหน้านี้จะถูกแทนด้วยหน้าหลัก
    if (message) {
      setError(message)
      setBusy(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <h2>เข้าสู่ระบบ</h2>
      {notice && !error && <p className="notice">{notice}</p>}

      <label>
        อีเมล
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        รหัสผ่าน
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {error && (
        <ul role="alert">
          <li>{error}</li>
        </ul>
      )}

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>
      </div>
    </form>
  )
}
