import { motion } from 'framer-motion'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import RangePicker from '../components/RangePicker'
import FipiranLoader from '../components/FipiranLoader'
import {
  fetchRangeReturns,
  fetchFundCompare,
  aggregateByCategory,
  faNum,
  fmtPercent,
  toJalali,
  todayISO,
  monthsBeforeISO,
} from '../lib/fipiran'

const fmtFlow = (v) => {
  if (!Number.isFinite(v)) return '—'
  const sign = v >= 0 ? '+' : '−'
  return sign + faNum(Math.abs(Math.round(v)))
}

export default function Aggregate() {
  const [startISO, setStartISO] = useState(() => monthsBeforeISO(todayISO(), 1))
  const [endISO, setEndISO] = useState(() => todayISO())

  const [agg, setAgg] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const slowLoad = new Date(`${startISO}T00:00:00`) < oneYearAgo

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRangeReturns(startISO, endISO)
      .then((res) => {
        if (cancelled) return
        setAgg(aggregateByCategory(res.funds))
        setStartDate(res.startDate)
        setEndDate(res.endDate)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message || 'خطا در دریافت داده')
        setAgg(null)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [startISO, endISO])

  // Summary derived values
  const summary = useMemo(() => {
    if (!agg) return null
    const cats = agg.rows.filter((r) => r.avgReturn != null)
    const best = cats.reduce((a, b) => (b.avgReturn > (a?.avgReturn ?? -Infinity) ? b : a), null)
    const maxAbsFlow = Math.max(1, ...agg.rows.map((r) => Math.abs(r.netFlow)))
    return { best, maxAbsFlow }
  }, [agg])

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FipiranLoader loading={loading} slow={slowLoad} />
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-neon-violet/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[300px] bg-neon-cyan/8 blur-[120px] rounded-full" />
      </div>
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating telescope */}
      <motion.img
        src="/assets/telescope.png"
        alt=""
        aria-hidden="true"
        className="absolute top-28 left-6 lg:left-20 w-24 lg:w-36 object-contain opacity-30 pointer-events-none select-none hidden sm:block"
        style={{ filter: 'drop-shadow(0 0 25px rgba(0,212,255,0.35))' }}
        animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border border-neon-violet/30 bg-neon-violet/5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-violet animate-pulse" />
              <span className="text-neon-violet text-sm font-dana" style={{ fontWeight: 600 }}>
                نمای کلان بازار
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-dana text-white" style={{ fontWeight: 900 }}>
              اطلاعات{' '}
              <span className="text-neon-cyan" style={{ textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>
                تجمیعی
              </span>{' '}
              صندوق‌ها
            </h1>
            <p className="text-text-muted text-sm sm:text-base font-dana mt-3 max-w-xl leading-relaxed" style={{ fontWeight: 600 }}>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-neon-cyan">
                  <span className="w-3 h-3 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                  در حال محاسبه‌ی داده‌ی تجمیعی از فیپیران…
                </span>
              ) : (
                <>
                  میانگین بازدهی و خالص جریان نقدی هر دسته از صندوق‌ها
                  {startDate && endDate && (
                    <span className="text-text-muted/70">
                      {' '}— از {toJalali(startDate)} تا {toJalali(endDate)}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          <RangePicker startISO={startISO} endISO={endISO} onStart={setStartISO} onEnd={setEndISO} />
        </motion.div>

        {/* Summary cards */}
        {!loading && !error && agg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
          >
            <SummaryCard
              label="خالص ورود/خروج پول"
              value={`${fmtFlow(agg.total.netFlow)}`}
              unit="میلیارد تومان"
              color={agg.total.netFlow >= 0 ? '#00FF9D' : '#FF3B6B'}
            />
            <SummaryCard
              label="پربازده‌ترین دسته"
              value={summary?.best?.label || '—'}
              unit={summary?.best ? fmtPercent(summary.best.avgReturn) : ''}
              color="#00D4FF"
            />
            <SummaryCard
              label="تعداد کل صندوق‌ها"
              value={faNum(agg.total.count)}
              unit="صندوق"
              color="#7C3AED"
            />
          </motion.div>
        )}

        {/* Aggregate table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-2xl border border-neon-cyan/10 overflow-hidden bg-surface/40 backdrop-blur-sm"
        >
          {/* Header row */}
          <div
            className="grid grid-cols-12 px-4 sm:px-6 py-3.5 text-xs font-dana text-text-muted border-b border-neon-cyan/10"
            style={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))',
            }}
          >
            <span className="col-span-4 sm:col-span-3">نوع صندوق</span>
            <span className="col-span-4 sm:col-span-4 text-center">میانگین بازدهی در بازه</span>
            <span className="col-span-4 sm:col-span-5 text-center flex items-center justify-center gap-3 flex-wrap">
              <span>ورود و خروج پول (میلیارد تومان)</span>
              <span className="hidden md:inline-flex items-center gap-3 text-[0.7rem]" dir="ltr">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#FF3B6B' }} />
                  <span className="text-neon-pink">خروج</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#00FF9D' }} />
                  <span className="text-neon-green">ورود</span>
                </span>
              </span>
            </span>
          </div>

          {loading ? (
            <AggSkeleton />
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <p className="text-neon-pink text-sm font-dana mb-2" style={{ fontWeight: 600 }}>
                {error}
              </p>
              <button
                onClick={() => setStartISO((d) => d)}
                className="text-neon-cyan text-sm font-dana cursor-pointer hover:text-white transition-colors"
                style={{ fontWeight: 600 }}
              >
                تلاش دوباره
              </button>
            </div>
          ) : (
            <>
              {agg.rows.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 items-center px-4 sm:px-6 py-4 border-b border-neon-cyan/5 hover:bg-neon-cyan/5 transition-colors duration-200"
                >
                  {/* Category */}
                  <div className="col-span-4 sm:col-span-3 flex flex-col gap-0.5">
                    <span className="text-text-primary text-sm font-dana" style={{ fontWeight: 900 }}>
                      {row.label}
                    </span>
                    <span className="text-text-muted/70 text-xs font-dana" style={{ fontWeight: 600 }}>
                      {faNum(row.count)} صندوق
                    </span>
                  </div>

                  {/* Avg return */}
                  <div className="col-span-4 sm:col-span-4 flex items-center justify-center gap-1">
                    {row.avgReturn == null ? (
                      <span className="text-text-muted/40 text-sm">—</span>
                    ) : (
                      <span
                        className="text-sm sm:text-base font-dana tabular-nums"
                        style={{
                          fontWeight: 900,
                          color: row.avgReturn >= 0 ? '#00FF9D' : '#FF3B6B',
                          textShadow:
                            row.avgReturn >= 0
                              ? '0 0 10px rgba(0,255,157,0.35)'
                              : '0 0 10px rgba(255,59,107,0.35)',
                        }}
                      >
                        {fmtPercent(row.avgReturn)}
                      </span>
                    )}
                  </div>

                  {/* Net flow: diverging bar from a center axis */}
                  <div className="col-span-4 sm:col-span-5 flex items-center justify-center gap-3">
                    <span
                      className="text-sm font-dana tabular-nums whitespace-nowrap min-w-[5rem] text-center"
                      style={{
                        fontWeight: 900,
                        color: row.netFlow >= 0 ? '#00FF9D' : '#FF3B6B',
                      }}
                    >
                      {fmtFlow(row.netFlow)}
                    </span>
                    <DivergingBar value={row.netFlow} max={summary?.maxAbsFlow || 1} />
                  </div>
                </motion.div>
              ))}

              {/* Total row */}
              <div
                className="grid grid-cols-12 items-center px-4 sm:px-6 py-4 border-t border-neon-cyan/20"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))' }}
              >
                <div className="col-span-4 sm:col-span-3">
                  <span className="text-white text-sm font-dana" style={{ fontWeight: 900 }}>
                    مجموع
                  </span>
                </div>
                <div className="col-span-4 sm:col-span-4 flex items-center justify-center">
                  <span className="text-text-muted/40 text-sm">—</span>
                </div>
                <div className="col-span-4 sm:col-span-5 flex items-center justify-center">
                  <span
                    className="text-base font-dana tabular-nums"
                    style={{ fontWeight: 900, color: agg.total.netFlow >= 0 ? '#00FF9D' : '#FF3B6B' }}
                  >
                    {fmtFlow(agg.total.netFlow)}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Note */}
        <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
          منبع: فیپیران · میانگین بازدهی به‌صورت وزنی (بر اساس دارایی تحت مدیریت) و جریان نقدی از تغییر تعداد واحدها × NAV محاسبه شده است.
          <br />
          مقدار مثبت = ورود پول، مقدار منفی = خروج پول.
        </p>

        {/* Live market data section */}
        <LiveFlowTable />
      </div>
    </main>
  )
}

