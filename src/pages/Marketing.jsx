import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { computeMarketing, MARKETING_LEVELS, faNum, fmtSize } from '../lib/fipiran'

const TABS = [
  { id: 6,  label: 'سهامی' },
  { id: 4,  label: 'درآمد ثابت' },
  { id: 7,  label: 'مختلط' },
  { id: 22, label: 'اهرمی' },
  { id: 5,  label: 'کالایی' },
  { id: 23, label: 'شاخصی' },
  { id: 21, label: 'بخشی' },
]

function MarketingBadge({ level }) {
  if (!level) return <span className="text-text-muted/40 text-xs">—</span>
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-dana whitespace-nowrap"
      style={{
        fontWeight: 700,
        color: level.color,
        background: level.bg,
        border: `1px solid ${level.color}40`,
        boxShadow: `0 0 10px ${level.color}20`,
      }}
    >
      <span>{level.icon}</span>
      {level.label}
    </span>
  )
}

function DeltaCell({ value }) {
  if (!Number.isFinite(value)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = value > 0 ? '#00FF9D' : value < 0 ? '#FF3B6B' : '#8A94A6'
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : ''
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color }}>
        {arrow} {faNum(Math.abs(value).toFixed(1))}
      </span>
      <span className="text-[0.6rem] text-text-muted/50 font-dana" style={{ fontWeight: 600 }}>
        میلیارد تومان
      </span>
    </div>
  )
}

function FlowCell({ value }) {
  if (!Number.isFinite(value)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = value > 0 ? '#00FF9D' : value < 0 ? '#FF3B6B' : '#8A94A6'
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : ''
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>
      {arrow} {faNum(Math.abs(value).toFixed(1))}
    </span>
  )
}

function MarketShareCell({ value }) {
  if (!Number.isFinite(value)) return <span className="text-text-muted/40 text-xs">—</span>
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-dana tabular-nums text-text-primary" style={{ fontWeight: 700 }}>
        {faNum(value.toFixed(2))}٪
      </span>
      <div className="w-14 h-1 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-neon-violet/70"
          style={{ width: `${Math.min(value * 5, 100)}%` }}
        />
      </div>
    </div>
  )
}

const MARKETING_COLUMNS = [
  {
    key: 'name',
    label: 'نام صندوق',
    align: 'start',
    render: (f) => (
      <div className="flex flex-col gap-0.5 min-w-[140px]">
        <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>
          {f.name}
        </span>
        <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>
          {f.manager}
        </span>
      </div>
    ),
  },
  {
    key: 'symbol',
    label: 'نماد',
    render: (f) =>
      f.symbol ? (
        <span
          className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan whitespace-nowrap"
          style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
        >
          {f.symbol}
        </span>
      ) : (
        <span className="text-text-muted/40 text-xs">—</span>
      ),
  },
  {
    key: 'size',
    label: 'دارایی (م.ت)',
    sortVal: (f) => f.sizeRial,
    render: (f) => (
      <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>
        {fmtSize(f.sizeRial)}
      </span>
    ),
  },
  {
    key: 'flow',
    label: 'ورود/خروج پول (م.ت)',
    sortVal: (f) => f.flowBT,
    render: (f) => <FlowCell value={f.flowBT} />,
  },
  {
    key: 'marketShare',
    label: 'سهم بازار (ابتدای بازه)',
    sortVal: (f) => f.marketSharePct,
    render: (f) => <MarketShareCell value={f.marketSharePct} />,
  },
  {
    key: 'delta',
    label: 'تفاوت (م.ت)',
    sortVal: (f) => f.deltaAbsBT,
    render: (f) => <DeltaCell value={f.deltaAbsBT} />,
  },
  {
    key: 'score',
    label: 'تاثیر مارکتینگ',
    sortVal: (f) => f.marketingScore,
    render: (f) => <MarketingBadge level={f.marketingLevel} />,
  },
]

const GOOD_SORT_KEYS = ['delta', 'flow', 'size', 'score', 'marketShare']

export default function Marketing() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } =
    useRangeFunds()
  const [tabId, setTabId] = useState(6)

  const rows = useMemo(() => computeMarketing(funds, tabId), [funds, tabId])

  // Category-level summary stats
  const catFlow = useMemo(
    () => rows.reduce((s, f) => s + (f.flowBT || 0), 0),
    [rows]
  )
  const bigBangCount = rows.filter((f) => f.marketingLevel?.score >= 4).length
  const unsuccessfulCount = rows.filter((f) => f.marketingLevel?.score === 0).length

  return (
    <FundsPageLayout
      badge="مارکتینگ صندوق‌ها"
      accentColor="#A78BFA"
      title="عملکرد"
      highlight="مارکتینگ"
      titleTail="صندوق‌ها"
      subtitle="کدام صندوق‌ها بیشتر از سهم بازارشون پول جذب کردن؟"
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
      floatAsset="/assets/Astronut.png"
    >
      {/* Legend — gradient spectrum (RTL: بیگ‌بنگ on right = green, ناموفق on left = red) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-5"
      >
        <div className="flex items-center gap-3">
          {/* ناموفق on the left visually (RTL: last item in row = left) */}
          <span className="text-[#ef4444] text-xs font-dana whitespace-nowrap" style={{ fontWeight: 700 }}>ناموفق</span>
          {/* Gradient: green on right (BigBang), red on left (ناموفق) — LTR gradient since CSS ignores RTL */}
          <div className="flex-1 h-4 rounded-full" style={{
            background: 'linear-gradient(to right, #ef4444, #f97316, #fbbf24, #86efac, #22c55e)',
          }} />
          <span className="text-[#22c55e] text-xs font-dana whitespace-nowrap" style={{ fontWeight: 700 }}>بیگ بنگ 🚀</span>
        </div>
        <div className="flex mt-2 gap-3 flex-wrap">
          {MARKETING_LEVELS.map((lv) => (
            <span key={lv.label} className="text-[0.65rem] font-dana flex items-center gap-1" style={{ color: lv.color, fontWeight: 600 }}>
              {lv.icon} {lv.label}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Category tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTabId(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
              tabId === t.id
                ? 'bg-neon-violet/15 text-neon-violet border border-neon-violet/40'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
            }`}
            style={{ fontWeight: 600 }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Mini-summary for current category */}
      {!loading && rows.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-3 mb-5"
        >
          {[
            {
              label: 'جریان خالص دسته',
              value: (catFlow >= 0 ? '+' : '') + faNum(catFlow.toFixed(0)) + ' م.ت',
              color: catFlow >= 0 ? '#00FF9D' : '#FF3B6B',
            },
            { label: 'تعداد صندوق', value: faNum(rows.length), color: '#8A94A6' },
            { label: 'بوم / بیگ بنگ', value: faNum(bigBangCount), color: '#A78BFA' },
            { label: 'ناموفق', value: faNum(unsuccessfulCount), color: '#FF3B6B' },
          ].map((s) => (
            <div
              key={s.label}
              className="px-4 py-2.5 rounded-xl border border-white/5 bg-surface/40 flex flex-col gap-0.5"
            >
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
                {s.label}
              </span>
              <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: s.color }}>
                {s.value}
              </span>
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
          columns={MARKETING_COLUMNS}
          rows={rows}
          defaultSortKey="delta"
          minWidth={920}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
          goodSortKeys={GOOD_SORT_KEYS}
          rowKey={(row) => row.regNo}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران · تفاوت = جریان واقعی − جریان مورد انتظار بر اساس سهم بازار ابتدای بازه · م.ت = میلیارد تومان
      </p>
    </FundsPageLayout>
  )
}
