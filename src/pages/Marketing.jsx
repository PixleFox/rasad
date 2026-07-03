import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { computeMarketing, computeSegmentation, MARKETING_LEVELS, fetchTsetmcQuality, fetchCodalNews, faNum, fmtSize } from '../lib/fipiran'

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

const VIEW_TABS = [
  { id: 'marketing',     label: 'مارکتینگ' },
  { id: 'segmentation',  label: 'بخشبندی صندوق‌ها' },
  { id: 'quality',       label: 'شاخص کیفیت صندوق‌ها' },
  { id: 'boardquality',  label: 'کیفیت تابلو صندوق‌های درآمد ثابت' },
]

// ── Board Quality scoring ─────────────────────────────────────────────────────
function scoreMM(mmVolBT, sizeRial) {
  if (!mmVolBT || !sizeRial || sizeRial <= 0) return 0
  const aumBT = sizeRial / 1e10
  const pct = (mmVolBT / aumBT) * 100
  const steps = Math.max(0, Math.floor((25 - pct) / 5))
  return Math.max(0, 15 - steps * 3)
}

function scoreBubble(pct) {
  if (pct == null) return null
  if (pct >= -0.1  && pct <= 0.1)  return 10
  if (pct >= -0.5  && pct < -0.1)  return 9
  if (pct >= -1.0  && pct < -0.5)  return 8
  if (pct >= -3.0  && pct < -1.0)  return 6
  if (pct < -3.0)                   return 5
  if (pct > 0.1   && pct <= 0.5)   return 7
  if (pct > 0.5   && pct <= 1.0)   return 4
  if (pct > 1.0   && pct <= 3.0)   return 3
  return 0
}

function scoreVolume(avgMonthVol, sizeRial, navRet) {
  if (!avgMonthVol || !sizeRial || !navRet || sizeRial <= 0 || navRet <= 0) return 0
  const totalUnits = sizeRial / navRet
  const volPct = (avgMonthVol / totalUnits) * 100
  const steps = Math.max(0, Math.floor((0.3 - volPct) / 0.1))
  return Math.max(0, 10 - steps * 4)
}

function scoreChangeRate(changePct) {
  if (changePct == null) return 0
  if (changePct >= 0.14) return 10
  if (changePct >= 0.13) return 6
  if (changePct >= 0.12) return 2
  return 0
}

function scoreTrades(avgDailyTrades, sizeRial) {
  if (!avgDailyTrades || !sizeRial || sizeRial <= 0) return 0
  const aumBT = sizeRial / 1e10
  const ideal = aumBT * 0.20
  if (ideal <= 0) return 0
  const ratio = avgDailyTrades / ideal
  const steps = Math.max(0, Math.floor((1 - ratio) / 0.05))
  return Math.max(0, 5 - steps)
}

function cellColor(score, max) {
  const r = score / max
  if (r >= 0.8) return { bg: 'rgba(34,197,94,0.18)', text: '#4ade80' }
  if (r >= 0.5) return { bg: 'rgba(234,179,8,0.15)',  text: '#facc15' }
  if (r >= 0.2) return { bg: 'rgba(249,115,22,0.13)', text: '#fb923c' }
  return { bg: 'rgba(239,68,68,0.13)', text: '#f87171' }
}

function ScoreCell({ score, max, value, unit }) {
  if (score == null) return <span className="text-text-muted/40 text-xs">—</span>
  const { bg, text } = cellColor(score, max)
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[64px]" style={{ background: bg }}>
      <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color: text }}>
        {value}
        {unit && <span className="text-[0.6rem] mr-0.5 opacity-70">{unit}</span>}
      </span>
      <span className="text-[0.6rem] font-dana tabular-nums" style={{ color: text, opacity: 0.75, fontWeight: 800 }}>
        {faNum(score)}/{faNum(max)}
      </span>
    </div>
  )
}

function TotalScoreBadge({ score }) {
  const max = 50
  const { bg, text } = cellColor(score, max)
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl" style={{ background: bg, border: `1px solid ${text}40` }}>
      <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: text }}>{faNum(score)}</span>
      <span className="text-[0.6rem] font-dana text-text-muted/60" style={{ fontWeight: 600 }}>از ۵۰</span>
    </div>
  )
}

