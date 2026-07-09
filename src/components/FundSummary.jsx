import { faNum, fmtPercent } from '../lib/fipiran'
import { useExchangeRate } from '../hooks/useExchangeRate'

export default function FundSummary({ rows, loading, showReturns = true, returnKey = 'rangeReturn', returnLabel = 'بازدهی میانگین' }) {
  const exchangeRate = useExchangeRate()
  const validReturns = rows.filter((row) => Number.isFinite(row[returnKey]))
  const totalAumRial = rows.reduce((sum, row) => sum + (Number(row.sizeRial) || 0), 0)
  const averageReturn = validReturns.length
    ? validReturns.reduce((sum, row) => sum + row[returnKey], 0) / validReturns.length
    : null
  const weightedRows = validReturns.filter((row) => row.sizeRial > 0)
  const weightedBase = weightedRows.reduce((sum, row) => sum + row.sizeRial, 0)
  const weightedReturn = weightedBase
    ? weightedRows.reduce((sum, row) => sum + row[returnKey] * row.sizeRial, 0) / weightedBase
    : null
  const totalAumBT = totalAumRial / 1e10
  const totalDollarMillion = exchangeRate?.priceToman > 0 ? totalAumRial / 10 / exchangeRate.priceToman / 1e6 : null

  const cells = [
    { label: 'تعداد صندوق', value: faNum(rows.length) },
    { label: 'جمع دارایی تحت مدیریت', value: Number.isFinite(totalAumBT) ? `${faNum(Math.round(totalAumBT))} میلیارد تومان` : '—' },
    { label: 'جمع ارزش دلاری', value: Number.isFinite(totalDollarMillion) ? `${faNum(totalDollarMillion.toFixed(1))} میلیون دلار` : '—' },
    ...(showReturns ? [
      { label: returnLabel, value: averageReturn == null ? '—' : fmtPercent(averageReturn) },
      { label: `${returnLabel} وزنی`, value: weightedReturn == null ? '—' : fmtPercent(weightedReturn) },
    ] : []),
  ]

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-neon-cyan/10 bg-surface/45">
      <div className={`grid grid-cols-2 divide-x divide-x-reverse divide-neon-cyan/10 ${showReturns ? 'sm:grid-cols-5' : 'sm:grid-cols-3'}`}>
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
