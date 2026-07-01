import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchFundCompare, todayISO, shiftISO } from '../lib/fipiran'

const BASE = '/tsetmc'
const _cache = new Map()
async function tse(path, noCache = false, timeoutMs = 8000) {
  if (!noCache && _cache.has(path)) return _cache.get(path)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(`${BASE}/${path}`, { signal: ctrl.signal })
    if (!r.ok) throw new Error(r.status)
    const d = await r.json()
    if (!noCache) _cache.set(path, d)
    return d
  } finally {
    clearTimeout(timer)
  }
}

// ── تنظیمات هر نوع صندوق ──────────────────────────────────────────────────────
// threshold = avg20d * multPos  (وقتی avg > 0)
// threshold = avg20d * (-multNeg) (وقتی avg < 0)
const TYPES = [
  { id: 4,  label: 'درآمد ثابت', multPos: 2.0, multNeg: 1.1 },
  { id: 6,  label: 'سهامی',      multPos: 2.0, multNeg: 1.1 },
  { id: 21, label: 'بخشی',       multPos: 2.5, multNeg: 1.1 },
  { id: 7,  label: 'مختلط',      multPos: 2.0, multNeg: 1.1 },
  { id: 5,  label: 'کالایی/طلا', multPos: 2.0, multNeg: 1.1 },
]

const REFRESH = 180

function isOpen() {
  const d = new Date()
  const t = d.getHours() * 60 + d.getMinutes()
  return d.getDay() <= 4 && t >= 510 && t <= 1020
}

const fa = (n, dec = 1) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString('fa-IR', { maximumFractionDigits: dec, minimumFractionDigits: dec })
    : '—'

const fmtT = (d) => d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const MAX_FUNDS = 100  // عملاً همه‌ی ETFهای هر نوع (برای تطابق با تب کیفیت مارکتینگ)

// خالص خرید حقیقی زنده‌ی امروز (میلیارد تومان)
// endpoint زنده GetClientType/{ins}/1/0 فقط حجم می‌دهد، پس:
//   ارزش = (حجم خرید حقیقی − حجم فروش حقیقی) × قیمت پایانی
async function liveNetFlow(insCode) {
  try {
    const [ctRes, pRes] = await Promise.all([
      tse(`ClientType/GetClientType/${insCode}/1/0`, true, 6000),
      tse(`ClosingPrice/GetClosingPriceInfo/${insCode}`, true, 6000),
    ])
    const c = ctRes.clientType
    const p = pRes.closingPriceInfo
    if (!c || !p) return 0
    const netVol = (c.buy_I_Volume ?? 0) - (c.sell_I_Volume ?? 0)
    const price  = p.pClosing ?? p.pDrCotVal ?? 0
    return (netVol * price) / 1e10
  } catch { return 0 }
}

