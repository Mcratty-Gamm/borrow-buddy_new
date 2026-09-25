// แปลงแถวตาราง loans (snake_case) ↔ Loan ในแอป (camelCase) ที่เดียว
// owner_id ไม่ถูกส่งออกจากแอป ให้ฐานข้อมูลใส่เองด้วย auth.uid()

export function fromRow(row) {
  return {
    id: row.id,
    friendName: row.friend_name,
    itemName: row.item_name,
    borrowedDate: row.borrowed_date,
    dueDate: row.due_date,
    returnedDate: row.returned_date ?? null,
  }
}

// ไม่ใส่ id (ให้ฐานข้อมูลสร้าง/ใช้ .eq('id') แยก) ยกเว้นขอไว้ตอนนำเข้าข้อมูลเดิม
export function toRow(loan, { includeId = false } = {}) {
  const row = {
    friend_name: loan.friendName,
    item_name: loan.itemName,
    borrowed_date: loan.borrowedDate,
    due_date: loan.dueDate,
    returned_date: loan.returnedDate ?? null,
  }
  return includeId ? { id: loan.id, ...row } : row
}
