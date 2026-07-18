import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, Radio, RefreshCw, WifiOff } from 'lucide-react'
import { fetchFundCompare, faNum, todayISO } from '../lib/fipiran'

const TSETMC = '/tsetmc'
const REFRESH_SECONDS = 20
const HISTORY_DAYS = 40
const AVG_DAYS = 20
const CONCURRENCY = 12

const PRODUCTS = [
  {
    id: 'fixed',
    typeId: 4,
    label: 'صندوق‌های درآمد ثابت',
    short: 'درآمد ثابت',
    color: '#00FF9D',
    triggerPct: 0.2,
    tradeProgressPct: 0.3,
    windowStart: '09:00',
    windowEnd: '11:00',
    actionTime: '11:30',
  },
  {
    id: 'equity',
    typeId: 6,
    label: 'صندوق‌های سهامی',
    short: 'سهامی',
    color: '#00D4FF',
    triggerPct: 0.2,
    tradeProgressPct: 0.3,
    windowStart: '09:00',
    windowEnd: '10:00',
    actionTime: '10:30',
  },
  {
    id: 'sector',
    typeId: 21,
    label: 'صندوق‌های بخشی',
    short: 'بخشی',
    color: '#34D399',
    triggerPct: 0.25,
    tradeProgressPct: 0.3,
    windowStart: '09:00',
    windowEnd: '10:00',
    actionTime: '10:30',
  },
  {
    id: 'mixed',
    typeId: 7,
    label: 'صندوق‌های مختلط',
    short: 'مختلط',
    color: '#A78BFA',
    triggerPct: 0.2,
    tradeProgressPct: 0.3,
    windowStart: '09:00',
    windowEnd: '10:00',
    actionTime: '10:30',
  },
  {
    id: 'gold',
    typeId: 5,
    label: 'صندوق‌های طلا',
    short: 'طلا',
    color: '#FBBF24',
    triggerPct: 0.2,
    tradeProgressPct: 0.21,
    windowStart: '12:00',
    windowEnd: '13:00',
    actionTime: '13:30',
    filter: (fund) => /طلا|زر|گوهر|عیار|مثقال|ناب|گنج|کهربا|آتش|درنا|لیان|نهال|زمرد|تابش|امرالد|ریتُن|ریتون/.test(`${fund.name || ''} ${fund.symbol || ''}`),
  },
]

const FIXED_OUTFLOW_PCT = 0.11

