import { useState } from 'react'
import { Download, LockKeyhole, LogIn, Phone } from 'lucide-react'

export default function AdminLeads() {
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' })
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const login = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = btoa(`${credentials.username}:${credentials.password}`)
      const response = await fetch('/api/export-leads/admin', { headers: { Authorization: `Basic ${token}` } })
      if (!response.ok) throw new Error('نام کاربری یا رمز اشتباه است.')
      setRows((await response.json()).rows || [])
      setLoggedIn(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    const lines = [['شماره موبایل', 'تعداد خروجی', 'تاریخ ثبت', 'آخرین خروجی'], ...rows.map((row) => [row.phone, row.export_count, row.created_at, row.last_export_at])]
    const csv = lines.map((line) => line.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'rasad-phone-leads.csv'; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen px-4 pb-20 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-lg bg-neon-cyan/10 text-neon-cyan"><Phone size={21} /></span><div><h1 className="text-2xl text-white" style={{ fontWeight: 900 }}>شماره‌های ثبت‌شده</h1><p className="text-xs text-text-muted">مدیریت کاربران خروجی اکسل</p></div></div>
        {!loggedIn ? (
          <form onSubmit={login} className="max-w-sm rounded-xl border border-neon-cyan/10 bg-surface/50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm text-text-muted"><LockKeyhole size={17} />ورود مدیر</div>
            <input value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} placeholder="نام کاربری" className="mb-3 h-11 w-full rounded-lg border border-neon-cyan/15 bg-space px-3 text-sm outline-none" dir="ltr" />
            <input type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} placeholder="رمز عبور" className="h-11 w-full rounded-lg border border-neon-cyan/15 bg-space px-3 text-sm outline-none" dir="ltr" />
            {error && <p className="mt-2 text-xs text-neon-pink">{error}</p>}
            <button disabled={loading} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-neon-cyan text-space" style={{ fontWeight: 900 }}><LogIn size={17} />{loading ? 'در حال ورود...' : 'ورود'}</button>
          </form>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neon-cyan/10 bg-surface/40">
            <div className="flex items-center justify-between gap-3 border-b border-neon-cyan/10 p-3"><span className="text-sm text-text-muted">{rows.length} شماره یکتا</span><button onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-neon-green/10 px-3 py-2 text-xs text-neon-green"><Download size={15} />خروجی اکسل</button></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="text-text-muted"><tr><th className="p-3 text-right">شماره موبایل</th><th>تعداد خروجی</th><th>تاریخ ثبت</th><th>آخرین خروجی</th></tr></thead><tbody>{rows.map((row) => <tr key={row.phone} className="border-t border-white/5"><td className="p-3 text-right text-white" dir="ltr">{row.phone}</td><td className="text-center">{row.export_count}</td><td className="text-center text-xs text-text-muted">{new Date(row.created_at).toLocaleString('fa-IR')}</td><td className="text-center text-xs text-text-muted">{row.last_export_at ? new Date(row.last_export_at).toLocaleString('fa-IR') : '—'}</td></tr>)}</tbody></table></div>
          </div>
        )}
      </div>
    </main>
  )
}
