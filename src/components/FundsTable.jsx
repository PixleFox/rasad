import { useState, useMemo } from 'react'
import { Download, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { exportRowsToCsv } from '../lib/tableExport'
import PhoneCaptureModal from './PhoneCaptureModal'
import { getSavedExportPhone, recordExportLead, saveExportPhone } from '../lib/exportLeads'

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
  exportFileName = 'funds-table',
  exportEnabled = true,
  searchable = true,
  searchPlaceholder = 'جستجو در جدول...',
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? null)
  const [sortDir, setSortDir] = useState(defaultSortDir)
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)

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
    if (row.isNew) return { background: 'rgba(0,255,157,0.055)', boxShadow: 'inset -3px 0 #00FF9D' }
    if (rankField == null) return {}
    const tints = ['rgba(255,215,0,0.04)', 'rgba(192,192,192,0.03)', 'rgba(205,127,50,0.03)']
    return row[rankField] >= 1 && row[rankField] <= 3
      ? { background: tints[row[rankField] - 1] }
      : {}
  }

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!searchable || !normalized) return rows
    return rows.filter((row) => {
      const values = columns.flatMap((col) => {
        const exported = col.exportValue?.(row)
        return [exported, row[col.key]]
      })
      return values
        .filter((value) => value != null)
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [rows, columns, query, searchable])

  const sorted = useMemo(() => {
    if (!sortKey) return filteredRows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortVal) return filteredRows
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filteredRows].sort((a, b) => {
      const va = col.sortVal(a)
      const vb = col.sortVal(b)
      if (va == null) return 1
      if (vb == null) return -1
      return (va - vb) * dir
    })
  }, [filteredRows, sortKey, sortDir, columns])

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
    render: (row, i) => (
      <div className="flex flex-col items-center gap-1">
        {row.isNew && <span className="whitespace-nowrap rounded bg-neon-green/15 px-1 py-0.5 text-[0.55rem] text-neon-green" title="کمتر از ۳۰ روز از تأسیس">تازه‌تأسیس</span>}
        <RankCell rank={getRankNum(row, i)} medal={getMedal(row, i)} />
      </div>
    ),
  }
  const allColumns = [rankCol, ...columns]
  const exportColumns = allColumns.map((col) => ({
    ...col,
    exportValue: col.exportValue || ((row, i) => {
      if (col.key === '__rank') return getRankNum(row, i)
      const value = row[col.key]
      if (value == null && col.sortVal) return col.sortVal(row)
      return value
    }),
  }))
  const canExport = exportEnabled && !loading && !error && sorted.length > 0
  const finishExport = async (phone) => {
    setExportBusy(true)
    try {
      await recordExportLead({ phone, page: window.location.pathname, fileName: exportFileName })
    } catch {
      // The export remains available if the lead service is temporarily unavailable.
    } finally {
      setExportBusy(false)
      setPhoneModalOpen(false)
    }
    exportRowsToCsv({ columns: exportColumns, rows: sorted, fileName: exportFileName })
  }
  const handleExport = () => {
    if (!canExport) return
    const savedPhone = getSavedExportPhone()
    if (savedPhone) finishExport(savedPhone)
    else setPhoneModalOpen(true)
  }

  return (
    <div className="rounded-2xl border border-neon-cyan/10 bg-surface/40 backdrop-blur-sm overflow-hidden">
      <PhoneCaptureModal
        open={phoneModalOpen}
        busy={exportBusy}
        onClose={() => setPhoneModalOpen(false)}
        onSubmit={(phone) => finishExport(saveExportPhone(phone))}
      />
      {(exportEnabled || searchable) && (
        <div className="flex flex-col gap-2 px-3 py-2 border-b border-neon-cyan/10 sm:flex-row sm:items-center sm:justify-between" dir="ltr">
          {exportEnabled && (
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-lg border border-neon-green/30 bg-neon-green/10 px-3 py-1.5 text-xs font-dana text-neon-green transition-colors hover:border-neon-green/60 hover:bg-neon-green/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-text-muted/50"
            style={{ fontWeight: 700 }}
            title="خروجی اکسل"
            dir="rtl"
          >
            <Download size={15} aria-hidden="true" />
            خروجی اکسل
          </button>
          )}
          {searchable && (
            <label className="relative flex-1 sm:max-w-xs" dir="rtl">
              <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-neon-cyan/15 bg-space/45 py-2 pr-8 pl-3 text-xs font-dana text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-neon-cyan/50"
                style={{ fontWeight: 600 }}
              />
            </label>
          )}
        </div>
      )}
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
                      <span className="text-neon-cyan">{sortDir === 'desc' ? <ChevronDown size={13} /> : <ChevronUp size={13} />}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
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
                  {query.trim() ? 'نتیجه‌ای برای جستجو پیدا نشد.' : emptyText || 'صندوقی یافت نشد.'}
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
