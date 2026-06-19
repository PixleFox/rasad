import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import RangePicker from '../components/RangePicker'
import {
  fetchRangeReturns,
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
      </div>
    </main>
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
