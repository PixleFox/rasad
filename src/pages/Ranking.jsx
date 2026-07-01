import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRankingData } from '../hooks/useRankingData'
import { computeRankings, faNum, fmtSize, fmtPercent } from '../lib/fipiran'

const TABS = [
  { id: 0,  label: 'همه صندوق‌ها' },
  { id: 6,  label: 'سهامی' },
  { id: 4,  label: 'درآمد ثابت' },
  { id: 7,  label: 'مختلط' },
  { id: 22, label: 'اهرمی' },
  { id: 5,  label: 'کالایی' },
  { id: 23, label: 'شاخصی' },
  { id: 21, label: 'بخشی' },
]

const MODE_TABS = [
  { id: 'return', label: 'رتبه‌بندی بازدهی', color: '#00FF9D', desc: 'بر اساس بازدهی در بازه انتخابی' },
  { id: 'aum',    label: 'رتبه‌بندی دارایی', color: '#00D4FF', desc: 'بر اساس دارایی تحت مدیریت در پایان بازه' },
]

function RankChangeBadge({ value }) {
  if (value == null) return <span className="text-text-muted/40 text-xs">—</span>
  if (value === 0) return (
    <span className="text-text-muted/50 text-sm font-dana" style={{ fontWeight: 700 }}>═</span>
  )
  const up = value > 0
  const color = up ? '#00FF9D' : '#FF3B6B'
  const arrow = up ? '▲' : '▼'
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color }}>
        {arrow} {faNum(Math.abs(value))}
      </span>
    </div>
  )
}

const RETURN_COLUMNS = [
  {
    key: 'name',
    label: 'نام صندوق',
    align: 'start',
    render: (f) => (
      <div className="flex flex-col gap-0.5 min-w-[140px]">
        <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>{f.name}</span>
        <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>{f.manager}</span>
      </div>
    ),
  },
  {
    key: 'symbol',
    label: 'نماد',
    render: (f) =>
      f.symbol ? (
        <span className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan whitespace-nowrap"
          style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          {f.symbol}
        </span>
      ) : <span className="text-text-muted/40 text-xs">—</span>,
  },
  {
    key: 'value',
    label: 'بازدهی (%)',
    sortVal: (f) => f.value,
    render: (f) => {
      if (f.value == null) return <span className="text-text-muted/40 text-xs">—</span>
      const color = f.value > 0 ? '#00FF9D' : f.value < 0 ? '#FF3B6B' : '#8A94A6'
      return (
        <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color }}>
          {(f.value >= 0 ? '+' : '') + faNum(f.value.toFixed(2))}٪
        </span>
      )
    },
  },
  {
    key: 'rank',
    label: 'رتبه فعلی',
    sortVal: (f) => -f.rank,
    render: (f) => (
      <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
        {faNum(f.rank)}
      </span>
    ),
  },
  {
    key: 'rankChange',
    label: 'تغییر رتبه',
    sortVal: (f) => f.rankChange,
    render: (f) => <RankChangeBadge value={f.rankChange} />,
  },
  {
    key: 'priorRank',
    label: 'رتبه قبلی',
    sortVal: (f) => f.priorRank != null ? -f.priorRank : null,
    render: (f) =>
      f.priorRank != null
        ? <span className="text-text-muted text-xs font-dana tabular-nums" style={{ fontWeight: 600 }}>{faNum(f.priorRank)}</span>
        : <span className="text-text-muted/40 text-xs">—</span>,
  },
]