function BoardQualityTable({ funds, qData }) {
  const [sortKey, setSortKey] = useState('total')
  const [sortDir, setSortDir] = useState('desc')

  function getFundScores(f) {
    const d = qData[f.insCode]
    if (!d) return null
    const bubblePct = d.bubblePct
    const mm     = scoreMM(d.mmVolBT, f.sizeRial)
    const bubble = scoreBubble(bubblePct) ?? 0
    const vol    = scoreVolume(d.avgMonthVol, f.sizeRial, f.navRet)
    const chg    = scoreChangeRate(d.changePct)
    const trd    = scoreTrades(d.avgDailyTrades, f.sizeRial)
    return { d, bubblePct, mm, bubble, vol, chg, trd, total: mm + bubble + vol + chg + trd }
  }

  const sortedFunds = useMemo(() => {
    const withScore = funds.map((f) => ({ f, s: getFundScores(f) }))
    const dirs = sortDir === 'desc' ? -1 : 1
    return withScore.sort((a, b) => {
      const av = a.s?.[sortKey] ?? -1
      const bv = b.s?.[sortKey] ?? -1
      return (bv - av) * dirs
    }).map(({ f }) => f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funds, qData, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const cols = [
    { key: 'name', label: 'نام صندوق' },
    { key: 'aum', label: 'دارایی (میلیارد تومان)' },
    { key: 'mm', label: 'بازارگردان (میلیارد تومان)', max: 15 },
    { key: 'bubble', label: 'حباب NAV', max: 10 },
    { key: 'vol', label: 'حجم ماهانه', max: 10 },
    { key: 'trd', label: 'تعداد معاملات', max: 5 },
    { key: 'chg', label: 'درصد روزانه', max: 10 },
    { key: 'total', label: 'نمره کل', max: 50 },
  ]

  return (
    <div className="overflow-x-auto rounded-xl border border-white/6">
      <table className="w-full text-sm font-dana" style={{ minWidth: 820, direction: 'rtl' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {cols.map((c) => (
              <th key={c.key}
                onClick={() => c.key !== 'name' && toggleSort(c.key)}
                className={`px-3 py-2.5 text-center text-xs whitespace-nowrap ${c.key !== 'name' ? 'cursor-pointer hover:text-neon-cyan' : 'text-right'}`}
                style={{ fontWeight: 700, color: sortKey === c.key ? '#00D4FF' : '#8A94A6' }}
              >
                {c.label}
                {sortKey === c.key && (
                  <span className="mr-1 opacity-60">{sortDir === 'desc' ? '▼' : '▲'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedFunds.map((f, i) => {
            const sc = getFundScores(f)
            return (
              <tr key={f.insCode}
                className="hover:bg-white/3 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              >
                {/* نام صندوق */}
                <td className="px-3 py-2.5 text-right">
                  <div className="flex flex-col gap-0.5 min-w-[120px]">
                    <span className="text-text-primary text-xs" style={{ fontWeight: 800 }}>{f.name}</span>
                    {f.symbol && (
                      <span className="text-neon-cyan text-[0.6rem]" style={{ fontWeight: 600, opacity: 0.7 }}>{f.symbol}</span>
                    )}
                  </div>
                </td>
                {/* دارایی */}
                <td className="px-3 py-2.5 text-center">
                  <span className="text-text-primary tabular-nums text-xs" style={{ fontWeight: 700 }}>
                    {f.sizeRial > 0 ? faNum(Math.round(f.sizeRial / 1e10)) : '—'}
                  </span>
                </td>
                {/* بازارگردان */}
                <td className="px-3 py-2.5 text-center">
                  {!sc
                    ? <span className="text-text-muted/40 text-xs animate-pulse">...</span>
                    : <ScoreCell score={sc.mm} max={15} value={sc.d.mmVolBT != null ? faNum(Math.round(sc.d.mmVolBT)) : '—'} />
                  }
                </td>
                {/* حباب */}
                <td className="px-3 py-2.5 text-center">
                  {!sc
                    ? <span className="text-text-muted/40 text-xs animate-pulse">...</span>
                    : <ScoreCell score={sc.bubble} max={10}
                        value={sc.bubblePct != null ? (sc.bubblePct >= 0 ? '+' : '') + sc.bubblePct.toFixed(2) : '—'}
                        unit="٪"
                      />
                  }
                </td>
                {/* حجم ماهانه */}
                <td className="px-3 py-2.5 text-center">
                  {!sc
                    ? <span className="text-text-muted/40 text-xs animate-pulse">...</span>
                    : <ScoreCell score={sc.vol} max={10}
                        value={sc.d.avgMonthVol != null ? faNum(Math.round(sc.d.avgMonthVol / 1e6)) : '—'}
                        unit="م"
                      />
                  }
                </td>
                {/* تعداد معاملات */}
                <td className="px-3 py-2.5 text-center">
                  {!sc
                    ? <span className="text-text-muted/40 text-xs animate-pulse">...</span>
                    : <ScoreCell score={sc.trd} max={5}
                        value={sc.d.avgDailyTrades != null ? faNum(Math.round(sc.d.avgDailyTrades)) : '—'}
                      />
                  }
                </td>
                {/* درصد روزانه */}
                <td className="px-3 py-2.5 text-center">
                  {!sc
                    ? <span className="text-text-muted/40 text-xs animate-pulse">...</span>
                    : <ScoreCell score={sc.chg} max={10}
                        value={sc.d.changePct != null ? faNum(sc.d.changePct.toFixed(3)) : '—'}
                        unit="٪"
                      />
                  }
                </td>
                {/* نمره کل */}
                <td className="px-3 py-2.5 text-center">
                  {!sc
                    ? <span className="text-text-muted/40 text-xs animate-pulse">...</span>
                    : <TotalScoreBadge score={sc.total} />
                  }
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BoardQualityView({ funds, loading: fundsLoading }) {
  const [qData, setQData] = useState({})
  const [qLoading, setQLoading] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)

  const fixedIncomeFunds = useMemo(
    () => funds.filter((f) => f.type === 4 && f.isETF && !f.isCharity && f.insCode),
    [funds]
  )

  const fetchAll = useCallback(async () => {
    if (!fixedIncomeFunds.length) return
    setLoadedCount(0)
    setQLoading(true)
    const results = {}
    await Promise.all(
      fixedIncomeFunds.map(async (f) => {
        try { results[f.insCode] = await fetchTsetmcQuality(f.insCode) } catch {}
        setLoadedCount((c) => c + 1)
      })
    )
    setQData((prev) => ({ ...prev, ...results }))
    setQLoading(false)
  }, [fixedIncomeFunds])

  useEffect(() => { fetchAll() }, [fetchAll])

  const dividingFunds   = useMemo(() => fixedIncomeFunds.filter((f) => (f.dividendDays ?? 0) > 0), [fixedIncomeFunds])
  const cumulativeFunds = useMemo(() => fixedIncomeFunds.filter((f) => !((f.dividendDays ?? 0) > 0)), [fixedIncomeFunds])

  // AUM segments for grouping (in میلیارد تومان)
  const AUM_SEGS = useMemo(() => {
    const allBT = fixedIncomeFunds.map((f) => f.sizeRial / 1e10).filter((v) => v > 0).sort((a, b) => a - b)
    if (!allBT.length) return []
    const p33 = allBT[Math.floor(allBT.length * 0.33)]
    const p66 = allBT[Math.floor(allBT.length * 0.66)]
    return [
      { label: 'بزرگ', min: p66, max: Infinity, color: '#00FF9D' },
      { label: 'متوسط', min: p33, max: p66, color: '#00D4FF' },
      { label: 'کوچک', min: 0, max: p33, color: '#A78BFA' },
    ]
  }, [fixedIncomeFunds])

  function renderGroup(title, groupFunds, accent) {
    if (!groupFunds.length) return null
    return (
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 opacity-15" style={{ background: accent }} />
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full" style={{ background: accent + '15', border: `1px solid ${accent}35` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
            <span className="text-sm font-dana" style={{ fontWeight: 800, color: accent }}>{title}</span>
            <span className="text-xs font-dana opacity-60" style={{ color: accent }}>({faNum(groupFunds.length)} صندوق)</span>
          </div>
          <div className="h-px flex-1 opacity-15" style={{ background: accent }} />
        </div>

        {AUM_SEGS.map((seg) => {
          const segFunds = groupFunds.filter((f) => {
            const bt = f.sizeRial / 1e10
            return bt >= seg.min && (seg.max === Infinity || bt < seg.max)
          })
          if (!segFunds.length) return null
          return (
            <div key={seg.label} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-dana px-2.5 py-1 rounded-lg" style={{ color: seg.color, background: seg.color + '15', border: `1px solid ${seg.color}30`, fontWeight: 700 }}>
                  {seg.label}
                </span>
                <span className="text-xs text-text-muted font-dana" style={{ fontWeight: 600 }}>
                  {seg.max === Infinity ? `بالای ${faNum(Math.round(seg.min))} میلیارد تومان` : `${faNum(Math.round(seg.min))}–${faNum(Math.round(seg.max))} میلیارد تومان`}
                </span>
                <span className="text-xs text-text-muted/40 font-dana">({faNum(segFunds.length)} صندوق)</span>
              </div>
              <BoardQualityTable funds={segFunds} qData={qData} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* Header chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'صندوق‌های درآمد ثابت ETF', value: faNum(fixedIncomeFunds.length), color: '#00D4FF' },
          { label: 'تقسیم سودی', value: faNum(dividingFunds.length), color: '#00FF9D' },
          { label: 'جمع‌شونده', value: faNum(cumulativeFunds.length), color: '#A78BFA' },
          { label: 'دریافت شده از TSE', value: faNum(Object.keys(qData).length), color: '#FBBF24' },
        ].map((s) => (
          <div key={s.label} className="px-4 py-2.5 rounded-xl border border-white/5 bg-surface/40 flex flex-col gap-0.5">
            <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{s.label}</span>
            <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Score legend */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-dana text-text-muted w-full mb-1" style={{ fontWeight: 700 }}>راهنمای نمره‌دهی — حداکثر ۵۰ نمره</span>
        {[
          { label: 'بازارگردان', max: 15, desc: '۲۵٪ AUM = ۱۵، هر ۵٪ کمتر ۳- نمره' },
          { label: 'حباب NAV', max: 10, desc: '±۰.۱٪ = ۱۰، حباب مثبت امتیاز کمتر' },
          { label: 'حجم ماهانه', max: 10, desc: '۰.۳٪ AUM = ۱۰، هر ۰.۱٪ کمتر ۴-' },
          { label: 'تعداد معاملات', max: 5, desc: '۲۰٪ AUM = ideal، هر ۵٪ کمتر ۱-' },
          { label: 'درصد روزانه', max: 10, desc: '≥۰.۱۴٪ = ۱۰، ۰.۱۳٪ = ۶، ۰.۱۲٪ = ۲' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-xs font-dana text-text-primary" style={{ fontWeight: 800 }}>{l.label}</span>
            <span className="text-[0.6rem] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF', fontWeight: 700 }}>/{faNum(l.max)}</span>
            <span className="text-[0.6rem] font-dana text-text-muted/60 hidden sm:inline" style={{ fontWeight: 600 }}>{l.desc}</span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {qLoading && (
        <div className="flex items-center gap-4 py-8 justify-center">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#00D4FF" strokeWidth="4" strokeLinecap="round"
                strokeDasharray="150.8"
                strokeDashoffset={fixedIncomeFunds.length > 0 ? 150.8 * (1 - loadedCount / fixedIncomeFunds.length) : 150.8}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] font-dana tabular-nums" style={{ color: '#00D4FF', fontWeight: 800 }}>
              {faNum(loadedCount)}/{faNum(fixedIncomeFunds.length)}
            </span>
          </div>
          <span className="text-sm font-dana text-text-muted" style={{ fontWeight: 600 }}>دریافت دیتا از TSE...</span>
        </div>
      )}

      {/* Content */}
      {!qLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {renderGroup('تقسیم سودی', dividingFunds, '#00FF9D')}
          {renderGroup('جمع‌شونده', cumulativeFunds, '#A78BFA')}
        </motion.div>
      )}
    </div>
  )
}

const fmtHamta = (bt) => {
  const h = bt / 1000
  if (h >= 1) return faNum(h.toFixed(1)) + ' همت'
  return faNum(Math.round(bt)) + ' میلیارد تومان'
}

function SegmentCard({ seg }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: seg.seg * 0.04 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: seg.color + '30', background: `${seg.color}08` }}
    >
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-right cursor-pointer hover:bg-white/5 transition-colors"
      >
        {/* Segment badge */}
        <span
          className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-dana tabular-nums"
          style={{
            fontWeight: 800,
            color: seg.color,
            background: seg.color + '18',
            border: `1px solid ${seg.color}40`,
          }}
        >
          {seg.label}
        </span>

        {/* AUM range */}
        <span className="flex-1 text-xs font-dana text-text-muted text-right" style={{ fontWeight: 600 }}>
          {fmtHamta(seg.minBT)} — {fmtHamta(seg.maxBT)}
        </span>

        {/* Stats */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-[0.65rem] text-text-muted font-dana" style={{ fontWeight: 600 }}>تعداد</span>
            <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color: seg.color }}>
              {faNum(seg.count)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[0.65rem] text-text-muted font-dana" style={{ fontWeight: 600 }}>مجموع AUM</span>
            <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color: seg.color }}>
              {fmtHamta(seg.totalBT)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[0.65rem] text-text-muted font-dana" style={{ fontWeight: 600 }}>میانگین AUM</span>
            <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color: seg.color }}>
              {fmtHamta(seg.meanBT)}
            </span>
          </div>
          <span className="text-text-muted/40 text-xs ml-1">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Collapsible fund list */}
      {open && (
        <div className="border-t border-white/5 px-4 py-2 flex flex-col gap-1">
          {seg.funds.map((f) => (
            <div key={f.regNo} className="flex items-center gap-3 py-1.5 border-b border-white/4 last:border-0">
              <span className="flex-1 text-sm font-dana text-text-primary truncate" style={{ fontWeight: 700 }}>
                {f.name}
              </span>
              {f.symbol && (
                <span
                  className="text-xs font-dana text-neon-cyan px-1.5 py-0.5 rounded shrink-0"
                  style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  {f.symbol}
                </span>
              )}
              <span className="text-xs font-dana text-text-muted shrink-0" style={{ fontWeight: 600 }}>
                {f.manager}
              </span>
              <span className="text-sm font-dana tabular-nums shrink-0" style={{ fontWeight: 700, color: seg.color }}>
                {fmtHamta(f.sizeRial / 1e10)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function SegmentationView({ funds, tabId, setTabId, loading }) {
  const segments = useMemo(() => computeSegmentation(funds, tabId), [funds, tabId])

  const totalBT = useMemo(() => segments.reduce((s, g) => s + g.totalBT, 0), [segments])

  // حذف «همه صندوق‌ها» از بخشبندی
  const segTabs = TABS.filter((t) => t.id !== 0)

  return (
    <div>
      {/* Type tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap gap-2 mb-5"
      >
        {segTabs.map((t) => (
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

      {/* Summary bar */}
      {!loading && segments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-3 mb-5"
        >
          {[
            { label: 'تعداد صندوق', value: faNum(segments.reduce((s, g) => s + g.count, 0)), color: '#8A94A6' },
            { label: 'مجموع AUM دسته', value: fmtHamta(totalBT), color: '#A78BFA' },
            { label: 'تعداد سگمنت', value: faNum(segments.length), color: '#00D4FF' },
          ].map((s) => (
            <div
              key={s.label}
              className="px-4 py-2.5 rounded-xl border border-white/5 bg-surface/40 flex flex-col gap-0.5"
            >
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{s.label}</span>
              <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* AUM distribution bar */}
      {!loading && segments.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <div className="flex h-3 rounded-full overflow-hidden w-full">
            {segments.map((seg) => (
              <div
                key={seg.label}
                style={{
                  width: `${(seg.totalBT / totalBT) * 100}%`,
                  background: seg.color,
                  opacity: 0.85,
                }}
                title={`${seg.label}: ${fmtHamta(seg.totalBT)}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {segments.map((seg) => (
              <span key={seg.label} className="flex items-center gap-1 text-[0.65rem] font-dana" style={{ color: seg.color, fontWeight: 600 }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: seg.color }} />
                {seg.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Segment cards */}
      {tabId === 4 ? (
        <>
          {[
            { key: 'FI-تقسیم', title: 'تقسیم سودی', color: '#00FF9D' },
            { key: 'FI-جمع',   title: 'جمع‌شونده (انباشتی)', color: '#A78BFA' },
          ].map(({ key, title, color }) => {
            const group = segments.filter((s) => s.label.includes(key))
            if (group.length === 0) return null
            return (
              <div key={key} className="flex flex-col gap-3">
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-px flex-1 opacity-20" style={{ background: color }} />
                  <span className="text-sm font-dana px-3 py-1 rounded-full" style={{ color, background: color + '18', border: `1px solid ${color}30`, fontWeight: 700 }}>
                    {title}
                  </span>
                  <div className="h-px flex-1 opacity-20" style={{ background: color }} />
                </div>
                {group.map((seg) => <SegmentCard key={seg.label} seg={seg} />)}
              </div>
            )
          })}
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {segments.map((seg) => (
            <SegmentCard key={seg.label} seg={seg} />
          ))}
          {!loading && segments.length === 0 && (
            <p className="text-center text-text-muted text-sm font-dana py-10" style={{ fontWeight: 600 }}>
              داده‌ای برای این دسته یافت نشد.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

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

function FlowShareCell({ flowBT, catFlow }) {
  if (!Number.isFinite(flowBT) || !catFlow || Math.abs(catFlow) < 0.01)
    return <span className="text-text-muted/40 text-xs">—</span>
  const pct = (flowBT / Math.abs(catFlow)) * 100
  const color = pct > 0 ? '#00FF9D' : pct < 0 ? '#FF3B6B' : '#8A94A6'
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : ''
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color }}>
        {arrow} {faNum(Math.abs(pct).toFixed(1))}٪
      </span>
      <div className="w-14 h-1 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(Math.abs(pct), 100)}%`, background: color, opacity: 0.7 }}
        />
      </div>
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

const makeMarketingColumns = (catFlow) => [
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
    label: 'دارایی (میلیارد تومان)',
    sortVal: (f) => f.sizeRial,
    render: (f) => (
      <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>
        {fmtSize(f.sizeRial)}
      </span>
    ),
  },
  {
    key: 'flow',
    label: 'ورود/خروج پول (میلیارد تومان)',
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
    label: 'تفاوت (میلیارد تومان)',
    sortVal: (f) => f.deltaAbsBT,
    render: (f) => <DeltaCell value={f.deltaAbsBT} />,
  },
  {
    key: 'flowShare',
    label: 'ورود/خروج ÷ دارایی',
    sortVal: (f) => {
      const aum = f.sizeRial / 1e10
      return aum > 0 ? (f.flowBT / aum) * 100 : 0
    },
    render: (f) => {
      const aum = f.sizeRial / 1e10
      if (!Number.isFinite(f.flowBT) || aum <= 0) return <span className="text-text-muted/40 text-xs">—</span>
      const pct = (f.flowBT / aum) * 100
      const color = pct > 0 ? '#00FF9D' : pct < 0 ? '#FF3B6B' : '#8A94A6'
      const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : ''
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color }}>
            {arrow} {faNum(Math.abs(pct).toFixed(2))}٪
          </span>
          <div className="w-14 h-1 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(Math.abs(pct) * 5, 100)}%`, background: color, opacity: 0.7 }} />
          </div>
        </div>
      )
    },
  },
  {
    key: 'score',
    label: 'تاثیر مارکتینگ',
    sortVal: (f) => f.marketingScore,
    render: (f) => <MarketingBadge level={f.marketingLevel} />,
  },
]

const GOOD_SORT_KEYS = ['delta', 'flow', 'size', 'score', 'marketShare', 'flowShare']

// ── Quality View ──────────────────────────────────────────────────────────────
function QualityBadge({ pct }) {
  if (pct == null) return <span className="text-text-muted/40 text-xs">—</span>
  const color = pct > 0 ? '#00FF9D' : pct < 0 ? '#FF3B6B' : '#8A94A6'
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : ''
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>
      {arrow} {faNum(Math.abs(pct).toFixed(2))}٪
    </span>
  )
}

function BubbleBadge({ pct }) {
  if (pct == null) return <span className="text-text-muted/40 text-xs">—</span>
  const isPos = pct > 0
  const color = isPos ? '#FF3B6B' : '#00D4FF'
  const barW = Math.min(Math.abs(pct) * 8, 100)
  return (
    <div className="flex flex-col items-center gap-1 min-w-[56px]">
      <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color }}>
        {(isPos ? '+' : '') + faNum(pct.toFixed(2))}٪
      </span>
      <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full" style={{ width: `${barW}%`, background: color, opacity: 0.8 }} />
      </div>
      <span className="text-[0.6rem] font-dana" style={{ color: color + 'bb', fontWeight: 600 }}>
        {isPos ? 'حباب مثبت' : 'تخفیف NAV'}
      </span>
    </div>
  )
}

function QualityView({ funds, tabId, setTabId, loading: fundsLoading }) {
  const [qData, setQData] = useState({})
  const [qLoading, setQLoading] = useState(true)  // show loader immediately
  const [codalNews, setCodalNews] = useState([])
  const [newsIdx, setNewsIdx] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)

  const etfFunds = useMemo(
    () => funds.filter((f) => f.isETF && !f.isCharity && f.insCode && (tabId === 0 || f.type === tabId)),
    [funds, tabId]
  )

  const segments = useMemo(() => {
    if (tabId === 0) return [{ label: 'همه صندوق‌های ETF', color: '#00D4FF', funds: etfFunds, seg: 1 }]
    return computeSegmentation(funds, tabId).map((seg) => ({
      ...seg,
      funds: seg.funds.filter((f) => f.isETF && f.insCode),
    })).filter((seg) => seg.funds.length > 0)
  }, [funds, tabId, etfFunds])

  // Rotate news item every 2s while loading
  useEffect(() => {
    if (!qLoading || codalNews.length === 0) return
    const t = setInterval(() => setNewsIdx((i) => (i + 1) % codalNews.length), 2000)
    return () => clearInterval(t)
  }, [qLoading, codalNews.length])

  const fetchAll = useCallback(async () => {
    if (!etfFunds.length) return
    setLoadedCount(0)
    setQLoading(true)
    const results = {}
    await Promise.all(
      etfFunds.map(async (f) => {
        try { results[f.insCode] = await fetchTsetmcQuality(f.insCode) } catch {}
        setLoadedCount((c) => c + 1)
      })
    )
    setQData((prev) => ({ ...prev, ...results }))
    setQLoading(false)
  }, [etfFunds])

  // Codal once on mount
  useEffect(() => {
    fetchCodalNews(80).then(setCodalNews).catch(() => {})
  }, [])

  // Re-trigger when etfFunds changes
  useEffect(() => { fetchAll() }, [fetchAll])

  const columns = [
    {
      key: 'name',
      label: 'نام صندوق / نماد',
      align: 'start',
      render: (f) => (
        <div className="flex flex-col gap-0.5 min-w-[130px]">
          <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>{f.name}</span>
          {f.symbol && (
            <span className="text-xs font-dana text-neon-cyan" style={{ fontWeight: 600, opacity: 0.8 }}>{f.symbol}</span>
          )}
        </div>
      ),
    },
    {
      key: 'change',
      label: 'تغییر روز',
      sortVal: (f) => qData[f.insCode]?.changePct,
      render: (f) => <QualityBadge pct={qData[f.insCode]?.changePct} />,
    },
    {
      key: 'bubble',
      label: 'حباب ناو',
      sortVal: (f) => {
        const d = qData[f.insCode]
        return d?.bubblePct ?? null
      },
      render: (f) => {
        const d = qData[f.insCode]
        if (!d) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
        if (d.bubblePct == null) return <span className="text-text-muted/40 text-xs">—</span>
        return <div title={`آخرین معامله: ${faNum(d.pLastTrade)} · NAV ابطال: ${faNum(d.pRedTran)}`}><BubbleBadge pct={d.bubblePct} /></div>
      },
    },
    {
      key: 'trades',
      label: 'تعداد معاملات',
      sortVal: (f) => qData[f.insCode]?.trades,
      render: (f) => {
        const d = qData[f.insCode]
        if (!d) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
        return <span className="text-sm font-dana tabular-nums text-text-primary" style={{ fontWeight: 600 }}>{d.trades != null ? faNum(Math.round(d.trades)) : '—'}</span>
      },
    },
    {
      key: 'volume',
      label: 'حجم معاملات',
      sortVal: (f) => qData[f.insCode]?.volume,
      render: (f) => {
        const d = qData[f.insCode]
        if (!d) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
        if (d.volume == null) return <span className="text-text-muted/40 text-xs">—</span>
        const m = d.volume / 1e6
        return <span className="text-sm font-dana tabular-nums text-text-primary" style={{ fontWeight: 600 }}>{faNum(m.toFixed(1))} م</span>
      },
    },
    {
      key: 'avgMonth',
      label: 'میانگین حجم ماهانه',
      sortVal: (f) => qData[f.insCode]?.avgMonthVol,
      render: (f) => {
        const d = qData[f.insCode]
        if (!d) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
        if (d.avgMonthVol == null) return <span className="text-text-muted/40 text-xs">—</span>
        const m = d.avgMonthVol / 1e6
        return <span className="text-sm font-dana tabular-nums text-text-primary" style={{ fontWeight: 600 }}>{faNum(m.toFixed(1))} م</span>
      },
    },
    {
      key: 'netFlow',
      label: 'خالص خرید حقیقی (میلیارد تومان)',
      sortVal: (f) => qData[f.insCode]?.netFlowBT ?? null,
      render: (f) => {
        const d = qData[f.insCode]
        if (!d) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
        if (d.netFlowBT == null) return <span className="text-text-muted/40 text-xs">—</span>
        const v = d.netFlowBT
        const color = v > 0 ? '#00FF9D' : v < 0 ? '#FF3B6B' : '#8A94A6'
        const arrow = v > 0 ? '▲' : v < 0 ? '▼' : ''
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color }}>
              {arrow} {faNum(Math.abs(v).toFixed(1))}
            </span>
            <span className="text-[0.6rem] text-text-muted/50 font-dana" style={{ fontWeight: 600 }}>میلیارد تومان</span>
          </div>
        )
      },
    },
    {
      key: 'mmVol',
      label: 'حجم سفارشات بازارگردان (میلیارد تومان)',
      sortVal: (f) => qData[f.insCode]?.mmVolBT,
      render: (f) => {
        const d = qData[f.insCode]
        if (!d) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
        if (d.mmVolBT == null) return <span className="text-text-muted/40 text-xs">—</span>
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color: '#00D4FF' }}>
              {faNum(Math.round(d.mmVolBT))}
            </span>
            <span className="text-[0.6rem] text-text-muted/50 font-dana" style={{ fontWeight: 600 }}>میلیارد تومان دو طرف</span>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      {/* Type tabs */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-wrap gap-2 mb-5">
        {[{ id: 0, label: 'همه ETF‌ها' }, ...TABS].map((t) => (
          <button
            key={t.id}
            onClick={() => setTabId(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
              tabId === t.id
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
            }`}
            style={{ fontWeight: 600 }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Summary — only when loaded */}
      {!fundsLoading && !qLoading && (() => {
        // جمع کل خالص خرید حقیقی این دسته (مجموع ستون)
        const netFlowSum = etfFunds.reduce((s, f) => {
          const v = qData[f.insCode]?.netFlowBT
          return s + (Number.isFinite(v) ? v : 0)
        }, 0)
        const netColor = netFlowSum > 0 ? '#00FF9D' : netFlowSum < 0 ? '#FF3B6B' : '#8A94A6'
        const netArrow = netFlowSum > 0 ? '▲' : netFlowSum < 0 ? '▼' : ''
        return (
          <div className="flex gap-3 mb-5 flex-wrap">
            {[
              { label: 'صندوق‌های ETF در این دسته', value: faNum(etfFunds.length), color: '#00D4FF' },
              { label: 'با دیتای TSE', value: faNum(Object.keys(qData).length), color: '#00FF9D' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-2.5 rounded-xl border border-white/5 bg-surface/40 flex flex-col gap-0.5">
                <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{s.label}</span>
                <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: s.color }}>{s.value}</span>
              </div>
            ))}
            {/* جمع کل خالص خرید حقیقی */}
            <div className="px-4 py-2.5 rounded-xl border flex flex-col gap-0.5"
              style={{ borderColor: netColor + '33', background: netColor + '0d' }}>
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>جمع خالص خرید حقیقی (میلیارد تومان)</span>
              <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: netColor }}>
                {netArrow} {faNum(Math.abs(netFlowSum).toFixed(1))}
              </span>
            </div>
          </div>
        )
      })()}

      {/* Loading screen — rotating Codal news */}
      {qLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6 py-10"
        >
          {/* Spinner + progress */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke="#00D4FF" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${175.9}`}
                  strokeDashoffset={etfFunds.length > 0 ? 175.9 * (1 - loadedCount / etfFunds.length) : 175.9}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-dana tabular-nums" style={{ color: '#00D4FF', fontWeight: 800 }}>
                {faNum(loadedCount)}/{faNum(etfFunds.length)}
              </span>
            </div>
            <span className="text-xs font-dana text-text-muted" style={{ fontWeight: 600 }}>
              در حال دریافت دیتای بازار از TSE...
            </span>
          </div>

          {/* Rotating Codal news — one at a time */}
          <div className="w-full max-w-lg">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/60 inline-block" />
              <span className="text-[0.65rem] font-dana text-text-muted/60" style={{ fontWeight: 600 }}>
                آخرین اطلاعیه‌های کدال
              </span>
            </div>
            <div className="relative h-28 overflow-hidden">
              <AnimatePresence mode="wait">
                {codalNews.length === 0 ? (
                  <motion.div key="skel" className="absolute inset-0 rounded-2xl bg-white/4 animate-pulse" />
                ) : (
                  <motion.a
                    key={newsIdx}
                    href={`https://codal.ir/ReportList.aspx?search&TracingNo=${codalNews[newsIdx]?.tracingNo}`}
                    target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 flex flex-col gap-2.5 p-4 rounded-2xl border cursor-pointer"
                    style={{ background: 'rgba(0,212,255,0.04)', borderColor: 'rgba(0,212,255,0.15)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-dana px-2.5 py-0.5 rounded-lg shrink-0"
                        style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF', fontWeight: 800 }}>
                        {codalNews[newsIdx]?.symbol}
                      </span>
                      <span className="text-xs font-dana text-text-muted truncate" style={{ fontWeight: 600 }}>
                        {codalNews[newsIdx]?.name}
                      </span>
                      <span className="text-[0.6rem] font-dana text-text-muted/40 shrink-0 mr-auto">
                        {codalNews[newsIdx]?.publishDateTime_Gregorian?.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-sm font-dana text-text-primary leading-relaxed line-clamp-2" style={{ fontWeight: 600 }}>
                      {codalNews[newsIdx]?.title}
                    </p>
                  </motion.a>
                )}
              </AnimatePresence>
            </div>
            {/* Dot indicators */}
            <div className="flex justify-center gap-1 mt-3">
              {Array.from({ length: Math.min(codalNews.length, 8) }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i === newsIdx % 8 ? '#00D4FF' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Per-segment tables */}
      {!qLoading && segments.map((seg) => (
        <div key={seg.label} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 opacity-20" style={{ background: seg.color }} />
            <span className="text-sm font-dana px-3 py-1 rounded-full" style={{ color: seg.color, background: seg.color + '18', border: `1px solid ${seg.color}30`, fontWeight: 700 }}>
              {seg.label}
              <span className="opacity-60 mr-1.5">({faNum(seg.funds.length)} صندوق)</span>
            </span>
            <div className="h-px flex-1 opacity-20" style={{ background: seg.color }} />
          </div>
          <FundsTable
            columns={columns}
            rows={seg.funds}
            defaultSortKey="trades"
            minWidth={820}
            loading={fundsLoading}
            error={null}
            onRetry={() => {}}
            emptyText="صندوق ETF در این سگمنت یافت نشد."
            rowKey={(f) => f.insCode}
          />
        </div>
      ))}
    </div>
  )
}

export default function Marketing() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } =
    useRangeFunds()
  const [view, setView] = useState('marketing')
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
      {/* View switcher */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-2 mb-6"
      >
        {VIEW_TABS.map((vt) => (
          <button
            key={vt.id}
            onClick={() => setView(vt.id)}
            className={`px-5 py-2 rounded-xl text-sm font-dana cursor-pointer transition-all duration-200 ${
              view === vt.id
                ? 'bg-neon-violet/20 text-neon-violet border border-neon-violet/50'
                : 'bg-surface/50 text-text-muted border border-white/8 hover:border-neon-violet/25 hover:text-text-primary'
            }`}
            style={{ fontWeight: 700 }}
          >
            {vt.label}
          </button>
        ))}
      </motion.div>

      {view === 'segmentation' && (
        <SegmentationView funds={funds} tabId={tabId} setTabId={setTabId} loading={loading} />
      )}

      {view === 'quality' && (
        <QualityView funds={funds} tabId={tabId} setTabId={setTabId} loading={loading} />
      )}

      {view === 'boardquality' && (
        <BoardQualityView funds={funds} loading={loading} />
      )}

      {view === 'marketing' && (<>

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
                ? t.id === 0
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-400/40'
                  : 'bg-neon-violet/15 text-neon-violet border border-neon-violet/40'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
            }`}
            style={{ fontWeight: 600 }}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* warning when all selected */}
      <AnimatePresence>
        {tabId === 0 && (
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
              <span>صندوق‌های انواع مختلف با یکدیگر قابل مقایسه نیستند. سهم از جذب در این حالت نسبت به کل بازار محاسبه می‌شود.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              value: (catFlow >= 0 ? '+' : '') + faNum(catFlow.toFixed(0)) + ' میلیارد تومان',
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
          columns={makeMarketingColumns(catFlow)}
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
        منبع: فیپیران · تفاوت = جریان واقعی − جریان مورد انتظار بر اساس سهم بازار ابتدای بازه · میلیارد تومان = میلیارد تومان
      </p>

      </>)}
    </FundsPageLayout>
  )
}
