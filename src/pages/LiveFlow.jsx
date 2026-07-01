import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchFundCompare, todayISO, faNum, FUND_TYPES } from '../lib/fipiran'

const TSE = '/tsetmc'
const _cache = new Map()

async function tse(path, timeoutMs = 8000) {
  if (_cache.has(path)) return _cache.get(path)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(`${TSE}/${path}`, { signal: ctrl.signal })
    if (!r.ok) throw new Error(r.status)
    const d = await r.json()
    _cache.set(path, d)
    setTimeout(() => _cache.delete(path), 90000)
    return d
  } finally { clearTimeout(timer) }
}

async function fetchFundLive(insCode) {
  const [ctRes, prRes] = await Promise.all([
    tse(`ClientType/GetClientType/${insCode}/1/0`, 6000),
    tse(`ClosingPrice/GetClosingPriceInfo/${insCode}`, 6000),
  ])
  const c = ctRes.clientType
  const p = prRes.closingPriceInfo
  if (!c || !p) return null

  const pClose = p.pClosing ?? 0
  const pLast  = p.pDrCotVal ?? 0
  const pYest  = p.priceYesterday ?? 0
  const netVol = (c.buy_I_Volume ?? 0) - (c.sell_I_Volume ?? 0)
  const volume = p.qTotTran5J ?? 0

  return {
    netFlow:      (netVol * pClose) / 1e10,          // ورود پول (م.ت)
    tradeValue:   (volume * pClose) / 1e10,           // ارزش معاملات (م.ت)
    changeLast:   pYest > 0 ? ((pLast  - pYest) / pYest) * 100 : null, // درصد آخرین
    changeClose:  pYest > 0 ? ((pClose - pYest) / pYest) * 100 : null, // درصد پایانی
  }
}

const TYPE_LABELS = {
  4: 'درآمد ثابت', 5: 'کالایی', 6: 'سهامی', 7: 'مختلط',
  11: 'بازارگردانی', 12: 'جسورانه', 21: 'بخشی', 22: 'اهرمی', 23: 'شاخصی',
}

const REFRESH = 90

