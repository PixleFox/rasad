import { faNum, fmtPercent } from '../lib/fipiran'

export default function FundSummary({ rows, loading }) {
  const validReturns = rows.filter((row) => Number.isFinite(row.rangeReturn))
  const totalAumRial = rows.reduce((sum, row) => sum + (Number(row.sizeRial) || 0), 0)
  const averageReturn = validReturns.length
    ? validReturns.reduce((sum, row) => sum + row.rangeReturn, 0) / validReturns.length
    : null
  const weightedRows = validReturns.filter((row) => row.sizeRial > 0)
  const weightedBase = weightedRows.reduce((sum, row) => sum + row.sizeRial, 0)
  const weightedReturn = weightedBase
    ? weightedRows.reduce((sum, row) => sum + row.rangeReturn * row.sizeRial, 0) / weightedBase
    : null
  const totalAumBT = totalAumRial / 1e10

  const cells = [
    { label: 'تعداد صندوق', value: faNum(rows.length) },
    { label: 'جمع دارایی تحت مدیریت', value: Number.isFinite(totalAumBT) ? `${faNum(Math.round(totalAumBT))} میلیارد تومان` : '—' },
    { label: 'بازدهی میانگین', value: averageReturn == null ? '—' : fmtPercent(averageReturn) },
    { label: 'بازدهی میانگین وزنی', value: weightedReturn == null ? '—' : fmtPercent(weightedReturn) },
  ]

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-neon-cyan/10 bg-surface/45">
      <div className="grid grid-cols-2 divide-x divide-x-reverse divide-neon-cyan/10 sm:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-0 border-b border-neon-cyan/10 px-3 py-3 text-center last:border-b-0 sm:border-b-0">
            <div className="truncate text-[0.65rem] text-text-muted" style={{ fontWeight: 600 }}>{cell.label}</div>
            <div className="mt-1 truncate text-sm text-text-primary sm:text-base" style={{ fontWeight: 900 }}>{loading ? '...' : cell.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
