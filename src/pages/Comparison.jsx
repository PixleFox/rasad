import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, FUND_TYPES, faNum, fmtSize, fmtPercent } from '../lib/fipiran'
import { ScorePill, RiskMeter } from '../components/FundsTable'
import RangePicker from '../components/RangePicker'
import { useMarketBubbles } from '../hooks/useMarketBubbles'

// ── Parameter definitions ─────────────────────────────────────────────────────
// Each row: { key, label, getValue, format, render, higherBetter, onlyTypes, excludeTypes, section }
const PARAMS = [
  // ─ Identity
  { key: 'manager', label: 'مدیر صندوق', section: 'هویت', getValue: f => f.manager, format: f => f.manager },
  { key: 'symbol',  label: 'نماد',        section: 'هویت', getValue: f => f.symbol,  format: f => f.symbol || '—' },

  // ─ Performance
  {
    key: 'size', label: 'دارایی (میلیارد تومان)', section: 'عملکرد',
    getValue: f => f.sizeRial, higherBetter: true,
    render: f => <span className="font-dana tabular-nums text-text-primary" style={{ fontWeight: 700 }}>{fmtSize(f.sizeRial)}</span>,
  },
  {
    key: 'return', label: 'بازدهی در بازه', section: 'عملکرد',
    getValue: f => f.rangeReturn, higherBetter: true,
    render: f => {
      const v = f.rangeReturn
      if (!Number.isFinite(v)) return <span className="text-text-muted/40">—</span>
      const color = v >= 0 ? '#00FF9D' : '#FF3B6B'
      return <span className="font-dana tabular-nums text-base" style={{ fontWeight: 900, color, textShadow: `0 0 12px ${color}50` }}>{fmtPercent(v)}</span>
    },
  },
  {
    key: 'score', label: 'شاخص رصد', section: 'عملکرد',
    getValue: f => f.rasadScore, higherBetter: true,
    render: f => <ScorePill score={f.rasadScore} />,
  },
  {
    key: 'years', label: 'سابقه (سال)', section: 'عملکرد',
    getValue: f => f.years, higherBetter: true,
    render: f => f.years != null
      ? <span className="font-dana tabular-nums text-text-primary" style={{ fontWeight: 700 }}>{faNum(f.years.toFixed(1))} سال</span>
      : <span className="text-text-muted/40">—</span>,
  },

  // ─ Risk (non-fixed-income only)
  {
    key: 'risk', label: 'سطح ریسک دارایی', section: 'ریسک',
    excludeTypes: [4],
    getValue: f => f.risk, higherBetter: false,
    render: f => <RiskMeter value={f.risk} />,
  },
  {
    key: 'bubble', label: 'حباب NAV بازار', section: 'ریسک',
    getValue: f => f.marketBubble, higherBetter: false,
    render: f => {
      if (f.marketBubble == null) return <span className="text-text-muted/40">—</span>
      const color = Math.abs(f.marketBubble) < 0.1 ? '#8A94A6' : f.marketBubble > 0 ? '#FF3B6B' : '#00D4FF'
      return <span title={`آخرین معامله: ${faNum(f.marketPrice)} · NAV ابطال: ${faNum(f.marketRedemptionNav)}`} className="font-dana tabular-nums" style={{ fontWeight: 700, color }}>{(f.marketBubble >= 0 ? '+' : '') + faNum(f.marketBubble.toFixed(2)) + '٪'}</span>
    },
  },
]