export default function LiveFlow() {
  const [phase, setPhase] = useState('init')
  const [rows, setRows] = useState([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [ts, setTs] = useState(null)
  const [cd, setCd] = useState(REFRESH)
  const [now, setNow] = useState(new Date())
  const [sortKey, setSortKey] = useState('netFlow')
  const [sortDir, setSortDir] = useState('desc')
  const [typeFilter, setTypeFilter] = useState(0)
  const fundsRef = useRef([])
  const liveRef = useRef({})

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const buildRows = () =>
    fundsRef.current.map((f) => ({
      ...f,
      ...(liveRef.current[f.insCode] ?? {}),
    }))

  const fetchLive = useCallback(async () => {
    const funds = fundsRef.current
    if (!funds.length) return
    setLoadedCount(0)
    const results = {}
    await Promise.all(funds.map(async (f) => {
      try {
        results[f.insCode] = await fetchFundLive(f.insCode)
      } catch {}
      setLoadedCount((c) => c + 1)
    }))
    liveRef.current = results
    setRows(buildRows())
    setTs(new Date())
    setCd(REFRESH)
  }, [])

  const init = useCallback(async () => {
    try {
      setPhase('init')
      const snap = await fetchFundCompare(todayISO())
      const etfs = snap.funds.filter((f) => f.isETF && !f.isCharity && f.insCode && f.symbol)
      fundsRef.current = etfs
      setTotalCount(etfs.length)
      await fetchLive()
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }, [fetchLive])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    const t = setInterval(() => {
      setCd((c) => {
        if (c <= 1) {
          _cache.clear()
          fetchLive()
          return REFRESH
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [fetchLive])

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const typeOptions = useMemo(() => {
    const seen = new Set()
    fundsRef.current.forEach((f) => seen.add(f.type))
    return [{ id: 0, label: 'همه' }, ...[...seen].sort().map((t) => ({ id: t, label: TYPE_LABELS[t] || FUND_TYPES[t] || 'سایر' }))]
  }, [phase])

  const displayRows = useMemo(() => {
    let r = typeFilter === 0 ? rows : rows.filter((f) => f.type === typeFilter)
    const dir = sortDir === 'desc' ? -1 : 1
    return [...r].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity
      const bv = b[sortKey] ?? -Infinity
      return (bv - av) * dir
    })
  }, [rows, typeFilter, sortKey, sortDir])

  const fa = (n, dec = 1) =>
    Number.isFinite(Number(n))
      ? Number(n).toLocaleString('fa-IR', { maximumFractionDigits: dec, minimumFractionDigits: dec })
      : '—'

  const pctCell = (v) => {
    if (!Number.isFinite(v)) return <span className="text-text-muted/40">—</span>
    const color = v > 0 ? '#00FF9D' : v < 0 ? '#FF3B6B' : '#8A94A6'
    return <span className="tabular-nums font-dana text-sm" style={{ fontWeight: 800, color }}>{(v > 0 ? '+' : '') + fa(v, 2)}٪</span>
  }

  const flowCell = (v) => {
    if (!Number.isFinite(v)) return <span className="text-text-muted/40">—</span>
    const color = v > 0 ? '#00FF9D' : v < 0 ? '#FF3B6B' : '#8A94A6'
    return <span className="tabular-nums font-dana text-sm" style={{ fontWeight: 800, color }}>{(v > 0 ? '+' : '') + fa(v)}م.ت</span>
  }

  const COLS = [
    { key: 'symbol',      label: 'نماد',             sort: false },
    { key: 'netFlow',     label: 'ورود پول (م.ت)',    sort: true  },
    { key: 'tradeValue',  label: 'ارزش معاملات (م.ت)', sort: true },
    { key: 'changeLast',  label: 'درصد آخرین',        sort: true  },
    { key: 'changeClose', label: 'درصد پایانی',       sort: true  },
  ]

  return (
    <div className="min-h-screen font-dana" dir="rtl" style={{ background: '#07090F', color: '#CBD5E1' }}>
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border"
            style={{ borderColor: 'rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
            <span className="text-xs font-dana" style={{ fontWeight: 600, color: '#00D4FF' }}>داده‌های زنده TSE</span>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-dana text-white" style={{ fontWeight: 900 }}>
                جریان پول <span style={{ color: '#00D4FF', textShadow: '0 0 30px rgba(0,212,255,0.5)' }}>زنده</span> صندوق‌ها
              </h1>
              <p className="text-text-muted text-sm mt-2 font-dana" style={{ fontWeight: 600 }}>
                خالص خرید حقیقی، ارزش معاملات و تغییر قیمت ETFها به‌صورت لحظه‌ای
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: '#475569' }}>
              <span className="tabular-nums">{now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              {phase === 'done' && (
                <button
                  onClick={() => { _cache.clear(); fetchLive() }}
                  className="px-3 py-1.5 rounded-lg tabular-nums"
                  style={{ background: '#0F1623', border: '1px solid #1E293B' }}>
                  {fa(cd, 0)} ث
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Type filter */}
        {phase === 'done' && (
          <div className="flex flex-wrap gap-2 mb-5">
            {typeOptions.map((t) => (
              <button key={t.id} onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-dana cursor-pointer transition-all duration-200 ${
                  typeFilter === t.id
                    ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                    : 'bg-surface/60 text-text-muted border border-white/8 hover:border-neon-cyan/20'
                }`}
                style={{ fontWeight: 600 }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {phase === 'init' && (
          <div className="flex flex-col items-center gap-6 py-24">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,212,255,0.08)" strokeWidth="4" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="#00D4FF" strokeWidth="4"
                  strokeLinecap="round" strokeDasharray="213.6"
                  strokeDashoffset={totalCount > 0 ? 213.6 * (1 - loadedCount / totalCount) : 213.6}
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-dana tabular-nums"
                style={{ color: '#00D4FF', fontWeight: 800 }}>
                {fa(loadedCount, 0)}/{fa(totalCount, 0)}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-dana" style={{ color: '#00D4FF', fontWeight: 700 }}>در حال دریافت اطلاعات از مراجع...</p>
              <p className="text-xs font-dana text-text-muted/40 mt-1" style={{ fontWeight: 600 }}>اتصال به TSETMC</p>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center gap-4 py-24">
            <p className="text-sm font-dana" style={{ color: '#EF4444', fontWeight: 600 }}>خطا در دریافت داده</p>
            <button onClick={init} className="text-xs px-4 py-2 rounded-lg font-dana cursor-pointer"
              style={{ background: '#0F1623', border: '1px solid #1E293B', color: '#94A3B8', fontWeight: 600 }}>
              تلاش دوباره
            </button>
          </div>
        )}

        {/* Table */}
        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-neon-cyan/10 overflow-hidden bg-surface/40 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-dana" style={{ minWidth: 640, direction: 'rtl' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,212,255,0.04)', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
                    {COLS.map((c) => (
                      <th key={c.key}
                        onClick={() => c.sort && toggleSort(c.key)}
                        className={`px-4 py-3 text-right text-xs whitespace-nowrap ${c.sort ? 'cursor-pointer hover:text-neon-cyan' : ''}`}
                        style={{ fontWeight: 700, color: sortKey === c.key ? '#00D4FF' : '#8A94A6' }}>
                        {c.label}
                        {sortKey === c.key && <span className="mr-1 opacity-60">{sortDir === 'desc' ? '▼' : '▲'}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {displayRows.map((f, i) => (
                      <motion.tr key={f.insCode}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="hover:bg-white/3 transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                        {/* نماد */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan inline-block w-fit"
                              style={{ fontWeight: 700, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                              {f.symbol || f.name?.slice(0, 10)}
                            </span>
                            <span className="text-[0.6rem] text-text-muted/40 font-dana" style={{ fontWeight: 600 }}>
                              {TYPE_LABELS[f.type] || FUND_TYPES[f.type] || ''}
                            </span>
                          </div>
                        </td>
                        {/* ورود پول */}
                        <td className="px-4 py-3">{flowCell(f.netFlow)}</td>
                        {/* ارزش معاملات */}
                        <td className="px-4 py-3">
                          {Number.isFinite(f.tradeValue)
                            ? <span className="tabular-nums font-dana text-sm text-text-primary" style={{ fontWeight: 600 }}>{fa(f.tradeValue)}م.ت</span>
                            : <span className="text-text-muted/40">—</span>}
                        </td>
                        {/* درصد آخرین */}
                        <td className="px-4 py-3">{pctCell(f.changeLast)}</td>
                        {/* درصد پایانی */}
                        <td className="px-4 py-3">{pctCell(f.changeClose)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {displayRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-text-muted text-sm font-dana" style={{ fontWeight: 600 }}>
                        صندوقی یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {ts && phase === 'done' && (
          <p className="text-center text-xs mt-4 font-dana" style={{ color: '#1E293B', fontWeight: 600 }}>
            آخرین آپدیت {ts.toLocaleTimeString('fa-IR')} · منبع: TSETMC
          </p>
        )}
      </div>
    </div>
  )
}