// ── Live market flow table ────────────────────────────────────────────────────
const TSE_BASE = '/tsetmc'
const _liveCache = new Map()
async function tseGet(path, timeoutMs = 8000) {
  if (_liveCache.has(path)) return _liveCache.get(path)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(`${TSE_BASE}/${path}`, { signal: ctrl.signal })
    if (!r.ok) throw new Error(r.status)
    const d = await r.json()
    _liveCache.set(path, d)
    setTimeout(() => _liveCache.delete(path), 60000) // expire after 60s
    return d
  } finally { clearTimeout(timer) }
}

async function fundLiveFlow(insCode) {
  try {
    const [ct, pr] = await Promise.all([
      tseGet(`ClientType/GetClientType/${insCode}/1/0`, 6000),
      tseGet(`ClosingPrice/GetClosingPriceInfo/${insCode}`, 6000),
    ])
    const c = ct.clientType
    const p = pr.closingPriceInfo
    if (!c || !p) return 0
    return ((c.buy_I_Volume ?? 0) - (c.sell_I_Volume ?? 0)) * (p.pClosing ?? 0) / 1e10
  } catch { return 0 }
}

const LIVE_TYPES = [
  { id: 4,  label: 'درآمد ثابت',  route: '/funds/fixed-income',  color: '#00FF9D' },
  { id: 6,  label: 'سهامی',        route: '/funds/equity',         color: '#00D4FF' },
  { id: 7,  label: 'مختلط',        route: '/funds/mixed',          color: '#A78BFA' },
  { id: 5,  label: 'کالایی',       route: '/funds/commodity',      color: '#FBBF24' },
  { id: 22, label: 'اهرمی',        route: '/funds/leveraged',      color: '#F97316' },
  { id: 23, label: 'شاخصی',        route: '/funds/index-fund',     color: '#60A5FA' },
  { id: 21, label: 'بخشی',         route: '/funds/sector',         color: '#34D399' },
  { id: 11, label: 'بازارگردانی',  route: '/funds/market-maker',   color: '#FB7185' },
  { id: 12, label: 'جسورانه',      route: '/funds/venture',        color: '#C084FC' },
]