const fa = (number, decimals = 1) => Number.isFinite(Number(number))
  ? Number(number).toLocaleString('fa-IR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  : '—'

const fmtTime = (date) => date?.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '—'
const timeToMinutes = (time) => {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}

function windowState(product, date = new Date()) {
  const minute = date.getHours() * 60 + date.getMinutes()
  const start = timeToMinutes(product.windowStart)
  const end = timeToMinutes(product.windowEnd)
  if (minute < start) return 'waiting'
  if (minute <= end) return 'active'
  return 'closed'
}

async function tse(path, { timeout = 9000, attempts = 2 } = {}) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(`${TSETMC}/${path}`, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok) throw new Error(`TSETMC ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

async function mapLimit(items, limit, mapper) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      out[index] = await mapper(items[index], index)
    }
  }))
  return out
}

const validDailyRows = (rows) => (Array.isArray(rows) ? rows : [])
  .filter((row) => Number(row?.pClosing) > 0 && Number(row?.qTotTran5J) >= 0)
  .sort((a, b) => Number(b.dEven) - Number(a.dEven))

async function fetchFundMarket(fund) {
  try {
    const [clientPayload, pricePayload, dailyPayload] = await Promise.all([
      tse(`ClientType/GetClientType/${fund.insCode}/1/0`, { timeout: 7000 }),
      tse(`ClosingPrice/GetClosingPriceInfo/${fund.insCode}`, { timeout: 7000 }),
      tse(`ClosingPrice/GetClosingPriceDailyList/${fund.insCode}/${HISTORY_DAYS}`, { timeout: 9000 }),
    ])
    const client = clientPayload.clientType
    const price = pricePayload.closingPriceInfo
    if (!client || !price) return null

    const livePrice = Number(price.pClosing) || Number(price.pDrCotVal) || Number(fund.navRet) || 0
    const netVolume = (Number(client.buy_I_Volume) || 0) - (Number(client.sell_I_Volume) || 0)
    const todayTradeValue = ((Number(price.qTotTran5J) || 0) * livePrice) / 1e10
    const netFlow = (netVolume * livePrice) / 1e10
    const daily = validDailyRows(dailyPayload.closingPriceDaily)
      .filter((row) => Number(row.qTotTran5J) > 0)
      .slice(0, AVG_DAYS)
      .map((row) => (Number(row.qTotTran5J) * Number(row.pClosing)) / 1e10)
    const avgTradeValue = daily.length ? daily.reduce((sum, value) => sum + value, 0) / daily.length : null

    return {
      insCode: fund.insCode,
      netFlow,
      todayTradeValue,
      avgTradeValue,
    }
  } catch {
    return null
  }
}

function aggregateMarkets(markets) {
  const valid = markets.filter(Boolean)
  const avgValues = valid.map((item) => item.avgTradeValue).filter(Number.isFinite)
  return {
    ok: valid.length,
    netFlow: valid.reduce((sum, item) => sum + item.netFlow, 0),
    todayTradeValue: valid.reduce((sum, item) => sum + item.todayTradeValue, 0),
    avgTradeValue: avgValues.reduce((sum, value) => sum + value, 0),
  }
}

function TriggerBadge({ state }) {
  if (state === 'go') {
    return <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300" style={{ fontWeight: 900 }}><CheckCircle2 size={14} />تبلیغ بزن</span>
  }
  if (state === 'watch') {
    return <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-300" style={{ fontWeight: 900 }}><AlertTriangle size={14} />نزدیکه</span>
  }
  return <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-500" style={{ fontWeight: 900 }}><Clock3 size={14} />صبر کن</span>
}

export default function Triggers() {
  const [phase, setPhase] = useState('loading')
  const [rows, setRows] = useState([])
  const [updatedAt, setUpdatedAt] = useState(null)
  const [now, setNow] = useState(new Date())
  const [countdown, setCountdown] = useState(REFRESH_SECONDS)
  const [refreshing, setRefreshing] = useState(false)
  const [liveError, setLiveError] = useState('')
  const fundsByProduct = useRef({})
  const refreshLock = useRef(false)
  const mounted = useRef(true)
  const hasRows = useRef(false)

  const buildRows = useCallback((aggregates) => {
    const fixed = aggregates.fixed
    const fixedOutflowThreshold = fixed?.avgTradeValue ? -fixed.avgTradeValue * FIXED_OUTFLOW_PCT : null
    const fixedOutflowTriggered = Number.isFinite(fixed?.netFlow) &&
      Number.isFinite(fixedOutflowThreshold) &&
      fixed.netFlow <= fixedOutflowThreshold

    return PRODUCTS.map((product) => {
      const aggregate = aggregates[product.id] || { ok: 0, netFlow: null, todayTradeValue: null, avgTradeValue: null }
      const triggerThreshold = Number.isFinite(aggregate.avgTradeValue)
        ? aggregate.avgTradeValue * product.triggerPct
        : null
      const tradeProgress = Number.isFinite(aggregate.avgTradeValue) && aggregate.avgTradeValue > 0
        ? aggregate.todayTradeValue / aggregate.avgTradeValue
        : null
      const targetTriggered = Number.isFinite(aggregate.netFlow) &&
        Number.isFinite(triggerThreshold) &&
        aggregate.netFlow >= triggerThreshold
      const progressReady = Number.isFinite(tradeProgress) && tradeProgress >= product.tradeProgressPct
      const window = windowState(product)
      const go = progressReady && (targetTriggered || (product.id !== 'fixed' && fixedOutflowTriggered))
      const watch = !go && progressReady && (
        (Number.isFinite(aggregate.netFlow) && Number.isFinite(triggerThreshold) && aggregate.netFlow >= triggerThreshold * 0.65) ||
        (product.id !== 'fixed' && fixedOutflowTriggered)
      )
      return {
        ...product,
        ...aggregate,
        triggerThreshold,
        fixedOutflowThreshold,
        fixedOutflowTriggered,
        targetTriggered,
        tradeProgress,
        progressReady,
        window,
        decision: go ? 'go' : watch ? 'watch' : 'wait',
        total: fundsByProduct.current[product.id]?.length || 0,
      }
    })
  }, [])

  const refreshLive = useCallback(async ({ initial = false } = {}) => {
    if (refreshLock.current) return
    refreshLock.current = true
    setRefreshing(true)
    setLiveError('')
    try {
      const aggregates = {}
      await Promise.all(PRODUCTS.map(async (product) => {
        const funds = fundsByProduct.current[product.id] || []
        const markets = await mapLimit(funds, CONCURRENCY, fetchFundMarket)
        aggregates[product.id] = aggregateMarkets(markets)
      }))
      if (!mounted.current) return
      setRows(buildRows(aggregates))
      setUpdatedAt(new Date())
      setPhase('ready')
      hasRows.current = true
      const coverageLow = PRODUCTS.some((product) => {
        const total = fundsByProduct.current[product.id]?.length || 0
        const ok = aggregates[product.id]?.ok || 0
        return total > 0 && ok / total < 0.75
      })
      if (coverageLow) setLiveError('بخشی از نمادها از TSETMC پاسخ ندادند؛ برای همان دسته پوشش داده کنار ردیف نمایش داده شده است.')
    } catch {
      if (!mounted.current) return
      if (initial || !hasRows.current) setPhase('error')
      else setLiveError('به‌روزرسانی لحظه‌ای ناموفق بود؛ آخرین داده سالم حفظ شد.')
    } finally {
      refreshLock.current = false
      if (mounted.current) setRefreshing(false)
    }
  }, [buildRows])

  const initialize = useCallback(async () => {
    setPhase('loading')
    setLiveError('')
    try {
      const snap = await fetchFundCompare(todayISO())
      for (const product of PRODUCTS) {
        fundsByProduct.current[product.id] = snap.funds.filter((fund) =>
          fund.type === product.typeId &&
          fund.isETF &&
          !fund.isCharity &&
          fund.insCode &&
          (!product.filter || product.filter(fund))
        )
      }
      await refreshLive({ initial: true })
    } catch {
      if (mounted.current) setPhase('error')
    }
  }, [refreshLive])

  useEffect(() => {
    mounted.current = true
    initialize()
    return () => { mounted.current = false }
  }, [initialize])

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
      setCountdown((value) => {
        if (phase !== 'ready') return value
        if (value <= 1) {
          refreshLive()
          return REFRESH_SECONDS
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, refreshLive])

  useEffect(() => {
    const resume = () => { if (document.visibilityState === 'visible' && phase === 'ready') refreshLive() }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('online', resume)
    return () => {
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('online', resume)
    }
  }, [phase, refreshLive])

  const readyCount = useMemo(() => rows.filter((row) => row.decision === 'go').length, [rows])

  return (
    <main className="min-h-screen bg-[#07090F] px-3 py-8 font-dana text-slate-300 sm:px-4" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-800/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-cyan-400"><Radio size={15} />پایش زنده جریان پول</div>
            <h1 className="text-xl text-slate-100 sm:text-2xl" style={{ fontWeight: 900 }}>تریگر تبلیغات صندوق‌ها</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
              شرط تصمیم: عبور حجم معاملات امروز از سهم مورد انتظار بازه زمانی، و عبور ورود پول از درصد مشخصی از میانگین ارزش معاملات ۲۰ روز اخیر.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-300">{faNum(readyCount)} آماده</span>
            <span className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 tabular-nums text-slate-500">{fmtTime(now)}</span>
            <button type="button" onClick={() => phase === 'ready' ? refreshLive() : initialize()} disabled={refreshing || phase === 'loading'} className="flex items-center gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-cyan-300 disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />{phase === 'ready' ? `${fa(countdown, 0)} ث` : 'تلاش دوباره'}
            </button>
          </div>
        </header>

        {phase === 'loading' && (
          <div className="grid min-h-72 place-items-center">
            <div className="text-center">
              <RefreshCw className="mx-auto animate-spin text-cyan-400" />
              <p className="mt-4 text-sm text-slate-400">در حال دریافت داده زنده و میانگین ۲۰ روزه از TSETMC...</p>
              <p className="mt-2 text-xs text-slate-600">دیگر به baseline قدیمی وابسته نیست.</p>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="grid min-h-72 place-items-center">
            <div className="text-center">
              <WifiOff className="mx-auto text-rose-400" />
              <p className="mt-4 text-sm text-rose-300">دریافت داده کامل نشد.</p>
              <button onClick={initialize} className="mt-4 rounded-md border border-slate-700 px-4 py-2 text-xs text-slate-300">تلاش دوباره</button>
            </div>
          </div>
        )}

        {phase === 'ready' && (
          <>
            {liveError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 text-xs leading-6 text-amber-300">
                <AlertTriangle size={16} className="mt-1 shrink-0" />{liveError}
              </div>
            )}
            <div className="grid gap-3">
              {rows.map((row) => {
                const progressPct = Number.isFinite(row.tradeProgress) ? row.tradeProgress * 100 : null
                const flowRatio = Number.isFinite(row.netFlow) && Number.isFinite(row.triggerThreshold) && row.triggerThreshold > 0
                  ? row.netFlow / row.triggerThreshold
                  : 0
                const flowWidth = `${Math.max(0, Math.min(flowRatio * 100, 100))}%`
                const progressWidth = `${Math.max(0, Math.min((row.tradeProgress || 0) / row.tradeProgressPct * 100, 100))}%`
                const decisionColor = row.decision === 'go' ? '#22C55E' : row.decision === 'watch' ? '#F59E0B' : '#64748B'
                return (
                  <article key={row.id} className="rounded-xl border border-slate-800 bg-[#0C1118] p-4" style={row.decision === 'go' ? { borderColor: 'rgba(34,197,94,.24)', background: 'rgba(34,197,94,.04)' } : undefined}>
                    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr_1fr_120px] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                          <h2 className="text-sm text-slate-100" style={{ fontWeight: 900 }}>{row.label}</h2>
                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.62rem] text-slate-500">{faNum(row.ok)}/{faNum(row.total)}</span>
                        </div>
                        <p className="mt-2 text-[0.68rem] leading-5 text-slate-500">
                          تصمیم {row.windowStart} تا {row.windowEnd} · اجرای تبلیغ {row.actionTime}
                        </p>
                      </div>

                      <Metric label="ورود پول امروز" value={`${row.netFlow >= 0 ? '+' : ''}${fa(row.netFlow)} میلیارد`} color={row.netFlow >= 0 ? '#22C55E' : '#EF4444'} />
                      <Metric label="حد ورود پول" value={`${fa(row.triggerThreshold)} میلیارد`} />
                      <Metric label="حجم امروز / میانگین ۲۰ روز" value={`${fa(progressPct, 0)}٪`} color={row.progressReady ? '#22C55E' : '#F59E0B'} />

                      <div className="flex justify-start lg:justify-center">
                        <TriggerBadge state={row.decision} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Bar label={`ورود پول نسبت به حد ${fa(row.triggerPct * 100, 0)}٪`} width={flowWidth} color={decisionColor} />
                      <Bar label={`پیشرفت حجم معاملات نسبت به حد ${fa(row.tradeProgressPct * 100, 0)}٪`} width={progressWidth} color={row.progressReady ? '#22C55E' : '#F59E0B'} />
                    </div>

                    {row.id !== 'fixed' && row.fixedOutflowTriggered && (
                      <p className="mt-3 rounded-lg border border-rose-400/15 bg-rose-400/5 px-3 py-2 text-xs leading-6 text-rose-300">
                        خروج پول از درآمد ثابت هم فعال است: {fa(row.fixedOutflowThreshold)} میلیارد تومان.
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
            <footer className="mt-5 flex flex-col gap-2 text-[0.65rem] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>ارقام: میلیارد تومان · منبع: TSETMC</span>
              <span>آخرین داده سالم: {fmtTime(updatedAt)}</span>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}

function Metric({ label, value, color = '#CBD5E1' }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2">
      <div className="text-[0.62rem] text-slate-600">{label}</div>
      <div className="mt-1 text-sm tabular-nums" style={{ fontWeight: 900, color }}>{value}</div>
    </div>
  )
}

function Bar({ label, width, color }) {
  return (
    <div>
      <div className="mb-1 text-[0.62rem] text-slate-600">{label}</div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width, background: color }} />
      </div>
    </div>
  )
}
