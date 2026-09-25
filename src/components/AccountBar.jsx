// แถบบัญชี: อีเมลของเจ้าของที่เข้าสู่ระบบอยู่ + ปุ่มออกจากระบบ
export default function AccountBar({ email, onSignOut }) {
  return (
    <div className="account-bar">
      <span className="account-email">{email}</span>
      <button type="button" onClick={onSignOut}>
        ออกจากระบบ
      </button>
    </div>
  )
}
