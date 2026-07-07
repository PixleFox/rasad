import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, RefreshCw, Radio, WifiOff } from 'lucide-react'

const TSETMC = '/tsetmc'
const OPEN_REFRESH = 20
const CLOSED_REFRESH = 180
const MAX_FUNDS = 100

const TYPES = [
  { id: 4, label: 'درآمد ثابت', multPos: 2, multNeg: 1.1 },
  { id: 6, label: 'سهامی', multPos: 2, multNeg: 1.1 },
  { id: 21, label: 'بخشی', multPos: 2.5, multNeg: 1.1 },
  { id: 7, label: 'مختلط', multPos: 2, multNeg: 1.1 },
  { id: 5, label: 'کالایی/طلا', multPos: 2, multNeg: 1.1 },
]

const fa = (number, decimals = 1) => Number.isFinite(Number(number))
  ? Number(number).toLocaleString('fa-IR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  : '—'

const fmtTime = (date) => date?.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '—'

function marketIsOpen(date = new Date()) {
  const day = date.getDay()
  const minute = date.getHours() * 60 + date.getMinutes()
  const tradingDay = day === 6 || (day >= 0 && day <= 3) // Saturday through Wednesday
  return tradingDay && minute >= 525 && minute <= 755
}

async function tse(path, { timeout = 9000, attempts = 2 } = {}) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(`${TSETMC}/${path}`, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) throw new Error(`TSETMC ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

export default function Triggers() {
  const [phase, setPhase] = useState('loading')
  const [rows, setRows] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [now, setNow] = useState(new Date())
  const [countdown, setCountdown] = useState(OPEN_REFRESH)
  const [refreshing, setRefreshing] = useState(false)
  const [liveError, setLiveError] = useState('')
  const fundsByType = useRef({})
  const averageByType = useRef({})
  const refreshLock = useRef(false)
  const mounted = useRef(true)
  const hasRows = useRef(false)

  const buildRows = useCallback((flows, coverage) => TYPES.map((type) => {
    const average = averageByType.current[type.id] ?? 0
    const today = flows[type.id] ?? 0
    const threshold = average >= 0 ? average * type.multPos : average * -type.multNeg
    return {
      id: type.id,
      label: type.label,
      today,
      average,
      threshold,
      ratio: threshold ? today / threshold : 0,
      coverage: coverage[type.id] ?? 0,
    }
  }), [])

  const fetchLive = useCallback(async ({ initial = false } = {}) => {
    if (refreshLock.current) return
    refreshLock.current = true
    setRefreshing(true)
    setLiveError('')
    try {
      const clientPayload = await tse('ClientType/GetClientTypeAll', { timeout: 12000, attempts: 3 })
      const clientMap = new Map((clientPayload.clientTypeAllDto || []).map((item) => [String(item.insCode), item]))
      const flows = {}
      const coverage = {}

      for (const type of TYPES) {
        const list = fundsByType.current[type.id] || []
        let total = 0
        let valid = 0
        for (const fund of list) {
          const key = String(fund.insCode)
          const client = clientMap.get(key)
          const price = Number(fund.referencePrice)
          if (!client || !price) continue
          total += ((client.buy_I_Volume ?? 0) - (client.sell_I_Volume ?? 0)) * price / 1e10
          valid += 1
        }
        flows[type.id] = total
        coverage[type.id] = list.length ? valid / list.length : 0
      }

      if (!mounted.current) return
      setRows(buildRows(flows, coverage))
      hasRows.current = true
      setUpdatedAt(new Date())
      setPhase('ready')
      setCountdown(marketIsOpen() ? OPEN_REFRESH : CLOSED_REFRESH)
      if (Object.values(coverage).some((value) => value < 0.75)) setLiveError('بخشی از نمادها موقتاً پاسخ ندادند؛ اعداد با آخرین قیمت سالم تکمیل شده‌اند.')
    } catch {
      if (!mounted.current) return
      if (initial || !hasRows.current) setPhase('error')
      else setLiveError('به‌روزرسانی لحظه‌ای ناموفق بود؛ آخرین داده سالم حفظ شد.')
    } finally {
      refreshLock.current = false
      if (mounted.current) setRefreshing(false)
    }
  }, [buildRows])

  const initialize = useCallback(async () => {
    setPhase('loading')
    setLiveError('')
    try {
      const response = await fetch('/api/trigger-baseline', { cache: 'no-store' })
      if (!response.ok) throw new Error('baseline unavailable')
      const baseline = await response.json()
      for (const type of TYPES) {
        const list = (baseline.fundsByType?.[type.id] || []).slice(0, MAX_FUNDS)
        fundsByType.current[type.id] = list
        averageByType.current[type.id] = Number(baseline.averageByType?.[type.id]) || 0
      }
      await fetchLive({ initial: true })
    } catch {
      if (mounted.current) setPhase('error')
    }
  }, [fetchLive])

  useEffect(() => {
    mounted.current = true
    initialize()
    return () => { mounted.current = false }
  }, [initialize])

  useEffect(() => {
    const timer = setInterval(() => {
      const time = new Date()
      setNow(time)
      setCountdown((value) => {
        if (phase !== 'ready') return value
        if (value <= 1) {
          fetchLive()
          return marketIsOpen(time) ? OPEN_REFRESH : CLOSED_REFRESH
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [fetchLive, phase])

  useEffect(() => {
    const resume = () => { if (document.visibilityState === 'visible' && phase === 'ready') fetchLive() }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    return () => { document.removeEventListener('visibilitychange', resume); window.removeEventListener('online', resume) }
  }, [fetchLive, phase])

  const open = marketIsOpen(now)

  return <main className="min-h-screen bg-[#07090F] px-4 py-8 font-dana text-slate-300" dir="rtl">
    <div className="mx-auto max-w-5xl">
      <header className="mb-7 flex flex-col gap-4 border-b border-slate-800/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs text-cyan-400"><Radio size={15} />پایش زنده جریان پول</div><h1 className="text-xl text-slate-100" style={{ fontWeight: 900 }}>تریگر تبلیغات صندوق‌ها</h1><p className="mt-2 text-xs text-slate-500">خالص خرید حقیقی امروز در مقایسه با میانگین بیست روز معاملاتی</p></div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-md border px-2.5 py-1.5 ${open ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-500'}`}>{open ? 'بازار باز' : 'بازار بسته'}</span>
          <span className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 tabular-nums text-slate-500">{fmtTime(now)}</span>
          <button type="button" onClick={() => phase === 'ready' ? fetchLive() : initialize()} disabled={refreshing || phase === 'loading'} className="flex items-center gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-300 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{phase === 'ready' ? `${fa(countdown, 0)} ث` : 'تلاش دوباره'}</button>
        </div>
      </header>

      {phase === 'loading' && <div className="grid min-h-72 place-items-center"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-cyan-400" /><p className="mt-4 text-sm text-slate-400">در حال تکمیل فهرست صندوق‌ها و ساخت خط مبنا...</p><p className="mt-2 text-xs text-slate-600">بارگذاری اول ممکن است کمی بیشتر طول بکشد.</p></div></div>}
      {phase === 'error' && <div className="grid min-h-72 place-items-center"><div className="text-center"><WifiOff className="mx-auto text-rose-400" /><p className="mt-4 text-sm text-rose-300">دریافت داده کامل نشد.</p><button onClick={initialize} className="mt-4 rounded-md border border-slate-700 px-4 py-2 text-xs text-slate-300">تلاش دوباره</button></div></div>}

      {phase === 'ready' && <>
        {liveError && <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 text-xs leading-6 text-amber-300"><AlertTriangle size={16} className="mt-1 shrink-0" />{liveError}</div>}
        <div className="hidden grid-cols-[1.2fr_repeat(3,1fr)_100px] gap-3 px-4 pb-2 text-center text-xs text-slate-600 sm:grid"><span className="text-right">نوع صندوق</span><span>امروز</span><span>میانگین ۲۰ روز</span><span>حد تریگر</span><span>وضعیت</span></div>
        <div className="space-y-2">{rows.map((row) => {
          const go = row.ratio >= 1
          const watch = row.ratio >= 0.6 && !go
          const color = go ? '#22C55E' : watch ? '#F59E0B' : '#EF4444'
          const label = go ? 'تبلیغ بزن' : watch ? 'نزدیکه' : 'صبر کن'
          const width = `${Math.max(0, Math.min((row.ratio / 1.5) * 100, 100))}%`
          return <article key={row.id} className="rounded-lg border border-slate-800 bg-[#0C1118] p-4" style={go ? { borderColor: 'rgba(34,197,94,.2)', background: 'rgba(34,197,94,.035)' } : undefined}>
            <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-[1.2fr_repeat(3,1fr)_100px] sm:gap-3">
              <div><h2 className="text-sm text-slate-100" style={{ fontWeight: 900 }}>{row.label}</h2><span className="mt-1 block text-[0.58rem] text-slate-600">پوشش زنده {fa(row.coverage * 100, 0)}٪</span></div>
              <div className="text-left sm:text-center"><span className="block text-[0.6rem] text-slate-600 sm:hidden">امروز</span><strong className="tabular-nums" style={{ color: row.today >= 0 ? '#22C55E' : '#EF4444' }}>{row.today >= 0 ? '+' : ''}{fa(row.today)}</strong></div>
              <div className="sm:text-center"><span className="block text-[0.6rem] text-slate-600 sm:hidden">میانگین ۲۰ روز</span><span className="text-sm tabular-nums text-slate-500">{row.average >= 0 ? '+' : ''}{fa(row.average)}</span></div>
              <div className="text-left sm:text-center"><span className="block text-[0.6rem] text-slate-600 sm:hidden">حد تریگر</span><span className="text-sm tabular-nums text-slate-500">{row.threshold >= 0 ? '+' : ''}{fa(row.threshold)}</span></div>
              <div className="col-span-2 text-center sm:col-span-1"><span className="inline-block rounded-md border px-2.5 py-1 text-xs" style={{ color, borderColor: `${color}30`, background: `${color}12`, fontWeight: 800 }}>{label}</span></div>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full transition-[width] duration-700" style={{ width, background: color }} /></div>
          </article>
        })}</div>
        <footer className="mt-5 flex items-center justify-between text-[0.65rem] text-slate-600"><span>ارقام: میلیارد تومان</span><span>آخرین داده سالم: {fmtTime(updatedAt)}</span></footer>
      </>}
    </div>
  </main>
}
