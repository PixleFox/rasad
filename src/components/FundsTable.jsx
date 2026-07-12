import { useEffect, useMemo, useState } from 'react'
import { Download, Search, ChevronDown, ChevronUp, Settings2, Eye, EyeOff, GripVertical, RotateCcw, X } from 'lucide-react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { exportRowsToCsv } from '../lib/tableExport'
import PhoneCaptureModal from './PhoneCaptureModal'
import { getSavedExportPhone, recordExportLead, saveExportPhone } from '../lib/exportLeads'
import { useExchangeRate } from '../hooks/useExchangeRate'

const MEDAL = {
  0: { icon: '🏆', color: '#FFD700', shadow: '#FFD70060' },
  1: { icon: '🥈', color: '#C0C0C0', shadow: '#C0C0C060' },
  2: { icon: '🥉', color: '#CD7F32', shadow: '#CD7F3260' },
}

const CUSTOMIZER_TUTORIAL_KEY = 'rasad:table-customizer-tutorial:seen'
let customizerTutorialTimerActive = false

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
  customizeColumns = true,
  defaultHiddenColumnKeys = [],
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? null)
  const [sortDir, setSortDir] = useState(defaultSortDir)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [columnPrefs, setColumnPrefs] = useState(null)
  const [draggedKey, setDraggedKey] = useState(null)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const exchangeRate = useExchangeRate()

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
  const hasFundAum = rows.some((row) => Number(row.sizeRial) > 0)
  const dollarColumn = {
    key: '__dollarValue',
    label: 'ارزش صندوق (میلیون دلار)',
    sortVal: (row) => exchangeRate?.priceToman > 0 ? row.sizeRial / 10 / exchangeRate.priceToman / 1e6 : null,
    exportValue: (row) => exchangeRate?.priceToman > 0 ? row.sizeRial / 10 / exchangeRate.priceToman / 1e6 : null,
    render: (row) => {
      const value = exchangeRate?.priceToman > 0 ? row.sizeRial / 10 / exchangeRate.priceToman / 1e6 : null
      return <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>{Number.isFinite(value) ? value.toLocaleString('fa-IR', { maximumFractionDigits: 1 }) : '—'}</span>
    },
  }
  const siteColumn = columns.find((col) => col.key === 'site')
  const columnsBeforeSite = siteColumn ? columns.filter((col) => col.key !== 'site') : columns
  const allColumns = [rankCol, ...columnsBeforeSite, ...(hasFundAum ? [dollarColumn] : []), ...(siteColumn ? [siteColumn] : [])]
  const columnKeySignature = allColumns.map((col) => col.key).join('|')
  const defaultHiddenSignature = defaultHiddenColumnKeys.join('|')
  const customizerEnabled = customizeColumns && location.pathname !== '/'
  const storageKey = `rasad:table-columns:${location.pathname}:${exportFileName}:${columnKeySignature}`
  const markTutorialSeen = () => {
    setTutorialOpen(false)
    try {
      window.sessionStorage.setItem(CUSTOMIZER_TUTORIAL_KEY, '1')
    } catch {
      // Session storage may be unavailable; closing still hides it for this render.
    }
  }

  const buildDefaultPrefs = () => {
    const hidden = new Set(defaultHiddenColumnKeys)
    return allColumns.map((col) => ({ key: col.key, visible: !hidden.has(col.key) }))
  }
  const reconcilePrefs = (savedPrefs) => {
    const defaults = buildDefaultPrefs()
    const available = new Set(defaults.map((item) => item.key))
    const defaultByKey = new Map(defaults.map((item) => [item.key, item]))
    const saved = Array.isArray(savedPrefs) ? savedPrefs : []
    const savedItems = saved
      .filter((item) => available.has(item?.key))
      .map((item) => ({ key: item.key, visible: Boolean(item.visible) }))
    const savedKeys = new Set(savedItems.map((item) => item.key))
    const next = [
      ...savedItems,
      ...defaults.filter((item) => !savedKeys.has(item.key)),
    ].map((item) => ({
      key: item.key,
      visible: item.visible ?? defaultByKey.get(item.key)?.visible ?? true,
    }))
    return next.some((item) => item.visible)
      ? next
      : next.map((item, index) => ({ ...item, visible: index === 0 }))
  }

  useEffect(() => {
    if (!customizerEnabled) {
      setColumnPrefs(null)
      return
    }
    try {
      const saved = window.localStorage.getItem(storageKey)
      setColumnPrefs(reconcilePrefs(saved ? JSON.parse(saved) : null))
    } catch {
      setColumnPrefs(reconcilePrefs(null))
    }
  }, [customizerEnabled, storageKey, columnKeySignature, defaultHiddenSignature])

  useEffect(() => {
    if (!customizerEnabled || loading || error || customizerTutorialTimerActive) return undefined
    try {
      if (window.sessionStorage.getItem(CUSTOMIZER_TUTORIAL_KEY)) return undefined
    } catch {
      return undefined
    }
    customizerTutorialTimerActive = true
    const timer = window.setTimeout(() => {
      try {
        if (!window.sessionStorage.getItem(CUSTOMIZER_TUTORIAL_KEY)) {
          setTutorialOpen(true)
          window.sessionStorage.setItem(CUSTOMIZER_TUTORIAL_KEY, '1')
        }
      } catch {
        setTutorialOpen(true)
      } finally {
        customizerTutorialTimerActive = false
      }
    }, 10000)
    return () => {
      window.clearTimeout(timer)
      customizerTutorialTimerActive = false
    }
  }, [customizerEnabled, loading, error])

  const savePrefs = (next) => {
    setColumnPrefs(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // Local storage may be unavailable in private browsing; the live state still works.
    }
  }

  const prefs = columnPrefs || buildDefaultPrefs()
  const columnsByKey = new Map(allColumns.map((col) => [col.key, col]))
  const visibleColumns = customizerEnabled
    ? prefs.filter((item) => item.visible).map((item) => columnsByKey.get(item.key)).filter(Boolean)
    : allColumns
  const customizerItems = prefs.map((item) => ({ ...item, column: columnsByKey.get(item.key) })).filter((item) => item.column)
  const visibleCount = customizerItems.filter((item) => item.visible).length
  const moveColumn = (fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return
    const fromIndex = prefs.findIndex((item) => item.key === fromKey)
    const toIndex = prefs.findIndex((item) => item.key === toKey)
    if (fromIndex < 0 || toIndex < 0) return
    const next = [...prefs]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    savePrefs(next)
  }
  const toggleColumn = (key) => {
    const item = prefs.find((entry) => entry.key === key)
    if (!item || (item.visible && visibleCount <= 1)) return
    savePrefs(prefs.map((entry) => entry.key === key ? { ...entry, visible: !entry.visible } : entry))
  }
  const resetColumns = () => savePrefs(buildDefaultPrefs())

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!searchable || !normalized) return rows
    return rows.filter((row) => {
      const values = visibleColumns.flatMap((col) => {
        const exported = col.exportValue?.(row)
        return [exported, row[col.key]]
      })
      return values
        .filter((value) => value != null)
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [rows, visibleColumns, query, searchable])

  const sorted = useMemo(() => {
    if (!sortKey) return filteredRows
    const col = visibleColumns.find((c) => c.key === sortKey)
    if (!col?.sortVal) return filteredRows
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filteredRows].sort((a, b) => {
      const va = col.sortVal(a)
      const vb = col.sortVal(b)
      if (va == null) return 1
      if (vb == null) return -1
      return (va - vb) * dir
    })
  }, [filteredRows, sortKey, sortDir, visibleColumns])

  const toggleSort = (col) => {
    if (!col.sortVal) return
    if (sortKey === col.key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else {
      setSortKey(col.key)
      setSortDir('desc')
    }
  }

  const exportColumns = allColumns.map((col) => ({
    ...col,
    exportValue: col.exportValue || ((row, i) => {
      if (col.key === '__rank') return getRankNum(row, i)
      const value = row[col.key]
      if (value == null && col.sortVal) return col.sortVal(row)
      return value
    }),
  })).filter((col) => visibleColumns.some((visible) => visible.key === col.key))
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
      {(exportEnabled || searchable || customizerEnabled) && (
        <div className="relative flex flex-col gap-2 px-3 py-2 border-b border-neon-cyan/10 sm:flex-row sm:items-center sm:justify-between" dir="ltr">
          <div className="flex items-center gap-2" dir="rtl">
            {exportEnabled && (
              <button
                type="button"
                onClick={handleExport}
                disabled={!canExport}
                className="inline-flex items-center gap-2 rounded-lg border border-neon-green/30 bg-neon-green/10 px-3 py-1.5 text-xs font-dana text-neon-green transition-colors hover:border-neon-green/60 hover:bg-neon-green/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-text-muted/50"
                style={{ fontWeight: 700 }}
                title="خروجی اکسل"
              >
                <Download size={15} aria-hidden="true" />
                خروجی اکسل
              </button>
            )}
            {customizerEnabled && (
              <button
                type="button"
                onClick={() => {
                  markTutorialSeen()
                  setCustomizerOpen((open) => !open)
                }}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                  customizerOpen
                    ? 'border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_18px_rgba(0,212,255,0.18)]'
                    : 'border-neon-cyan/20 bg-space/45 text-text-muted hover:border-neon-cyan/50 hover:text-neon-cyan'
                }`}
                title="شخصی‌سازی ستون‌ها"
                aria-label="شخصی‌سازی ستون‌ها"
              >
                <Settings2 size={16} aria-hidden="true" />
              </button>
            )}
          </div>
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
          {customizerEnabled && customizerOpen && (
            <div
              className="absolute left-3 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neon-cyan/20 bg-[#08111f]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-neon-cyan/10 px-3 py-2">
                <div>
                  <p className="text-xs font-dana text-text-primary" style={{ fontWeight: 900 }}>شخصی‌سازی جدول</p>
                  <p className="mt-0.5 text-[0.62rem] font-dana text-text-muted/70" style={{ fontWeight: 600 }}>ستون‌ها را بکش، مخفی کن، یا برگردان.</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={resetColumns}
                    className="grid h-7 w-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-white/5 hover:text-neon-cyan"
                    title="بازنشانی"
                    aria-label="بازنشانی ستون‌ها"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomizerOpen(false)}
                    className="grid h-7 w-7 place-items-center rounded-md text-text-muted transition-colors hover:bg-white/5 hover:text-neon-pink"
                    title="بستن"
                    aria-label="بستن"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                {customizerItems.map((item) => (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={() => setDraggedKey(item.key)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      moveColumn(draggedKey, item.key)
                      setDraggedKey(null)
                    }}
                    onDragEnd={() => setDraggedKey(null)}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition-all ${
                      item.visible
                        ? 'border-white/10 bg-white/[0.035] text-text-primary'
                        : 'border-white/5 bg-white/[0.015] text-text-muted/45'
                    } ${draggedKey === item.key ? 'scale-[0.99] border-neon-cyan/50 opacity-70' : ''}`}
                  >
                    <GripVertical size={15} className="shrink-0 cursor-grab text-text-muted/60" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => toggleColumn(item.key)}
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md transition-colors ${
                        item.visible ? 'text-neon-cyan hover:bg-neon-cyan/10' : 'text-text-muted/45 hover:bg-white/5 hover:text-text-muted'
                      }`}
                      title={item.visible ? 'مخفی کردن ستون' : 'نمایش ستون'}
                      aria-label={item.visible ? 'مخفی کردن ستون' : 'نمایش ستون'}
                    >
                      {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <span className="min-w-0 flex-1 truncate text-xs font-dana" style={{ fontWeight: 700 }}>{item.column.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {customizerEnabled && tutorialOpen && !customizerOpen && (
            <div
              className="absolute left-1 top-12 z-40 flex w-[min(28rem,calc(100vw-1.5rem))] items-end gap-2 sm:left-3"
              dir="rtl"
            >
              <img
                src="/assets/table-customizer-guide.png"
                alt=""
                className="h-28 w-auto shrink-0 rounded-xl object-cover object-top shadow-2xl shadow-neon-cyan/10 sm:h-36"
                loading="lazy"
              />
              <div className="relative mb-5 flex-1 rounded-2xl border border-neon-cyan/25 bg-[#08111f]/95 px-4 py-3 text-right shadow-2xl shadow-black/35 backdrop-blur-xl">
                <span className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b border-l border-neon-cyan/25 bg-[#08111f]" />
                <span className="absolute -top-7 left-8 h-7 w-7 border-l-2 border-t-2 border-neon-cyan/70" style={{ transform: 'rotate(45deg)' }} />
                <button
                  type="button"
                  onClick={markTutorialSeen}
                  className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-md text-text-muted transition-colors hover:bg-white/5 hover:text-neon-pink"
                  title="بستن"
                  aria-label="بستن راهنما"
                >
                  <X size={13} />
                </button>
                <p className="pl-7 text-sm font-dana text-white" style={{ fontWeight: 900 }}>جدولت رو خودت بچین</p>
                <p className="mt-1 text-xs font-dana leading-5 text-text-muted" style={{ fontWeight: 600 }}>
                  از این چرخ‌دنده می‌تونی ستون‌ها رو حذف و اضافه کنی، ترتیبشون رو عوض کنی و جدول رو دقیقاً مطابق نیازت بچینی.
                </p>
              </div>
            </div>
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
              {visibleColumns.map((col) => (
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
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="py-4 px-3">
                      <div className="h-3.5 w-full max-w-[90px] mx-auto rounded bg-white/5 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={visibleColumns.length} className="py-16 text-center">
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
                <td colSpan={visibleColumns.length} className="py-16 text-center text-text-muted text-sm font-dana" style={{ fontWeight: 600 }}>
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
                  {visibleColumns.map((col) => (
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

export function ScorePill({ score, max = 100 }) {
  const ratio = max > 0 ? (Number(score) / max) * 100 : Number(score)
  const color = ratio >= 80 ? '#00FF9D' : ratio >= 60 ? '#00D4FF' : ratio >= 40 ? '#FBBF24' : '#FF3B6B'
  return (
    <span
      className="inline-flex h-8 min-w-14 items-center justify-center rounded-lg px-2 text-sm font-dana tabular-nums whitespace-nowrap"
      style={{
        fontWeight: 900,
        color,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 12px ${color}25`,
      }}
    >
      {Number(score).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}
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