// ── کامپوننت اصلی ─────────────────────────────────────────────────────────────
export default function Triggers() {
  const [phase, setPhase]   = useState('init')   // init|done|error
  const [rows, setRows]     = useState([])        // [{id,label,today,avg,threshold,pct}]
  const [ts, setTs]         = useState(null)
  const [cd, setCd]         = useState(REFRESH)
  const [now, setNow]       = useState(new Date())
  const funds               = useRef({})          // {typeId: [fund]}
  const avg20               = useRef({})          // {typeId: number}

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const buildRows = (todayFlows) =>
    TYPES.map((cfg) => {
      const avg   = avg20.current[cfg.id] ?? 0
      const today = todayFlows[cfg.id] ?? 0
      const threshold = avg >= 0 ? avg * cfg.multPos : avg * (-cfg.multNeg)
      const pct = threshold !== 0 ? today / threshold : 0
      return { id: cfg.id, label: cfg.label, today, avg, threshold, pct }
    })

  const fetchLive = useCallback(async () => {
    const flows = {}
    await Promise.all(
      TYPES.map(async (cfg) => {
        const list = (funds.current[cfg.id] ?? []).slice(0, MAX_FUNDS)
        if (!list.length) { flows[cfg.id] = 0; return }
        const vals = await Promise.all(list.map((f) => liveNetFlow(f.insCode)))
        flows[cfg.id] = vals.reduce((s, v) => s + v, 0)
      })
    )
    setRows(buildRows(flows))
    setTs(new Date())
    setCd(REFRESH)
  }, [])

  const init = useCallback(async () => {
    try {
      setPhase('init')
      const today  = todayISO()
      const past   = shiftISO(today, -30) // ~۲۰ روز معاملاتی

      // timeout روی fipiran (اگه جواب نداد بعد از ۱۵ ثانیه error بده)
      const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))])

      const [snap, snap20] = await Promise.all([
        withTimeout(fetchFundCompare(today), 15000),
        withTimeout(fetchFundCompare(past), 15000),
      ])

      // صندوق‌های ETF هر نوع (همان مجموعه‌ی تب کیفیت مارکتینگ)
      for (const cfg of TYPES) {
        funds.current[cfg.id] = snap.funds
          .filter((f) => f.type === cfg.id && f.isETF && !f.isCharity && f.insCode)
          .sort((a, b) => b.sizeRial - a.sizeRial)
      }

      // میانگین روزانه‌ی ورود پول ۲۰ روز از فیپیران (همان مجموعه‌ی ETF):
      //   (واحدها_امروز − واحدها_۲۰روزقبل) × NAV ÷ ۲۰
      const byReg = new Map(snap20.funds.map((f) => [f.regNo, f]))
      for (const cfg of TYPES) {
        let total = 0
        for (const f of funds.current[cfg.id]) {
          const old = byReg.get(f.regNo)
          if (old && f.navRet > 0) total += (f.units - old.units) * f.navRet / 1e10
        }
        avg20.current[cfg.id] = total / 20
      }

      await fetchLive()
      setPhase('done')
    } catch (e) {
      console.error(e)
      setPhase('error')
    }
  }, [fetchLive])

  useEffect(() => { init() }, [init])

  // شمارش معکوس + refresh خودکار
  useEffect(() => {
    const t = setInterval(() => {
      setCd((c) => {
        if (c <= 1) { if (isOpen()) fetchLive(); return REFRESH }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [fetchLive])

  const open = isOpen()

  return (
    <div className="min-h-screen font-dana" dir="rtl"
      style={{ background: '#07090F', color: '#CBD5E1' }}>
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* ── سربرگ ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-lg font-dana" style={{ fontWeight: 900, color: '#F1F5F9' }}>
              تریگر تبلیغات صندوق‌ها
            </h1>
            <p className="text-xs mt-1" style={{ color: '#475569' }}>
              خالص خرید حقیقی · آپدیت هر {fa(REFRESH / 60, 0)} دقیقه
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#475569' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: open ? '#22C55E' : '#334155',
                  boxShadow: open ? '0 0 6px #22C55E' : 'none' }} />
              <span style={{ color: open ? '#22C55E' : '#475569' }}>
                {open ? 'بازار باز' : 'بازار بسته'}
              </span>
            </span>
            <span className="tabular-nums">{fmtT(now)}</span>
            {phase === 'done' && (
              <button onClick={() => open && fetchLive()}
                className="tabular-nums px-2.5 py-1 rounded-md"
                style={{ background: '#0F1623', border: '1px solid #1E293B' }}>
                {fa(cd, 0)} ث
              </button>
            )}
          </div>
        </div>

        {/* ── لودینگ / خطا ── */}
        {phase === 'init' && (
          <div className="flex items-center justify-center gap-3 py-24" style={{ color: '#334155' }}>
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: '#1E293B', borderTopColor: '#3B82F6' }} />
            <span className="text-sm">در حال بارگذاری...</span>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-3 py-24">
            <p className="text-sm" style={{ color: '#EF4444' }}>خطا در دریافت داده</p>
            <button onClick={init}
              className="text-xs px-4 py-2 rounded-lg"
              style={{ background: '#0F1623', border: '1px solid #1E293B', color: '#94A3B8' }}>
              تلاش دوباره
            </button>
          </div>
        )}

        {/* ── جدول ── */}
        {phase === 'done' && (
          <>
            {/* هدر جدول */}
            <div className="grid mb-2 px-3 text-xs" style={{
              color: '#475569',
              gridTemplateColumns: '1fr 1fr 1fr 1fr 90px',
              gap: '8px',
            }}>
              <span>نوع صندوق</span>
              <span className="text-center">امروز (م.ت)</span>
              <span className="text-center">میانگین ۲۰ روز</span>
              <span className="text-center">حد تریگر</span>
              <span className="text-center">وضعیت</span>
            </div>

            <div className="flex flex-col gap-2">
              {rows.map((r) => {
                const isGo    = r.pct >= 1
                const isWatch = r.pct >= 0.6 && !isGo
                const color   = isGo ? '#22C55E' : isWatch ? '#F59E0B' : '#EF4444'
                const label   = isGo ? 'تبلیغ بزن' : isWatch ? 'نزدیکه' : 'صبر کن'
                const barW    = `${Math.min((r.pct / 1.5) * 100, 100)}%`

                return (
                  <div key={r.id} className="rounded-xl px-4 pt-4 pb-3"
                    style={{
                      background: isGo ? `rgba(34,197,94,0.04)` : '#0C1118',
                      border: `1px solid ${isGo ? 'rgba(34,197,94,0.18)' : '#161D2A'}`,
                    }}>
                    <div className="grid items-center" style={{
                      gridTemplateColumns: '1fr 1fr 1fr 1fr 90px',
                      gap: '8px',
                    }}>
                      {/* نام */}
                      <span className="font-dana text-sm" style={{ fontWeight: 800, color: '#E2E8F0' }}>
                        {r.label}
                      </span>

                      {/* امروز */}
                      <div className="text-center">
                        <span className="font-dana tabular-nums text-base"
                          style={{ fontWeight: 900, color: r.today >= 0 ? '#22C55E' : '#EF4444' }}>
                          {(r.today >= 0 ? '+' : '') + fa(r.today)}
                        </span>
                      </div>

                      {/* میانگین */}
                      <div className="text-center">
                        <span className="font-dana tabular-nums text-sm"
                          style={{ fontWeight: 700, color: '#64748B' }}>
                          {(r.avg >= 0 ? '+' : '') + fa(r.avg)}
                        </span>
                      </div>

                      {/* حد */}
                      <div className="text-center">
                        <span className="font-dana tabular-nums text-sm"
                          style={{ fontWeight: 700, color: '#475569' }}>
                          {(r.threshold >= 0 ? '+' : '') + fa(r.threshold)}
                        </span>
                      </div>

                      {/* وضعیت */}
                      <div className="text-center">
                        <span className="inline-block text-xs font-dana px-2.5 py-1 rounded-md"
                          style={{
                            background: color + '14',
                            color,
                            fontWeight: 800,
                            border: `1px solid ${color}30`,
                          }}>
                          {label}
                        </span>
                      </div>
                    </div>

                    {/* نوار پیشرفت */}
                    <div className="mt-3 h-0.5 rounded-full overflow-hidden" style={{ background: '#1E293B' }}>
                      <div className="h-full rounded-full"
                        style={{ width: barW, background: color, transition: 'width 0.8s ease' }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs tabular-nums" style={{ color: '#1E293B' }}>
                      <span>۰</span>
                      <span style={{ color: r.pct > 0 ? '#334155' : '#1E293B' }}>
                        {fa(r.pct * 100, 0)}٪
                      </span>
                      <span>۱۵۰٪</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {ts && (
              <p className="text-center text-xs mt-6" style={{ color: '#1E293B' }}>
                آخرین آپدیت {fmtT(ts)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
