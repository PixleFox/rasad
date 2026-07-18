import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, Radio, RefreshCw, WifiOff } from 'lucide-react'
import { fetchFundCompare, fetchRangeReturns, faNum, monthsBeforeISO, todayISO } from '../lib/fipiran'

const TSETMC = '/tsetmc'
const REFRESH_SECONDS = 20
const AVG_DAYS = 20
const HISTORY_DAYS = 40
const CONCURRENCY = 12
const FIXED_NEGATIVE_FLOW_VOLUME_PCT = 1.1

const PRODUCTS = [
  {
    id: 'fixed',
    typeId: 4,
    label: 'صندوق‌های درآمد ثابت',
    short: 'درآمد ثابت',
    color: '#00FF9D',
    triggerPct: 0.2,
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
    windowStart: '12:00',
    windowEnd: '13:00',
    actionTime: '13:30',
    filter: (fund) => /طلا|زر|گوهر|عیار|مثقال|ناب|گنج|کهربا|آتش|درنا|لیان|نهال|زمرد|تابش|امرالد|ریتُن|ریتون/.test(`${fund.name || ''} ${fund.symbol || ''}`),
  },
]

const fa = (number, decimals = 1) => Number.isFinite(Number(number))
  ? Number(number).toLocaleString('fa-IR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  : '—'

const signedBT = (number) => Number.isFinite(Number(number))
  ? `${Number(number) >= 0 ? '+' : ''}${fa(number)} میلیارد`
  : '—'

const absBT = (number) => Number.isFinite(Number(number))
  ? `${fa(Math.abs(Number(number)))} میلیارد`
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

async function fetchFundMarket(fund) {
  try {
    const [clientPayload, pricePayload] = await Promise.all([
      tse(`ClientType/GetClientType/${fund.insCode}/1/0`, { timeout: 7000 }),
      tse(`ClosingPrice/GetClosingPriceInfo/${fund.insCode}`, { timeout: 7000 }),
    ])
    const client = clientPayload.clientType
    const price = pricePayload.closingPriceInfo
    if (!client || !price) return null

    const livePrice = Number(price.pClosing) || Number(price.pDrCotVal) || Number(fund.navRet) || 0
    const netVolume = (Number(client.buy_I_Volume) || 0) - (Number(client.sell_I_Volume) || 0)
    const netFlow = (netVolume * livePrice) / 1e10

    return {
      insCode: fund.insCode,
      netFlow,
    }
  } catch {
    return null
  }
}

const validDailyRows = (rows) => (Array.isArray(rows) ? rows : [])
  .filter((row) => Number(row?.pClosing) > 0 && Number(row?.qTotTran5J) >= 0)
  .sort((a, b) => Number(b.dEven) - Number(a.dEven))

async function fetchFundAverageTradeValue(fund) {
  try {
    const payload = await tse(`ClosingPrice/GetClosingPriceDailyList/${fund.insCode}/${HISTORY_DAYS}`, { timeout: 9000 })
    const daily = validDailyRows(payload.closingPriceDaily)
      .filter((row) => Number(row.qTotTran5J) > 0)
      .slice(0, AVG_DAYS)
      .map((row) => (Number(row.qTotTran5J) * Number(row.pClosing)) / 1e10)
    return daily.length ? daily.reduce((sum, value) => sum + value, 0) / daily.length : null
  } catch {
    return null
  }
}

function aggregateMarkets(markets) {
  const valid = markets.filter(Boolean)
  return {
    ok: valid.length,
    netFlow: valid.reduce((sum, item) => sum + item.netFlow, 0),
  }
}

function calcAverageDailyFlow(funds) {
  const totalFlow = funds.reduce((sum, fund) => {
    if (!Number.isFinite(fund.unitsStart) || !(fund.navRet > 0)) return sum
    return sum + ((fund.units - fund.unitsStart) * fund.navRet) / 1e10
  }, 0)
  return totalFlow / AVG_DAYS
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
  const averageFlowByProduct = useRef({})
  const averageTradeByProduct = useRef({})
  const refreshLock = useRef(false)
  const mounted = useRef(true)
  const hasRows = useRef(false)

  const buildRows = useCallback((aggregates) => {
    return PRODUCTS.map((product) => {
      const aggregate = aggregates[product.id] || { ok: 0, netFlow: null }
      const averageFlow = averageFlowByProduct.current[product.id]
      const averageTradeValue = averageTradeByProduct.current[product.id]
      const isFixedNegativeFlow = product.id === 'fixed' && Number.isFinite(averageFlow) && averageFlow < 0
      const triggerThreshold = isFixedNegativeFlow
        ? (Number.isFinite(averageTradeValue) && averageTradeValue > 0 ? averageTradeValue * FIXED_NEGATIVE_FLOW_VOLUME_PCT : null)
        : (Number.isFinite(averageFlow) && averageFlow !== 0 ? Math.abs(averageFlow) * product.triggerPct : null)
      const triggerCurrent = isFixedNegativeFlow && Number.isFinite(aggregate.netFlow)
        ? Math.max(0, -aggregate.netFlow)
        : aggregate.netFlow
      const targetTriggered = Number.isFinite(aggregate.netFlow) &&
        Number.isFinite(triggerThreshold) &&
        triggerThreshold > 0 &&
        (isFixedNegativeFlow ? aggregate.netFlow <= -triggerThreshold : aggregate.netFlow >= triggerThreshold)
      const window = windowState(product)
      const go = targetTriggered
      const watch = !go && (
        Number.isFinite(aggregate.netFlow) &&
        Number.isFinite(triggerThreshold) &&
        triggerThreshold > 0 &&
        (isFixedNegativeFlow ? aggregate.netFlow <= -triggerThreshold * 0.65 : aggregate.netFlow >= triggerThreshold * 0.65)
      )
      return {
        ...product,
        ...aggregate,
        triggerThreshold,
        triggerCurrent,
        triggerMode: isFixedNegativeFlow ? 'outflow' : 'inflow',
        triggerPctLabel: isFixedNegativeFlow ? '۱۱۰٪ حجم' : `${fa(product.triggerPct * 100, 0)}٪`,
        averageTradeValue,
        averageFlow,
        targetTriggered,
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
      const end = todayISO()
      const [snap, rangeSnap] = await Promise.all([
        fetchFundCompare(end),
        fetchRangeReturns(monthsBeforeISO(end, 1), end),
      ])
      for (const product of PRODUCTS) {
        fundsByProduct.current[product.id] = snap.funds.filter((fund) =>
          fund.type === product.typeId &&
          fund.isETF &&
          !fund.isCharity &&
          fund.insCode &&
          (!product.filter || product.filter(fund))
        )
        const rangeFunds = rangeSnap.funds.filter((fund) =>
          fund.type === product.typeId &&
          fund.isETF &&
          !fund.isCharity &&
          fund.insCode &&
          (!product.filter || product.filter(fund))
        )
        averageFlowByProduct.current[product.id] = calcAverageDailyFlow(rangeFunds)
      }
      if (averageFlowByProduct.current.fixed < 0) {
        const tradeValues = await mapLimit(fundsByProduct.current.fixed || [], CONCURRENCY, fetchFundAverageTradeValue)
        averageTradeByProduct.current.fixed = tradeValues
          .filter(Number.isFinite)
          .reduce((sum, value) => sum + value, 0)
      } else {
        averageTradeByProduct.current.fixed = null
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
              شرط تصمیم: ورود پول امروز از حد تریگر همان گروه عبور کند؛ برای درآمد ثابت با میانگین ورود منفی، حد تریگر بر اساس ۱۱۰٪ میانگین ارزش معاملات روزانه ۲۰ روز کاری اخیر است.
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
              <p className="mt-4 text-sm text-slate-400">در حال دریافت داده زنده و محاسبه میانگین ورود پول...</p>
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
                const flowRatio = Number.isFinite(row.triggerCurrent) && Number.isFinite(row.triggerThreshold) && row.triggerThreshold > 0
                  ? row.triggerCurrent / row.triggerThreshold
                  : 0
                const flowWidth = `${Math.max(0, Math.min(flowRatio * 100, 100))}%`
                const decisionColor = row.decision === 'go' ? '#22C55E' : row.decision === 'watch' ? '#F59E0B' : '#64748B'
                return (
                  <article key={row.id} className="rounded-xl border border-slate-800 bg-[#0C1118] p-4" style={row.decision === 'go' ? { borderColor: 'rgba(34,197,94,.24)', background: 'rgba(34,197,94,.04)' } : undefined}>
                    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_.72fr_.9fr_1fr_120px] lg:items-center">
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

                      <Metric label="میانگین ورود پول" value={signedBT(row.averageFlow)} color={row.averageFlow >= 0 ? '#CBD5E1' : '#94A3B8'} />
                      <Metric label="درصد تریگر" value={row.triggerPctLabel} />
                      <Metric label="حد تریگر" value={absBT(row.triggerThreshold)} />
                      <Metric label="ورود پول امروز" value={signedBT(row.netFlow)} color={row.netFlow >= 0 ? '#22C55E' : '#EF4444'} />

                      <div className="flex justify-start lg:justify-center">
                        <TriggerBadge state={row.decision} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Bar label={row.triggerMode === 'outflow' ? 'نسبت خروج پول امروز به حد تریگر' : 'نسبت ورود پول امروز به حد تریگر'} width={flowWidth} color={decisionColor} />
                    </div>
                  </article>
                )
              })}
            </div>
            <footer className="mt-5 flex flex-col gap-2 text-[0.65rem] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>ارقام: میلیارد تومان · ورود پول امروز: TSETMC · میانگین ورود پول: فیپیران · حجم ۲۰ روزه: TSETMC</span>
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
