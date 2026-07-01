import { useState, useMemo } from 'react'
import { fmtSize } from '../lib/fipiran'

const MEDAL = {
  0: { icon: '🏆', color: '#FFD700', shadow: '#FFD70060' },
  1: { icon: '🥈', color: '#C0C0C0', shadow: '#C0C0C060' },
  2: { icon: '🥉', color: '#CD7F32', shadow: '#CD7F3260' },
}

// Generic dark-neon data table.
// columns: [{ key, label, align?, sortVal?(row), render(row), thClass?, tdClass? }]
// goodSortKeys: sort keys where higher value = better (shows medals for top 3 when sorted desc)
export default function FundsTable({
  columns,
  rows,
  defaultSortKey,
  defaultSortDir = 'desc',
  minWidth = 760,
  loading,
  error,
  onRetry,
  emptyText,
  goodSortKeys = ['score', 'return', 'size', 'years', 'reserve'],
  rowKey = (row, i) => row.regNo ?? row.id ?? i,
  rankField = null, // when set: rank cell shows row[rankField]; medals from row[rankField] value
  showTotalAUM = false,
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? null)
  const [sortDir, setSortDir] = useState(defaultSortDir)

  const getMedal = (row, i) => {
    if (rankField != null) {
      const r = row[rankField]
      return r >= 1 && r <= 3 ? MEDAL[r - 1] : null
    }
    return goodSortKeys.includes(sortKey) && sortDir === 'desc' ? MEDAL[i] : null
  }
  const getRankNum = (row, i) => (rankField != null ? row[rankField] : i + 1)
  // subtle row tint for top-3 when rankField is active
  const getRowStyle = (row) => {
    if (rankField == null) return {}
    const tints = ['rgba(255,215,0,0.04)', 'rgba(192,192,192,0.03)', 'rgba(205,127,50,0.03)']
    return row[rankField] >= 1 && row[rankField] <= 3
      ? { background: tints[row[rankField] - 1] }
      : {}
  }

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortVal) return rows
    const dir = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = col.sortVal(a)
      const vb = col.sortVal(b)
      if (va == null) return 1
      if (vb == null) return -1
      return (va - vb) * dir
    })
  }, [rows, sortKey, sortDir, columns])

  const toggleSort = (col) => {
    if (!col.sortVal) return
    if (sortKey === col.key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(col.key)
      setSortDir('desc')
    }
  }

  // Rank column injected as first column
  const rankCol = {
    key: '__rank',
    label: '#',
    thClass: 'w-10',
    render: (row, i) => <RankCell rank={getRankNum(row, i)} medal={getMedal(row, i)} />,
  }
  const allColumns = [rankCol, ...columns]

  return (
    <div className="rounded-2xl border border-neon-cyan/10 bg-surface/40 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead>
            <tr
              className="text-xs font-dana text-text-muted"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))' }}
            >
              {allColumns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  className={`py-3.5 px-3 whitespace-nowrap font-normal ${
                    col.align === 'start' ? 'text-right' : 'text-center'
                  } ${col.sortVal ? 'cursor-pointer hover:text-neon-cyan transition-colors select-none' : ''} ${
                    col.thClass || ''
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortVal && sortKey === col.key && (
                      <span className="text-neon-cyan text-[0.6rem]">{sortDir === 'desc' ? '▼' : '▲'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Total AUM footer */}
            {showTotalAUM && !loading && sorted.length > 0 && (() => {
              const totalRial = sorted.reduce((s, r) => s + (r.sizeRial || 0), 0)
              const sizeColIdx = allColumns.findIndex((c) => c.key === 'size')
              return (
                <tr className="border-t-2 border-neon-cyan/20" style={{ background: 'rgba(0,212,255,0.04)' }}>
                  {allColumns.map((col, ci) => (
                    <td key={col.key} className={`py-3 px-3 ${col.align === 'start' ? 'text-right' : 'text-center'}`}>
                      {ci === 0 ? (
                        <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 700 }}>مجموع</span>
                      ) : ci === sizeColIdx ? (
                        <span className="text-neon-cyan text-sm font-dana tabular-nums" style={{ fontWeight: 900 }}>
                          {fmtSize(totalRial)}
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              )
            })()}
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-neon-cyan/5">
                  {allColumns.map((col) => (
                    <td key={col.key} className="py-4 px-3">
                      <div className="h-3.5 w-full max-w-[90px] mx-auto rounded bg-white/5 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={allColumns.length} className="py-16 text-center">
                  <p className="text-neon-pink text-sm font-dana mb-2" style={{ fontWeight: 600 }}>{error}</p>
                  {onRetry && (
                    <button onClick={onRetry} className="text-neon-cyan text-sm font-dana cursor-pointer hover:text-white" style={{ fontWeight: 600 }}>
                      تلاش دوباره
                    </button>
                  )}
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={allColumns.length} className="py-16 text-center text-text-muted text-sm font-dana" style={{ fontWeight: 600 }}>
                  {emptyText || 'صندوقی یافت نشد.'}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  className="border-t border-neon-cyan/5 hover:bg-neon-cyan/5 transition-colors duration-150"
                  style={getRowStyle(row)}
                >
                  {allColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-4 px-3 ${col.align === 'start' ? 'text-right' : 'text-center'} ${col.tdClass || ''}`}
                    >
                      {col.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Shared cell renderers ────────────────────────────────────────────────────
function RankCell({ rank, medal }) {
  if (medal) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg leading-none">{medal.icon}</span>
        <span
          className="text-[0.6rem] font-dana tabular-nums"
          style={{ fontWeight: 700, color: medal.color, textShadow: `0 0 8px ${medal.shadow}` }}
        >
          {rank}
        </span>
      </div>
    )
  }
  return (
    <span className="text-text-muted/60 text-xs font-dana tabular-nums" style={{ fontWeight: 600 }}>
      {Number(rank).toLocaleString('fa-IR')}
    </span>
  )
}

export function ScorePill({ score }) {
  const color = score >= 80 ? '#00FF9D' : score >= 60 ? '#00D4FF' : score >= 40 ? '#FBBF24' : '#FF3B6B'
  return (
    <span
      className="inline-flex items-center justify-center w-10 h-8 rounded-lg text-sm font-dana tabular-nums"
      style={{
        fontWeight: 900,
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 12px ${color}25`,
      }}
    >
      {Number(score).toLocaleString('fa-IR')}
    </span>
  )
}

export function RiskMeter({ value }) {
  const color = value >= 66 ? '#FF3B6B' : value >= 33 ? '#FBBF24' : '#00FF9D'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-dana tabular-nums" style={{ fontWeight: 700, color }}>
        {Number(value).toLocaleString('fa-IR')}
      </span>
      <div className="w-16 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
    </div>
  )
}

export function SiteLink({ url }) {
  if (!url) return <span className="text-text-muted/40 text-xs">—</span>
  const href = url.startsWith('http') ? url : `https://${url}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors duration-150 cursor-pointer"
      aria-label="سایت صندوق"
      title={url}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  )
}
