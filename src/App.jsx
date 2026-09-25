import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import './App.css'
import AccountBar from './components/AccountBar.jsx'
import ImportBanner from './components/ImportBanner.jsx'
import LoanForm from './components/LoanForm.jsx'
import LoanList from './components/LoanList.jsx'
import LoginForm from './components/LoginForm.jsx'
import SearchBox from './components/SearchBox.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { signIn, signOut, watchSession } from './lib/auth.js'
import { toIsoDate } from './lib/dateFormat.js'
import { findLegacyLoans, markImported, prepareImport } from './lib/legacyImport.js'
import {
  SESSION_EXPIRED_ERROR,
  createLoan,
  fetchLoans,
  importLoans,
  updateLoan,
} from './lib/loanRepo.js'
import { filterLoansByFriend, markReturned, unmarkReturned } from './lib/loanRules.js'
import { createSupabaseClient } from './lib/supabaseClient.js'
import { getInitialTheme, saveTheme, toggleTheme } from './lib/theme.js'

// สร้าง client ครั้งเดียว ถ้าไม่มีค่า env ให้แสดงข้อความแทนหน้าเว็บ
let client = null
let configError = null
try {
  client = createSupabaseClient()
} catch (e) {
  configError = e.message
}

function App() {
  const [theme, setTheme] = useState(() =>
    getInitialTheme(undefined, window.matchMedia('(prefers-color-scheme: dark)').matches),
  )
  // undefined = กำลังตรวจเซสชันเดิม, null = ยังไม่เข้าสู่ระบบ
  const [session, setSession] = useState(undefined)
  const [notice, setNotice] = useState(null)
  const [signOutError, setSignOutError] = useState(null)

  // ตั้งธีมให้ <html> ก่อนวาดหน้าจอ เพื่อไม่ให้จอกะพริบ
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // เซสชันเดิมมาทันทีตอนเริ่มติดตาม และทุกครั้งที่เข้า/ออก/ต่ออายุ/หมดอายุ
  useEffect(() => {
    if (!client) return undefined
    return watchSession(client, setSession)
  }, [])

  const handleToggleTheme = () => {
    const next = toggleTheme(theme)
    setTheme(next)
    saveTheme(next)
  }

  const handleSignIn = (email, password) => {
    setNotice(null)
    return signIn(client, email, password)
  }

  const handleSignOut = async () => {
    setSignOutError(await signOut(client))
  }

  const handleSessionExpired = useCallback(async () => {
    await signOut(client)
    setNotice(SESSION_EXPIRED_ERROR)
  }, [])

  let content
  if (configError) {
    content = <p role="alert">{configError}</p>
  } else if (session === undefined) {
    content = <p>กำลังตรวจสอบการเข้าสู่ระบบ…</p>
  } else if (session === null) {
    content = <LoginForm notice={notice} onSignIn={handleSignIn} />
  } else {
    // key ตามบัญชี: ออกจากระบบ/เปลี่ยนบัญชีแล้ว Loan เดิมถูกล้างออกจาก state ทันที
    content = (
      <OwnerHome key={session.user.id} onSessionExpired={handleSessionExpired} />
    )
  }

  return (
    <main>
      <header className="app-header">
        <h1>Borrow Buddy</h1>
        <div className="header-actions">
          {session && <AccountBar email={session.user.email} onSignOut={handleSignOut} />}
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>
      </header>
      {signOutError && session && <p role="alert">{signOutError}</p>}
      {content}
    </main>
  )
}

