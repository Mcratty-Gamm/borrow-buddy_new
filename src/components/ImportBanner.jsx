// แถบเสนอนำเข้าข้อมูลเดิมจาก localStorage (แสดงเฉพาะเมื่อมีข้อมูลเดิมและยังไม่มีธง)
export default function ImportBanner({ count, busy, onImport, onDismiss }) {
  return (
    <section className="import-banner" aria-label="นำเข้าข้อมูลเดิม">
      <p>
        พบข้อมูลเดิมในเบราว์เซอร์นี้ {count} รายการ ต้องการนำเข้าเป็นการยืมของบัญชีนี้หรือไม่
        (ข้อมูลเดิมในเครื่องจะไม่ถูกลบ)
      </p>
      <div className="form-actions">
        <button type="button" className="primary" disabled={busy} onClick={onImport}>
          {busy ? 'กำลังนำเข้า…' : 'นำเข้า'}
        </button>
        <button type="button" disabled={busy} onClick={onDismiss}>
          ไม่นำเข้า
        </button>
      </div>
    </section>
  )
}
