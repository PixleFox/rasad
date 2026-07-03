import { useState } from 'react'
import { ClipboardCheck, Download, LockKeyhole, LogIn, Phone } from 'lucide-react'

export default function AdminLeads() {
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' })
  const [rows, setRows] = useState([])
  const [assessments, setAssessments] = useState([])
  const [tab, setTab] = useState('phones')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const login = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = btoa(`${credentials.username}:${credentials.password}`)
      const headers = { Authorization: `Basic ${token}` }
      const [leadResponse, riskResponse] = await Promise.all([
        fetch('/api/export-leads/admin', { headers }),
        fetch('/api/risk-assessments/admin', { headers }),
      ])
      if (!leadResponse.ok || !riskResponse.ok) throw new Error('نام کاربری یا رمز اشتباه است.')
      setRows((await leadResponse.json()).rows || [])
      setAssessments((await riskResponse.json()).rows || [])
      setLoggedIn(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    const lines = tab === 'phones'
      ? [['شماره موبایل', 'تعداد خروجی', 'تاریخ ثبت', 'آخرین خروجی'], ...rows.map((row) => [row.phone, row.export_count, row.created_at, row.last_export_at])]
      : [['نام', 'شماره موبایل', 'سن', 'جنسیت', 'امتیاز', 'کد تیپ', 'عنوان تیپ', 'تاریخ'], ...assessments.map((row) => [row.name, row.phone, row.age, row.gender, row.score, row.profile_code, row.profile_title, row.created_at])]
    const csv = lines.map((line) => line.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = tab === 'phones' ? 'rasad-phone-leads.csv' : 'rasad-risk-assessments.csv'; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen px-4 pb-20 pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-lg bg-neon-cyan/10 text-neon-cyan">{tab === 'phones' ? <Phone size={21} /> : <ClipboardCheck size={21} />}</span><div><h1 className="text-2xl text-white" style={{ fontWeight: 900 }}>داده‌های کاربران</h1><p className="text-xs text-text-muted">خروجی‌ها و آزمون‌های ریسک‌پذیری</p></div></div>
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
            <div className="flex flex-col gap-3 border-b border-neon-cyan/10 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-1 rounded-lg bg-space/70 p-1"><button onClick={() => setTab('phones')} className={`rounded-md px-3 py-2 text-xs ${tab === 'phones' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-text-muted'}`}>خروجی‌های اکسل ({rows.length})</button><button onClick={() => setTab('risk')} className={`rounded-md px-3 py-2 text-xs ${tab === 'risk' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-text-muted'}`}>آزمون ریسک ({assessments.length})</button></div><button onClick={exportCsv} className="flex items-center justify-center gap-2 rounded-lg bg-neon-green/10 px-3 py-2 text-xs text-neon-green"><Download size={15} />خروجی اکسل</button></div>
            {tab === 'phones' ? (
              <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="text-text-muted"><tr><th className="p-3 text-right">شماره موبایل</th><th>تعداد خروجی</th><th>تاریخ ثبت</th><th>آخرین خروجی</th></tr></thead><tbody>{rows.map((row) => <tr key={row.phone} className="border-t border-white/5"><td className="p-3 text-right text-white" dir="ltr">{row.phone}</td><td className="text-center">{row.export_count}</td><td className="text-center text-xs text-text-muted">{new Date(row.created_at).toLocaleString('fa-IR')}</td><td className="text-center text-xs text-text-muted">{row.last_export_at ? new Date(row.last_export_at).toLocaleString('fa-IR') : '—'}</td></tr>)}</tbody></table></div>
            ) : (
              <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-sm"><thead className="text-text-muted"><tr><th className="p-3 text-right">نام</th><th>موبایل</th><th>سن</th><th>جنسیت</th><th>امتیاز</th><th>تیپ</th><th>تاریخ</th></tr></thead><tbody>{assessments.map((row) => <tr key={row.id} className="border-t border-white/5"><td className="p-3 text-right text-white">{row.name}</td><td className="text-center" dir="ltr">{row.phone}</td><td className="text-center">{row.age}</td><td className="text-center">{row.gender}</td><td className="text-center text-neon-green" style={{ fontWeight: 900 }}>{row.score}</td><td className="text-center"><span className="text-neon-cyan">{row.profile_code}</span> · {row.profile_title}</td><td className="text-center text-xs text-text-muted">{new Date(row.created_at).toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