// หน้าหลักของเจ้าของที่เข้าสู่ระบบแล้ว
// อัปเดต state หลังเซิร์ฟเวอร์ตอบสำเร็จเท่านั้น ใช้แถวที่เซิร์ฟเวอร์ส่งกลับ
function OwnerHome({ onSessionExpired }) {
  const [loans, setLoans] = useState(null) // null = กำลังโหลด
  const [loadError, setLoadError] = useState(null)
  const [reloadCount, setReloadCount] = useState(0)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [legacyLoans, setLegacyLoans] = useState(() => findLegacyLoans())
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null) // { text, isError }

  const today = toIsoDate(new Date())

  useEffect(() => {
    let active = true
    fetchLoans(client).then((res) => {
      if (!active) return
      if (res.error) {
        setLoadError(res.error.message)
        if (res.error.sessionExpired) onSessionExpired()
      } else {
        setLoans(res.loans)
        setLoadError(null)
      }
    })
    return () => {
      active = false
    }
  }, [reloadCount, onSessionExpired])

  // คืนข้อความผิดพลาด และพากลับหน้าเข้าสู่ระบบถ้าเซสชันหมดอายุ
  const fail = (error) => {
    if (error.sessionExpired) onSessionExpired()
    return error.message
  }

  const putLoan = (saved) =>
    setLoans((prev) => {
      const exists = prev.some((l) => l.id === saved.id)
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [...prev, saved]
    })

  // Loan ที่ยังไม่มี id คือเพิ่มใหม่ ถ้ามี id คือแก้ไขรายการเดิม
  const handleSave = async (loan) => {
    const res = loan.id ? await updateLoan(client, loan) : await createLoan(client, loan)
    if (res.error) return fail(res.error)
    putLoan(res.loan)
    if (loan.id) setEditingId(null)
    return null
  }

  const replaceLoan = async (updated) => {
    const res = await updateLoan(client, updated)
    if (res.error) return fail(res.error)
    putLoan(res.loan)
    return null
  }

  const handleMarkReturned = (loan, returnedDate) =>
    replaceLoan(markReturned(loan, today, returnedDate))

  const handleUnmarkReturned = (loan) => replaceLoan(unmarkReturned(loan))

  const handleImport = async () => {
    const { valid, skipped } = prepareImport(legacyLoans)
    setImporting(true)
    const res = await importLoans(client, valid)
    setImporting(false)
    if (res.error) {
      setImportResult({ text: `นำเข้าข้อมูลเดิมไม่สำเร็จ: ${fail(res.error)}`, isError: true })
      return
    }
    markImported()
    setLegacyLoans([])
    const existing = valid.length - res.inserted
    const parts = [`นำเข้าข้อมูลเดิมแล้ว ${res.inserted} รายการ`]
    if (existing > 0) parts.push(`มีอยู่แล้ว ${existing} รายการ`)
    if (skipped > 0) parts.push(`ข้ามรายการที่ผิดกติกา ${skipped} รายการ`)
    setImportResult({ text: parts.join(', '), isError: false })
    setReloadCount((n) => n + 1)
  }

  const handleDismissImport = () => {
    markImported()
    setLegacyLoans([])
    setImportResult(null)
  }

  const handleRetryLoad = () => {
    setLoadError(null)
    setReloadCount((n) => n + 1)
  }

  const editingLoan = loans?.find((loan) => loan.id === editingId) ?? null

  let list
  if (loadError) {
    list = (
      <div className="load-error">
        <p role="alert">{loadError}</p>
        <button type="button" onClick={handleRetryLoad}>
          ลองใหม่
        </button>
      </div>
    )
  } else if (loans === null) {
    list = <p>กำลังโหลดรายการ…</p>
  } else {
    list = (
      <LoanList
        loans={filterLoansByFriend(loans, query)}
        today={today}
        onMarkReturned={handleMarkReturned}
        onUnmarkReturned={handleUnmarkReturned}
        onEdit={(loan) => setEditingId(loan.id)}
      />
    )
  }

  return (
    <>
      {legacyLoans.length > 0 && (
        <ImportBanner
          count={legacyLoans.length}
          busy={importing}
          onImport={handleImport}
          onDismiss={handleDismissImport}
        />
      )}
      {importResult &&
        (importResult.isError ? (
          <p role="alert">{importResult.text}</p>
        ) : (
          <p role="status" className="notice">
            {importResult.text}
          </p>
        ))}
      <LoanForm
        key={editingLoan?.id ?? 'new'}
        today={today}
        editingLoan={editingLoan}
        onSave={handleSave}
        onCancelEdit={() => setEditingId(null)}
      />
      <SearchBox value={query} onChange={setQuery} />
      {list}
    </>
  )
}

export default App
