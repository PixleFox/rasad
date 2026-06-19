import { faNum, fmtSize, fmtPercent } from '../lib/fipiran'
import { ScorePill, RiskMeter, SiteLink } from './FundsTable'

const nameCell = (f) => (
  <div className="flex flex-col gap-0.5 min-w-[140px]">
    <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>
      {f.name}
    </span>
    <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>
      {f.manager}
    </span>
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

const returnCell = (f) => {
  const v = f.rangeReturn
  if (!Number.isFinite(v)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = v >= 0 ? '#00FF9D' : '#FF3B6B'
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color, textShadow: `0 0 10px ${color}40` }}>
      {fmtPercent(v)}
    </span>
  )
}

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
  name: { key: 'name', label: 'نام صندوق', align: 'start', render: nameCell },
  symbol: { key: 'symbol', label: 'نماد', render: symbolCell },
  size: { key: 'size', label: 'دارایی (میلیارد تومان)', sortVal: (f) => f.sizeRial, render: sizeCell },
  return: { key: 'return', label: 'بازدهی در بازه', sortVal: (f) => f.rangeReturn, render: returnCell },
  years: { key: 'years', label: 'سابقه', sortVal: (f) => f.years, render: yearsCell },
  score: { key: 'score', label: 'شاخص رصد', sortVal: (f) => f.rasadScore, render: (f) => <ScorePill score={f.rasadScore} /> },
  site: { key: 'site', label: 'سایت', render: (f) => <SiteLink url={f.website} /> },
}

// درآمد ثابت: adds reserve (ذخیره صندوق)
export const fixedIncomeColumns = [
  COL.name,
  COL.symbol,
  COL.size,
  COL.return,
  COL.years,
  {
    key: 'reserve',
    label: 'ذخیره صندوق (میلیارد تومان)',
    sortVal: (f) => f.reserve,
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

// غیر درآمد ثابت (سهامی و …): adds risk level + bubble
export const otherFundsColumns = [
  COL.name,
  COL.symbol,
  COL.size,
  COL.return,
  { key: 'risk', label: 'سطح ریسک دارایی', sortVal: (f) => f.risk, render: (f) => <RiskMeter value={f.risk} /> },
  COL.years,
  {
    key: 'bubble',
    label: 'حباب',
    sortVal: (f) => f.bubble,
    render: (f) => {
      if (f.bubble == null) return <span className="text-text-muted/40 text-xs">—</span>
      const v = f.bubble
      const color = Math.abs(v) < 1 ? '#8A94A6' : v > 0 ? '#FBBF24' : '#00D4FF'
      return (
        <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>
          {(v >= 0 ? '+' : '−') + faNum(Math.abs(v).toFixed(1)) + '٪'}
        </span>
      )
    },
  },
  COL.score,
  COL.site,
]