function LiveFlowTable() {
  const navigate = useNavigate()
  const [flows, setFlows] = useState({})
  const [phase, setPhase] = useState('init') // init | done | error
  const [ts, setTs] = useState(null)
  const fundsRef = useRef({})

  const load = useCallback(async () => {
    try {
      const snap = await fetchFundCompare(todayISO())
      for (const cfg of LIVE_TYPES) {
        fundsRef.current[cfg.id] = snap.funds
          .filter((f) => f.type === cfg.id && f.isETF && !f.isCharity && f.insCode)
      }
      await refresh()
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }, [])

  const refresh = useCallback(async () => {
    const result = {}
    await Promise.all(LIVE_TYPES.map(async (cfg) => {
      const list = fundsRef.current[cfg.id] ?? []
      if (!list.length) { result[cfg.id] = 0; return }
      const vals = await Promise.all(list.slice(0, 80).map((f) => fundLiveFlow(f.insCode)))
      result[cfg.id] = vals.reduce((s, v) => s + v, 0)
    }))
    setFlows(result)
    setTs(new Date())
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 90 seconds
  useEffect(() => {
    const t = setInterval(() => {
      _liveCache.clear()
      refresh()
    }, 90000)
    return () => clearInterval(t)
  }, [refresh])

  const fmtFlow = (v) => {
    if (!Number.isFinite(v)) return '—'
    const sign = v >= 0 ? '+' : '−'
    return sign + faNum(Math.abs(v).toFixed(1))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-10"
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          <h2 className="text-base font-dana text-white" style={{ fontWeight: 900 }}>
            دیتای زنده بازار
          </h2>
          <span className="text-xs font-dana px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)', fontWeight: 600 }}>
            لایو
          </span>
        </div>
        {ts && (
          <span className="text-xs font-dana text-text-muted/40" style={{ fontWeight: 600 }}>
            آپدیت: {ts.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-neon-cyan/10 overflow-hidden bg-surface/40 backdrop-blur-sm">
        {/* Table header */}
        <div className="grid grid-cols-2 px-4 sm:px-6 py-3 text-xs font-dana text-text-muted border-b border-neon-cyan/10"
          style={{ fontWeight: 600, background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))' }}>
          <span>نوع صندوق</span>
          <span className="text-center">ورود و خروج پول (میلیارد تومان)</span>
        </div>

        {phase === 'init' && (
          <div className="flex items-center gap-3 px-6 py-10 justify-center text-text-muted/40">
            <div className="w-4 h-4 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
            <span className="text-sm font-dana" style={{ fontWeight: 600 }}>در حال دریافت اطلاعات از مراجع...</span>
          </div>
        )}

        {phase === 'error' && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-dana" style={{ color: '#EF4444', fontWeight: 600 }}>خطا در دریافت</p>
            <button onClick={load} className="mt-2 text-xs text-neon-cyan font-dana cursor-pointer" style={{ fontWeight: 600 }}>
              تلاش دوباره
            </button>
          </div>
        )}

        {phase === 'done' && LIVE_TYPES.map((cfg, i) => {
          const flow = flows[cfg.id] ?? 0
          const color = flow >= 0 ? '#00FF9D' : '#FF3B6B'
          const barW = `${Math.min(Math.abs(flow) / 200 * 100, 100)}%`
          return (
            <motion.button
              key={cfg.id}
              onClick={() => navigate(cfg.route)}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="w-full grid grid-cols-2 items-center px-4 sm:px-6 py-4 border-b border-neon-cyan/5 hover:bg-neon-cyan/5 transition-colors duration-200 cursor-pointer text-right"
            >
              {/* Category */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-sm font-dana text-text-primary" style={{ fontWeight: 800 }}>{cfg.label}</span>
                <svg className="w-3 h-3 text-text-muted/30 mr-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>

              {/* Flow */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color }}>
                  {fmtFlow(flow)}
                </span>
                <div className="w-full max-w-[120px] h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: barW, background: color, opacity: 0.6 }} />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      <p className="text-center text-text-muted/40 text-xs font-dana mt-3" style={{ fontWeight: 600 }}>
        منبع: TSETMC · به‌روزرسانی خودکار هر ۹۰ ثانیه · کلیک برای مشاهده جزئیات
      </p>
    </motion.div>
  )
}

// Diverging bar: grows right (green) for inflow, left (red) for outflow, from a
// shared center axis. Length is proportional to |value| / max.
function DivergingBar({ value, max }) {
  // sqrt scale: one category can dwarf the rest, so compress magnitude to keep
  // smaller bars visible. Exact value is shown numerically beside the bar.
  const ratio = Math.min(1, Math.abs(value) / (max || 1))
  const pct = Math.sqrt(ratio) * 100
  const inflow = value >= 0
  return (
    <div dir="ltr" className="hidden sm:flex items-center w-full max-w-[180px]">
      {/* outflow side (left, red) */}
      <div className="flex-1 flex justify-end">
        {!inflow && (
          <div
            className="h-2 rounded-l-full"
            style={{ width: `${pct}%`, background: '#FF3B6B', boxShadow: '0 0 8px rgba(255,59,107,0.5)' }}
          />
        )}
      </div>
      {/* center axis */}
      <div className="w-px h-4 bg-white/25 shrink-0" />
      {/* inflow side (right, green) */}
      <div className="flex-1 flex justify-start">
        {inflow && (
          <div
            className="h-2 rounded-r-full"
            style={{ width: `${pct}%`, background: '#00FF9D', boxShadow: '0 0 8px rgba(0,255,157,0.5)' }}
          />
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, unit, color }) {
  return (
    <div
      className="relative p-5 rounded-2xl border border-neon-cyan/10 bg-surface/50 backdrop-blur-sm overflow-hidden group hover:border-neon-cyan/25 transition-colors duration-300"
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 30% 0%, ${color}, transparent 70%)` }}
      />
      <p className="relative text-text-muted text-xs font-dana mb-2" style={{ fontWeight: 600 }}>
        {label}
      </p>
      <div className="relative flex items-baseline gap-2">
        <span
          className="text-2xl font-dana tabular-nums"
          style={{ fontWeight: 900, color, textShadow: `0 0 20px ${color}50` }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

function AggSkeleton() {
  return (
    <div>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 items-center px-4 sm:px-6 py-4 border-b border-neon-cyan/5">
          <div className="col-span-4 sm:col-span-3 flex flex-col gap-1.5">
            <div className="h-3.5 w-20 rounded bg-white/5 animate-pulse" />
            <div className="h-2.5 w-12 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="col-span-4 sm:col-span-4 flex justify-center">
            <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="col-span-4 sm:col-span-5 flex justify-center">
            <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
