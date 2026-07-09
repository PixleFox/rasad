import { faNum, fmtSize, fmtPercent, toJalali } from '../lib/fipiran'
import { ScorePill, RiskMeter, SiteLink } from './FundsTable'

const nameCell = (f) => (
  <div className="flex flex-col gap-0.5 min-w-[140px]">
    <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>
      {f.name}
    </span>
    <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>
      {f.manager}
    </span>
    {f.stale && f.staleDate && (
      <span className="text-xs font-dana" style={{ color: '#F59E0B' }}>
        ⚠ داده {toJalali(f.staleDate)}
      </span>
    )}
  </div>
)

const symbolCell = (f) =>
  f.symbol ? (
    <span
      className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan whitespace-nowrap"
      style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}
    >
      {f.symbol}
    </span>
  ) : (
    <span className="text-text-muted/40 text-xs">—</span>
  )

const percentCell = (value) => {
  const v = value
  if (!Number.isFinite(v)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = v >= 0 ? '#00FF9D' : '#FF3B6B'
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color, textShadow: `0 0 10px ${color}40` }}>
      {fmtPercent(v)}
    </span>
  )
}
const returnCell = (f) => percentCell(f.rangeReturn)
const ytmCell = (f) => percentCell(f.ytmReturn)
const declaredRateCell = (f) => (
  Number.isFinite(f.declaredRate) ? (
    <span className="text-sm font-dana tabular-nums text-neon-green" style={{ fontWeight: 900 }}>
      {fmtPercent(f.declaredRate)}
    </span>
  ) : (
    <span className="text-text-muted/40 text-xs">—</span>
  )
)

const sizeCell = (f) => (
  <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>
    {fmtSize(f.sizeRial)}
  </span>
)

const yearsCell = (f) => (
  <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>
    {f.years != null ? faNum(f.years.toFixed(1)) : '—'}
  </span>
)

const COL = {
  name: { key: 'name', label: 'نام صندوق', align: 'start', render: nameCell, exportValue: (f) => f.name },
  symbol: { key: 'symbol', label: 'نماد', render: symbolCell, exportValue: (f) => f.symbol },
  size: { key: 'size', label: 'دارایی (میلیارد تومان)', sortVal: (f) => f.sizeRial, render: sizeCell, exportValue: (f) => Math.round((f.sizeRial || 0) / 1e10) },
  return: { key: 'return', label: 'بازدهی در بازه', sortVal: (f) => f.rangeReturn, render: returnCell, exportValue: (f) => f.rangeReturn },
  ytm: { key: 'ytm', label: 'YTM بازه', sortVal: (f) => f.ytmReturn, render: ytmCell, exportValue: (f) => f.ytmReturn },
  declaredRate: { key: 'declaredRate', label: 'نرخ اعلامی', sortVal: (f) => f.declaredRate, render: declaredRateCell, exportValue: (f) => f.declaredRate },
  years: { key: 'years', label: 'سابقه', sortVal: (f) => f.years, render: yearsCell, exportValue: (f) => f.years },
  score: { key: 'score', label: 'شاخص رصد', sortVal: (f) => f.rasadScore, render: (f) => <ScorePill score={f.rasadScore} />, exportValue: (f) => f.rasadScore },
  site: { key: 'site', label: 'سایت', render: (f) => <SiteLink url={f.website} />, exportValue: (f) => f.website },
}

// درآمد ثابت: adds reserve (ذخیره صندوق)
export const fixedIncomeColumns = [
  COL.name,
  COL.symbol,
  COL.size,
  COL.return,
  COL.declaredRate,
  COL.years,
  {
    key: 'reserve',
    label: 'ذخیره صندوق (میلیارد تومان)',
    sortVal: (f) => f.reserve,
    exportValue: (f) => f.reserve,
    render: (f) =>
      f.reserve != null ? (
        <span
          className="text-sm font-dana tabular-nums"
          style={{ fontWeight: 700, color: f.reserve >= 0 ? '#00FF9D' : '#FF3B6B' }}
        >
          {(f.reserve >= 0 ? '+' : '−') + faNum(Math.abs(Math.round(f.reserve)))}
        </span>
      ) : (
        <span className="text-text-muted/40 text-xs">—</span>
      ),
  },
  COL.score,
  COL.site,
]

export const fixedIncomeColumnParts = COL

// غیر درآمد ثابت (سهامی و …): adds risk level + bubble
export const otherFundsColumns = [
  COL.name,
  COL.symbol,
  COL.size,
  COL.return,
  { key: 'risk', label: 'سطح ریسک دارایی', sortVal: (f) => f.risk, render: (f) => <RiskMeter value={f.risk} />, exportValue: (f) => f.risk },
  COL.years,
  {
    key: 'bubble',
    label: 'حباب NAV بازار',
    sortVal: (f) => f.marketBubble,
    exportValue: (f) => f.marketBubble,
    render: (f) => {
      if (f.marketBubbleLoading) return <span className="text-text-muted/40 text-xs animate-pulse">...</span>
      if (f.marketBubble == null) return <span className="text-text-muted/40 text-xs">—</span>
      const v = f.marketBubble
      const positive = v > 0
      const color = Math.abs(v) < 0.1 ? '#8A94A6' : positive ? '#FF3B6B' : '#00D4FF'
      return (
        <div className="flex min-w-[90px] flex-col items-center gap-0.5" title={`آخرین معامله: ${faNum(f.marketPrice)} · NAV ابطال: ${faNum(f.marketRedemptionNav)}`}>
          <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color }}>{(v >= 0 ? '+' : '') + faNum(v.toFixed(2)) + '٪'}</span>
          <span className="text-[0.58rem]" style={{ color, fontWeight: 600 }}>{Math.abs(v) < 0.1 ? 'تقریباً بدون حباب' : positive ? 'حباب مثبت' : 'تخفیف نسبت به NAV'}</span>
        </div>
      )
    },
  },
  COL.score,
  COL.site,
]
