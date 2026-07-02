import { useState } from 'react'
import { Download, Phone, X } from 'lucide-react'
import { isValidIranianMobile, normalizePhone } from '../lib/exportLeads'

export default function PhoneCaptureModal({ open, busy, onClose, onSubmit }) {
  const [phone, setPhone] = useState('')
  const [touched, setTouched] = useState(false)
  if (!open) return null
  const valid = isValidIranianMobile(phone)

  const submit = (event) => {
    event.preventDefault()
    setTouched(true)
    if (valid) onSubmit(normalizePhone(phone))
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" dir="rtl">
      <div className="w-full rounded-t-xl border border-neon-cyan/15 bg-surface p-5 shadow-2xl sm:max-w-sm sm:rounded-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-neon-green/10 text-neon-green"><Download size={20} /></span>
            <div><h2 className="text-base text-white" style={{ fontWeight: 900 }}>دریافت خروجی اکسل</h2><p className="mt-1 text-xs text-text-muted">برای دریافت فایل، شماره موبایل را وارد کنید.</p></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-white/5" aria-label="بستن"><X size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <label className="relative block">
            <Phone size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input autoFocus inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} onBlur={() => setTouched(true)} placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷" className={`h-12 w-full rounded-lg border bg-space/70 pr-10 pl-3 text-left text-sm text-white outline-none ${touched && !valid ? 'border-neon-pink/60' : 'border-neon-cyan/20 focus:border-neon-cyan/60'}`} dir="ltr" />
          </label>
          {touched && !valid && <p className="mt-2 text-xs text-neon-pink">شماره موبایل معتبر وارد کنید.</p>}
          <p className="mt-3 text-[0.68rem] leading-5 text-text-muted">با ثبت شماره، با ذخیره آن برای ارائه خدمات و پیگیری خروجی‌ها موافقت می‌کنید.</p>
          <button type="submit" disabled={busy} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-neon-green text-space disabled:opacity-50" style={{ fontWeight: 900 }}><Download size={17} />{busy ? 'در حال ثبت...' : 'ثبت و دریافت فایل'}</button>
        </form>
      </div>
    </div>
  )
}
