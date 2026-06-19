import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import DatePickerNS from 'react-multi-date-picker'
import persianNS from 'react-date-object/calendars/persian'
import persianFaNS from 'react-date-object/locales/persian_fa'

// These packages are CJS; Vite's interop hands back the namespace object, so
// unwrap `.default` when present.
const DatePicker = DatePickerNS?.default ?? DatePickerNS
const persian = persianNS?.default ?? persianNS
const persian_fa = persianFaNS?.default ?? persianFaNS
import {
  CATEGORIES,
  fetchRangeReturns,
  topByRange,
  fmtSize,
  fmtPercent,
  faNum,
  toJalali,
  todayISO,
  monthsBeforeISO,
  dateToISO,
} from '../lib/fipiran'

// react-multi-date-picker DateObject → timezone-safe ISO string
const objToISO = (dobj) => dateToISO(dobj.toDate())

export default function TopFunds() {
  const [startISO, setStartISO] = useState(() => monthsBeforeISO(todayISO(), 1))
  const [endISO, setEndISO] = useState(() => todayISO())

  const [funds, setFunds] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeType, setActiveType] = useState(CATEGORIES[0].id)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRangeReturns(startISO, endISO)
      .then((res) => {
        if (cancelled) return
        setFunds(res.funds)
        setStartDate(res.startDate)
        setEndDate(res.endDate)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message || 'خطا در دریافت داده')
        setFunds([])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [startISO, endISO])

  const rows = topByRange(funds, activeType, 10)

  const pickerInputClass =
    'bg-surface/70 border border-neon-cyan/20 rounded-lg px-3 py-2 text-sm text-text-primary font-dana cursor-pointer hover:border-neon-cyan/40 focus:border-neon-cyan/60 focus:outline-none transition-colors duration-200 w-32 text-center'

  return (
    <section id="funds" className="relative py-24 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-neon-cyan/5 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[200px] bg-neon-violet/5 blur-[80px] rounded-full" />
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border border-neon-gold/30 bg-neon-gold/5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-gold animate-pulse" />
              <span className="text-neon-gold text-sm font-dana" style={{ fontWeight: 600 }}>
                داده‌ی زنده فیپیران
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-dana text-white" style={{ fontWeight: 900 }}>
              برترین‌های{' '}
              <span className="text-neon-gold" style={{ textShadow: '0 0 30px rgba(251,191,36,0.5)' }}>
                بازدهی
              </span>
            </h2>
            <p className="text-text-muted text-sm font-dana mt-2" style={{ fontWeight: 600 }}>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-neon-cyan">
                  <span className="w-3 h-3 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                  در حال محاسبه‌ی بازدهی از داده‌ی زنده فیپیران…
                </span>
              ) : (
                <>
                  ۱۰ صندوق برتر هر دسته بر اساس بازدهی در بازه‌ی انتخابی
                  {startDate && endDate && (
                    <span className="text-text-muted/70">
                      {' '}— از {toJalali(startDate)} تا {toJalali(endDate)}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Shamsi range pickers */}
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
                از تاریخ
              </label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={new Date(startISO + 'T00:00:00')}
                maxDate={new Date(endISO + 'T00:00:00')}
                onChange={(d) => d && setStartISO(objToISO(d))}
                inputClass={pickerInputClass}
                calendarPosition="bottom-right"
                className="rmdp-rasad"
                editable={false}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
                تا تاریخ
              </label>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={new Date(endISO + 'T00:00:00')}
                minDate={new Date(startISO + 'T00:00:00')}
                maxDate={new Date(todayISO() + 'T00:00:00')}
                onChange={(d) => d && setEndISO(objToISO(d))}
                inputClass={pickerInputClass}
                calendarPosition="bottom-right"
                className="rmdp-rasad"
                editable={false}
              />
            </div>
          </div>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveType(cat.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
                activeType === cat.id
                  ? 'bg-neon-cyan text-space shadow-neon-cyan'
                  : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
              }`}
              style={{ fontWeight: 600 }}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-neon-cyan/10 overflow-hidden bg-surface/40 backdrop-blur-sm"
        >
          {/* Table header */}
          <div
            className="grid grid-cols-12 px-4 sm:px-6 py-3 text-xs font-dana text-text-muted border-b border-neon-cyan/10"
            style={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))',
            }}
          >
            <span className="col-span-1 text-center">#</span>
            <span className="col-span-5 sm:col-span-4">نام صندوق</span>
            <span className="col-span-2 text-center hidden sm:block">نماد</span>
            <span className="col-span-3 text-center hidden md:block">دارایی تحت مدیریت (میلیارد تومان)</span>
            <span className="col-span-6 sm:col-span-3 md:col-span-2 text-center">بازدهی در بازه</span>
          </div>

          {/* Body states */}
          {loading ? (
            <TableSkeleton />
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
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-text-muted text-sm font-dana" style={{ fontWeight: 600 }}>
                صندوقی در این دسته برای این بازه یافت نشد.
              </p>
            </div>
          ) : (
            rows.map((fund, i) => (
              <motion.div
                key={fund.regNo}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-12 items-center px-4 sm:px-6 py-4 border-b border-neon-cyan/5 last:border-0 hover:bg-neon-cyan/5 transition-all duration-200 cursor-pointer group"
                style={
                  i === 0 ? { background: 'rgba(255,215,0,0.04)' }
                  : i === 1 ? { background: 'rgba(192,192,192,0.03)' }
                  : i === 2 ? { background: 'rgba(205,127,50,0.03)' }
                  : {}
                }
              >
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  {i < 3 ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-lg leading-none">{['🏆','🥈','🥉'][i]}</span>
                      <span className="text-[0.6rem] font-dana tabular-nums"
                        style={{ fontWeight: 700, color: ['#FFD700','#C0C0C0','#CD7F32'][i] }}>
                        {faNum(i + 1)}
                      </span>
                    </div>
                  ) : (
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-dana tabular-nums"
                      style={{ fontWeight: 900, color: '#8A94A6', background: 'rgba(255,255,255,0.03)' }}
                    >
                      {faNum(i + 1)}
                    </span>
                  )}
                </div>

                {/* Name + manager */}
                <div className="col-span-5 sm:col-span-4 flex flex-col gap-0.5 min-w-0">
                  <span
                    className="text-text-primary text-sm font-dana group-hover:text-neon-cyan transition-colors duration-200 truncate"
                    style={{ fontWeight: 900 }}
                  >
                    {fund.name}
                  </span>
                  <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>
                    {fund.manager}
                  </span>
                </div>

                {/* Symbol */}
                <div className="col-span-2 hidden sm:flex items-center justify-center">
                  {fund.symbol ? (
                    <span
                      className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan"
                      style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
                    >
                      {fund.symbol}
                    </span>
                  ) : (
                    <span className="text-text-muted/50 text-xs">—</span>
                  )}
                </div>

                {/* Size */}
                <div className="col-span-3 hidden md:flex items-center justify-center">
                  <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>
                    {fmtSize(fund.sizeRial)}
                  </span>
                </div>

                {/* Range return */}
                <div className="col-span-6 sm:col-span-3 md:col-span-2 flex items-center justify-center gap-1">
                  {fund.rangeReturn >= 0 ? (
                    <svg className="w-3.5 h-3.5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-neon-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  )}
                  <span
                    className="text-sm font-dana tabular-nums"
                    style={{
                      fontWeight: 900,
                      color: fund.rangeReturn >= 0 ? '#00FF9D' : '#FF3B6B',
                      textShadow: fund.rangeReturn >= 0 ? '0 0 10px rgba(0,255,157,0.4)' : '0 0 10px rgba(255,59,107,0.4)',
                    }}
                  >
                    {fmtPercent(fund.rangeReturn)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Note */}
        <p className="text-center text-text-muted text-xs font-dana mt-4" style={{ fontWeight: 600 }}>
          منبع: فیپیران · بازدهی بر اساس تغییر NAV ابطال در بازه‌ی انتخابی محاسبه شده است.
        </p>
      </div>
    </section>
  )
}

function TableSkeleton() {
  return (
    <div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 items-center px-4 sm:px-6 py-4 border-b border-neon-cyan/5 last:border-0"
        >
          <div className="col-span-1 flex justify-center">
            <div className="w-6 h-6 rounded-md bg-white/5 animate-pulse" />
          </div>
          <div className="col-span-5 sm:col-span-4 flex flex-col gap-1.5">
            <div className="h-3.5 w-32 rounded bg-white/5 animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="col-span-2 hidden sm:flex justify-center">
            <div className="h-4 w-12 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="col-span-3 hidden md:flex justify-center">
            <div className="h-3.5 w-16 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="col-span-6 sm:col-span-3 md:col-span-2 flex justify-center">
            <div className="h-3.5 w-14 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