const AUM_COLUMNS = [
  {
    key: 'name',
    label: 'نام صندوق',
    align: 'start',
    render: (f) => (
      <div className="flex flex-col gap-0.5 min-w-[140px]">
        <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>{f.name}</span>
        <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>{f.manager}</span>
      </div>
    ),
  },
  {
    key: 'symbol',
    label: 'نماد',
    render: (f) =>
      f.symbol ? (
        <span className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan whitespace-nowrap"
          style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          {f.symbol}
        </span>
      ) : <span className="text-text-muted/40 text-xs">—</span>,
  },
  {
    key: 'value',
    label: 'دارایی (م.ت)',
    sortVal: (f) => f.value,
    render: (f) =>
      f.value != null
        ? <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>{fmtSize(f.value)}</span>
        : <span className="text-text-muted/40 text-xs">—</span>,
  },
  {
    key: 'rank',
    label: 'رتبه فعلی',
    sortVal: (f) => -f.rank,
    render: (f) => (
      <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
        {faNum(f.rank)}
      </span>
    ),
  },
  {
    key: 'rankChange',
    label: 'تغییر رتبه',
    sortVal: (f) => f.rankChange,
    render: (f) => <RankChangeBadge value={f.rankChange} />,
  },
  {
    key: 'priorRank',
    label: 'رتبه قبلی',
    sortVal: (f) => f.priorRank != null ? -f.priorRank : null,
    render: (f) =>
      f.priorRank != null
        ? <span className="text-text-muted text-xs font-dana tabular-nums" style={{ fontWeight: 600 }}>{faNum(f.priorRank)}</span>
        : <span className="text-text-muted/40 text-xs">—</span>,
  },
]

export default function Ranking() {
  const { currentFunds, priorFunds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } =
    useRankingData()
  const [mode, setMode]   = useState('return')
  const [typeId, setTypeId] = useState(6)

  const rows = useMemo(
    () => computeRankings(currentFunds, priorFunds, typeId, mode),
    [currentFunds, priorFunds, typeId, mode]
  )

  const activeMode = MODE_TABS.find((m) => m.id === mode)
  const columns = mode === 'return' ? RETURN_COLUMNS : AUM_COLUMNS

  // Summary stats
  const improved = rows.filter((f) => (f.rankChange ?? 0) > 0).length
  const worsened = rows.filter((f) => (f.rankChange ?? 0) < 0).length

  return (
    <FundsPageLayout
      badge="رتبه‌بندی صندوق‌ها"
      accentColor={activeMode.color}
      title="رتبه‌بندی"
      highlight={mode === 'return' ? 'بازدهی' : 'دارایی'}
      titleTail="صندوق‌ها"
      subtitle={activeMode.desc}
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
      floatAsset="/assets/Astronut.png"
    >
      {/* Mode tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap gap-2 mb-5"
      >
        {MODE_TABS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-dana cursor-pointer transition-all duration-200 ${
              mode === m.id
                ? 'text-space font-dana'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
            }`}
            style={
              mode === m.id
                ? { fontWeight: 900, background: m.color, boxShadow: `0 0 20px ${m.color}40` }
                : { fontWeight: 600 }
            }
          >
            {m.label}
          </button>
        ))}
      </motion.div>

      {/* Category tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex flex-wrap gap-2 mb-3"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeId(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
              typeId === t.id
                ? t.id === 0 ? 'text-amber-900' : 'text-space'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
            }`}
            style={
              typeId === t.id
                ? t.id === 0
                  ? { fontWeight: 900, background: '#FBBF24', boxShadow: '0 0 12px rgba(251,191,36,0.3)' }
                  : { fontWeight: 900, background: activeMode.color, boxShadow: `0 0 12px ${activeMode.color}30` }
                : { fontWeight: 600 }
            }
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* warning when all selected */}
      <AnimatePresence>
        {typeId === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-dana"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', color: '#FCD34D', fontWeight: 600 }}>
              <span className="text-base shrink-0">⚠️</span>
              <span>صندوق‌های انواع مختلف (سهامی، درآمد ثابت، اهرمی و ...) با یکدیگر قابل مقایسه نیستند. رتبه‌بندی در این حالت فقط جهت مرور کلی است.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary chips */}
      {!loading && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-3 mb-5"
        >
          {[
            { label: 'تعداد صندوق', value: faNum(rows.length), color: '#8A94A6' },
            { label: 'بهبود رتبه', value: faNum(improved), color: '#00FF9D' },
            { label: 'افت رتبه',   value: faNum(worsened), color: '#FF3B6B' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-2.5 rounded-xl border border-white/5 bg-surface/40 flex flex-col gap-0.5">
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{s.label}</span>
              <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="rank"
          defaultSortDir="asc"
          minWidth={820}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
          goodSortKeys={['rankChange']}
          rankField="rank"
          rowKey={(row) => row.regNo}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران · تغییر رتبه نسبت به بازه مشابه قبلی محاسبه می‌شود · م.ت = میلیارد تومان
      </p>
    </FundsPageLayout>
  )
}