// ── Search component ──────────────────────────────────────────────────────────
function FundSearch({ allFunds, selectedFunds, onAdd, loading }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const lockedType = selectedFunds[0]?.type ?? null

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return allFunds
      .filter(f => {
        const nameMatch = f.name.toLowerCase().includes(q) || (f.symbol || '').toLowerCase().includes(q)
        const alreadySelected = selectedFunds.some(s => s.regNo === f.regNo)
        return nameMatch && !alreadySelected
      })
      .slice(0, 12)
  }, [query, allFunds, selectedFunds])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = (fund) => {
    onAdd(fund)
    setQuery('')
    setOpen(false)
  }

  const typeLabel = lockedType ? FUND_TYPES[lockedType] : null
  const canAdd = selectedFunds.length < 5

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'در حال بارگذاری داده‌ها...' : canAdd ? 'جستجو بر اساس نام یا نماد صندوق...' : 'حداکثر ۵ صندوق انتخاب شده'}
          disabled={!canAdd || loading}
          className="w-full px-4 py-3 pr-11 rounded-xl border font-dana text-sm text-text-primary bg-surface/60 backdrop-blur-sm outline-none transition-all duration-200 disabled:opacity-50"
          style={{
            fontWeight: 600,
            borderColor: 'rgba(0,212,255,0.25)',
            boxShadow: open && query ? '0 0 20px rgba(0,212,255,0.12)' : 'none',
          }}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery('') } }}
        />
        <svg className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {typeLabel && (
        <p className="text-center text-xs text-neon-cyan/70 font-dana mt-2" style={{ fontWeight: 600 }}>
          فقط صندوق‌های <span className="text-neon-cyan font-dana" style={{ fontWeight: 900 }}>{typeLabel}</span> قابل افزودن هستند
        </p>
      )}

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 left-0 mt-2 z-50 rounded-xl border border-neon-cyan/15 bg-surface/95 backdrop-blur-sm shadow-2xl overflow-hidden"
          >
            {results.map(f => {
              const typeMismatch = lockedType && f.type !== lockedType
              return (
                <button
                  key={f.regNo}
                  onClick={() => !typeMismatch && handleAdd(f)}
                  disabled={typeMismatch}
                  className={`w-full flex items-center justify-between px-4 py-3 text-right border-b border-neon-cyan/5 last:border-0 transition-colors duration-100 ${
                    typeMismatch
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-neon-cyan/8 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 700 }}>{f.name}</span>
                    <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>{f.manager}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mr-3">
                    {f.symbol && (
                      <span className="text-xs font-dana px-1.5 py-0.5 rounded"
                        style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                        {f.symbol}
                      </span>
                    )}
                    <span className={`text-xs font-dana px-2 py-0.5 rounded whitespace-nowrap ${typeMismatch ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-neon-violet/10 text-neon-violet border border-neon-violet/20'}`}
                      style={{ fontWeight: 700 }}>
                      {f.typeLabel || FUND_TYPES[f.type] || 'سایر'}
                    </span>
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Fund column header ────────────────────────────────────────────────────────
function FundHeader({ fund, onRemove, isWinner }) {
  return (
    <div
      className="relative p-3 rounded-xl border transition-all duration-300"
      style={{
        borderColor: isWinner ? 'rgba(0,255,157,0.4)' : 'rgba(0,212,255,0.12)',
        background: isWinner ? 'rgba(0,255,157,0.06)' : 'rgba(255,255,255,0.02)',
        boxShadow: isWinner ? '0 0 20px rgba(0,255,157,0.12)' : 'none',
      }}
    >
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg">🏆</div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white/8 hover:bg-red-500/20 text-text-muted/60 hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
        title="حذف"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <p className="text-text-primary text-sm font-dana leading-snug mt-1 mb-1 pl-5" style={{ fontWeight: 900 }}>
        {fund.name}
      </p>
      <p className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>
        {fund.manager}
      </p>
      {fund.symbol && (
        <span className="inline-block mt-1.5 text-[0.65rem] font-dana px-1.5 py-0.5 rounded"
          style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
          {fund.symbol}
        </span>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const SECTION_COLORS = {
  'هویت':      'rgba(138,148,166,0.06)',
  'عملکرد':    'rgba(0,212,255,0.04)',
  'درآمد ثابت':'rgba(0,255,157,0.04)',
  'ریسک':      'rgba(255,59,107,0.04)',
  'ترکیب':     'rgba(124,58,237,0.04)',
  'لینک':      'rgba(138,148,166,0.04)',
}

export default function Comparison() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [selectedFunds, setSelectedFunds] = useState([])

  const lockedType = selectedFunds[0]?.type ?? null

  const handleAdd = useCallback((fund) => {
    if (selectedFunds.length >= 5) return
    if (lockedType && fund.type !== lockedType) return
    if (selectedFunds.some(s => s.regNo === fund.regNo)) return
    setSelectedFunds(prev => [...prev, fund])
  }, [selectedFunds, lockedType])

  const handleRemove = useCallback((regNo) => {
    setSelectedFunds(prev => prev.filter(f => f.regNo !== regNo))
  }, [])

  // Enrich selected funds against all peers of same type (so score is relative to all peers)
  const enrichedSelected = useMemo(() => {
    if (selectedFunds.length === 0 || funds.length === 0) return []
    const type = selectedFunds[0].type
    const allPeers = funds.filter(f => f.type === type)
    const { enrichFunds: ef } = { enrichFunds: (arr, iso) => {
      // We need to import enrichFunds — already imported above
      return enrichFunds(arr, iso)
    }}
    const enrichedAll = enrichFunds(allPeers, endDate || endISO)
    return enrichedAll.filter(f => selectedFunds.some(s => s.regNo === f.regNo))
  }, [funds, selectedFunds, endDate, endISO])
  const marketSelected = useMarketBubbles(enrichedSelected)

  // Determine winner (highest rasadScore)
  const winnerRegNo = useMemo(() => {
    if (marketSelected.length < 2) return null
    return marketSelected.reduce((best, f) => f.rasadScore > (best?.rasadScore ?? -1) ? f : best, null)?.regNo
  }, [marketSelected])

  // Filter params for current type
  const activeParams = useMemo(() => {
    if (!lockedType) return PARAMS
    return PARAMS.filter(p => {
      if (p.onlyTypes && !p.onlyTypes.includes(lockedType)) return false
      if (p.excludeTypes && p.excludeTypes.includes(lockedType)) return false
      return true
    })
  }, [lockedType])

  // Determine best-value fund per row
  const bestMap = useMemo(() => {
    const map = {}
    for (const param of activeParams) {
      if (param.higherBetter == null || marketSelected.length < 2) continue
      const values = marketSelected.map(f => param.getValue(f))
      const numericValues = values.map(v => (typeof v === 'number' ? v : null))
      const validValues = numericValues.filter(v => v != null)
      if (validValues.length === 0) continue
      const target = param.higherBetter ? Math.max(...validValues) : Math.min(...validValues)
      const bestIdx = numericValues.findIndex(v => v === target)
      if (bestIdx !== -1) map[param.key] = marketSelected[bestIdx]?.regNo
    }
    return map
  }, [activeParams, marketSelected])

  const sections = [...new Set(activeParams.map(p => p.section))]

  return (
    <div className="min-h-screen bg-space pt-20 pb-16 relative overflow-hidden" dir="rtl">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-dana mb-4"
            style={{ fontWeight: 700, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
            سامانه مقایسه
          </span>
          <h1 className="text-3xl sm:text-4xl font-dana text-white mb-3" style={{ fontWeight: 900 }}>
            مقایسه <span className="text-neon-cyan">صندوق‌های</span> سرمایه‌گذاری
          </h1>
          <p className="text-text-muted text-sm font-dana max-w-md mx-auto" style={{ fontWeight: 600 }}>
            تا ۵ صندوق هم‌نوع را انتخاب کنید و پارامترهای آن‌ها را کنار هم مقایسه کنید
          </p>
        </motion.div>

        {/* Date range */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex justify-center mb-8">
          <RangePicker
            startISO={startISO} endISO={endISO}
            onStart={setStartISO} onEnd={setEndISO}
          />
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <FundSearch
            allFunds={funds}
            selectedFunds={selectedFunds}
            onAdd={handleAdd}
            loading={loading}
          />
        </motion.div>

        {/* Empty state */}
        {marketSelected.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-center py-24">
            <div className="text-5xl mb-4">🔭</div>
            <p className="text-text-muted font-dana text-sm" style={{ fontWeight: 600 }}>
              {loading ? 'در حال دریافت داده‌ها از فیپیران...' : 'برای شروع، یک صندوق جستجو کنید'}
            </p>
            {loading && (
              <div className="mt-3 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
              </div>
            )}
          </motion.div>
        )}

        {/* Comparison table */}
        {marketSelected.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="overflow-x-auto rounded-2xl border border-neon-cyan/10 bg-surface/30 backdrop-blur-sm">
              <table className="w-full border-collapse" style={{ minWidth: `${280 + marketSelected.length * 200}px` }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(124,58,237,0.06))' }}>
                    {/* Parameter label column */}
                    <th className="py-4 px-5 text-right sticky right-0 z-20 text-xs text-text-muted font-dana"
                      style={{ fontWeight: 600, background: 'rgba(5,8,15,0.95)', minWidth: 180, borderLeft: '1px solid rgba(0,212,255,0.08)' }}>
                      پارامتر
                    </th>
                    {/* Fund columns */}
                    {marketSelected.map(f => (
                      <th key={f.regNo} className="py-3 px-3 text-center" style={{ minWidth: 190 }}>
                        <FundHeader
                          fund={f}
                          onRemove={() => handleRemove(f.regNo)}
                          isWinner={f.regNo === winnerRegNo}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map(section => {
                    const sectionParams = activeParams.filter(p => p.section === section)
                    return sectionParams.map((param, idx) => (
                      <tr
                        key={param.key}
                        className="border-t border-neon-cyan/5 hover:bg-white/[0.02] transition-colors"
                        style={{ background: idx === 0 && section !== 'هویت' ? SECTION_COLORS[section] : undefined }}
                      >
                        {/* Label cell (sticky) */}
                        <td
                          className="py-3.5 px-5 text-right sticky right-0 z-10"
                          style={{ background: 'rgba(5,8,15,0.92)', borderLeft: '1px solid rgba(0,212,255,0.06)' }}
                        >
                          {idx === 0 && (
                            <span className="block text-[0.6rem] text-text-muted/50 font-dana mb-0.5 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                              {section}
                            </span>
                          )}
                          <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
                            {param.label}
                          </span>
                        </td>

                        {/* Value cells */}
                        {marketSelected.map(f => {
                          const isBest = bestMap[param.key] === f.regNo && marketSelected.length > 1
                          return (
                            <td
                              key={f.regNo}
                              className="py-3.5 px-4 text-center"
                              style={{
                                background: isBest ? 'rgba(0,255,157,0.05)' : undefined,
                                borderLeft: isBest ? '1px solid rgba(0,255,157,0.15)' : '1px solid rgba(0,212,255,0.03)',
                              }}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                {param.render
                                  ? param.render(f)
                                  : <span className="text-sm font-dana text-text-primary" style={{ fontWeight: 600 }}>
                                      {param.format ? param.format(f) : String(param.getValue(f) ?? '—')}
                                    </span>
                                }
                                {isBest && (
                                  <span title="بهترین مقدار" className="text-[0.65rem] text-neon-green font-dana flex-shrink-0" style={{ fontWeight: 900 }}>★</span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-center text-text-muted text-xs font-dana mt-5" style={{ fontWeight: 600 }}>
              منبع: فیپیران · ★ بهترین مقدار در هر ردیف · شاخص رصد نسبت به همه صندوق‌های هم‌نوع محاسبه می‌شود
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
