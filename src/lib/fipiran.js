// ── Fipiran data layer ──────────────────────────────────────────────────────
// All requests go through the Vite dev proxy at /fipiran (see vite.config.js),
// which forwards to https://www.fipiran.com/services with a browser UA and
// SSL verification disabled. In production this path must be served by a
// serverless function / proxy with the same behaviour.

const BASE = '/fipiran/fund'

// fundType numeric codes → Persian labels (derived from live data sampling)
export const FUND_TYPES = {
  4: 'درآمد ثابت',
  5: 'کالایی',
  6: 'سهامی',
  7: 'مختلط',
  11: 'بازارگردانی',
  12: 'جسورانه',
  13: 'پروژه',
  16: 'خصوصی',
  17: 'نیکوکاری',
  18: 'املاک و مستغلات',
  21: 'بخشی',
  22: 'اهرمی',
  23: 'شاخصی',
  24: 'تضمین اصل سرمایه',
  25: 'بازنشستگی',
}

// Tabs shown on the homepage "top performers" table
export const CATEGORIES = [
  { id: 6, label: 'سهامی' },
  { id: 4, label: 'درآمد ثابت' },
  { id: 7, label: 'مختلط' },
  { id: 22, label: 'اهرمی' },
  { id: 5, label: 'کالایی' },
  { id: 23, label: 'شاخصی' },
  { id: 21, label: 'بخشی' },
]

// ── Formatting helpers ───────────────────────────────────────────────────────
export const faNum = (n, opts) =>
  Number.isFinite(Number(n)) ? Number(n).toLocaleString('fa-IR', opts) : '—'

// fundSize/netAsset are in Rial. 1 میلیارد تومان = 10^10 Rial.
export const toBillionToman = (rial) => rial / 1e10

export const fmtSize = (rial) =>
  faNum(Math.round(toBillionToman(rial)), { maximumFractionDigits: 0 })

export const fmtPercent = (v) =>
  Number.isFinite(v) ? faNum(v.toFixed(1)) + '٪' : '—'

// Gregorian yyyy-mm-dd → Jalali display string, e.g. "۲۱ خرداد ۱۴۰۵"
export const toJalali = (iso) => {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

// Local-component ISO (avoids UTC day-shift; Iran is UTC+3:30).
const toISO = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export const todayISO = () => toISO(new Date())
export const dateToISO = toISO

// ISO of `months` calendar-months before the given ISO date.
export const monthsBeforeISO = (iso, months = 1) => {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return toISO(d)
}

export const shiftISO = (iso, days) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export const daysBetween = (isoA, isoB) => {
  const a = new Date(isoA + 'T00:00:00')
  const b = new Date(isoB + 'T00:00:00')
  return Math.round(Math.abs(b - a) / 86400000)
}

// ── Normalization ────────────────────────────────────────────────────────────
function normalize(it) {
  // صندوق‌های ضمان و گارانتی → دسته مختلط (type 7)
  const name = it.name || ''
  const charity = it.fundType === 17 || name.includes('نیکوکاری')
  const fundType = charity
    ? 17
    : (name.includes('ضمان') || name.includes('گارانتی'))
        ? 7
        : it.fundType

  return {
    regNo: it.regNo,
    name,
    symbol: it.smallSymbolName || null,
    type: fundType,
    typeLabel: FUND_TYPES[fundType] || 'سایر',
    // صندوق‌های نیکوکاری: گاهی type آن‌ها 4/6/7 ثبت می‌شه، نه 17
    isCharity: charity,
    sizeRial: it.fundSize ?? it.netAsset ?? 0,
    manager: it.manager || '',
    insCode: it.insCode || null,
    // Number of invested units (netAsset = units × NAV), used for money-flow.
    units: Number(it.investedUnits) || 0,
    // NAV used as the basis for range-return computation (redemption NAV,
    // falling back to statistical/issue NAV when missing).
    navRet: it.cancelNav || it.statisticalNav || it.issueNav || 0,
    // Raw NAVs (for reserve / bubble metrics)
    statNav: Number(it.statisticalNav) || 0,
    cancelNav: Number(it.cancelNav) || 0,
    issueNav: Number(it.issueNav) || 0,
    // Classification
    isETF: it.typeOfInvest === 'Negotiable',
    dividendDays: Number(it.dividendIntervalPeriod) || 0,
    initiationDate: it.initiationDate || null,
    // Asset composition (percentages)
    comp: {
      stock: Number(it.stock) || 0,
      bond: Number(it.bond) || 0,
      cash: Number(it.cash) || 0,
      deposit: Number(it.deposit) || 0,
      other: Number(it.other) || 0,
    },
    website: Array.isArray(it.websiteAddress) ? it.websiteAddress[0] : it.websiteAddress || null,
  }
}

// ── TSETMC Market Quality ─────────────────────────────────────────────────────
const TSETMC_BASE = '/tsetmc'
const _tsetmcCache = new Map()

async function _fetchTsetmc(path) {
  if (_tsetmcCache.has(path)) return _tsetmcCache.get(path)
  const res = await fetch(`${TSETMC_BASE}/${path}`)
  if (!res.ok) throw new Error(`tsetmc ${res.status}`)
  const data = await res.json()
  _tsetmcCache.set(path, data)
  return data
}

export async function fetchTsetmcQuality(insCode) {
  const [price, info, limits, daily] = await Promise.all([
    _fetchTsetmc(`ClosingPrice/GetClosingPriceInfo/${insCode}`),
    _fetchTsetmc(`Instrument/GetInstrumentInfo/${insCode}`),
    _fetchTsetmc(`BestLimits/${insCode}`).catch(() => ({ bestLimits: [] })),
    _fetchTsetmc(`ClosingPrice/GetClosingPriceDailyList/${insCode}/30`).catch(() => ({ closingPriceDaily: [] })),
  ])
  const cp  = price.closingPriceInfo
  const inf = info.instrumentInfo
  const pClose     = cp?.pClosing       ?? null
  const pLastTrade = cp?.pDrCotVal      ?? null
  const pYest      = cp?.priceYesterday ?? null
  const changePct  = pClose != null && pYest && pYest > 0 ? ((pClose - pYest) / pYest) * 100 : null

  const bl = limits.bestLimits ?? []
  let mmVolBT = 0
  for (const row of bl) {
    mmVolBT += (row.qTitMeDem ?? 0) * (row.pMeDem ?? 0) / 1e10
    mmVolBT += (row.qTitMeOf ?? 0) * (row.pMeOf  ?? 0) / 1e10
  }

  // خالص خرید حقیقی زنده (امروز) از endpoint زنده GetClientType/{ins}/1/0
  // این endpoint فقط حجم می‌دهد (نه ارزش)، پس ارزش پولی = حجم خالص × قیمت پایانی.
  // دقت این تخمین در برابر مقدار واقعی روزهای کامل‌شده ≈ ۹۹٫۹۹٪ است.
  let netFlowBT = null
  try {
    const ct = await _fetchTsetmc(`ClientType/GetClientType/${insCode}/1/0`)
    const c = ct.clientType
    if (c) {
      const netVol = (c.buy_I_Volume ?? 0) - (c.sell_I_Volume ?? 0)
      const price = pClose ?? pLastTrade ?? 0
      netFlowBT = (netVol * price) / 1e10
    }
  } catch {}

  const dailyList = Array.isArray(daily.closingPriceDaily) ? daily.closingPriceDaily : []
  const avgDailyTrades = dailyList.length > 0
    ? dailyList.reduce((s, d) => s + (d.zTotTran ?? 0), 0) / dailyList.length
    : null

  return {
    pClose,
    pLastTrade,
    pYest,
    changePct,
    trades:         cp?.zTotTran       ?? null,
    volume:         cp?.qTotTran5J     ?? null,
    avgMonthVol:    inf?.qTotTran5JAvg ?? null,
    mmVolBT:        mmVolBT > 0 ? mmVolBT : null,
    issuedUnits:    inf?.etfIssuedUnit  ?? null,
    netFlowBT,
    avgDailyTrades,
  }
}

export async function fetchCodalNews(count = 100) {
  const data = await _fetchTsetmc(`Codal/GetPreparedData/${count}`)
  return data.preparedData ?? []
}

// ── Fetching ─────────────────────────────────────────────────────────────────
// Caches resolved snapshots by requested start date, and dedupes in-flight
// requests so React StrictMode's double-invoke (and rapid re-renders) don't
// fire duplicate walk-back chains that Fipiran throttles.
const _cache = new Map() // startDate -> { date, funds }
const _inflight = new Map() // startDate -> Promise

// Fetches the all-funds comparison snapshot for a date, walking back day-by-day
// (holidays/weekends have no data) until a populated snapshot is found.
export function fetchFundCompare(startDate, maxBack = 12) {
  if (_cache.has(startDate)) return Promise.resolve(_cache.get(startDate))
  if (_inflight.has(startDate)) return _inflight.get(startDate)

  const promise = (async () => {
    const d = new Date(startDate + 'T00:00:00')
    for (let i = 0; i < maxBack; i++) {
      const ds = toISO(d)
      try {
        const res = await fetch(`${BASE}/fundcompare?date=${ds}`)
        if (res.ok) {
          const json = await res.json()
          if (json?.items?.length) {
            const out = { date: ds, funds: json.items.map(normalize) }
            _cache.set(startDate, out)
            return out
          }
        }
      } catch {
        // network error — try previous day
      }
      d.setDate(d.getDate() - 1)
    }
    throw new Error('داده‌ای برای این بازه پیدا نشد')
  })()

  _inflight.set(startDate, promise)
  promise.finally(() => _inflight.delete(startDate))
  return promise
}

// ── Range returns ────────────────────────────────────────────────────────────
// Computes each fund's return over a custom [start, end] window by diffing its
// NAV between the two daily snapshots. Returns the END snapshot's funds (for
// name/symbol/size/type) enriched with `rangeReturn` (percent).
// Also merges funds missing from the end snapshot with the previous trading day
// to avoid gaps when Fipiran doesn't report all funds on a single day.
export async function fetchRangeReturns(startISO, endISO) {
  // Fetch both endpoints in parallel
  const [endSnap, startSnap] = await Promise.all([
    fetchFundCompare(endISO),
    fetchFundCompare(startISO),
  ])

  const startById = new Map(startSnap.funds.map((f) => [f.regNo, f]))
  const endById   = new Map(endSnap.funds.map((f) => [f.regNo, f]))

  // Walk back up to 7 days to find funds missing from endSnap.
  // Each missing fund keeps the most recent date it was seen, marked stale.
  const mergedEnd = [...endSnap.funds]
  let staleFundsCount = 0
  let staleDate = null
  const foundSoFar = new Set(endSnap.funds.map((f) => f.regNo))

  for (let daysBack = 1; daysBack <= 7; daysBack++) {
    // Stop early if we have nothing left to search for
    const missingInStart = [...startById.keys()].filter((id) => !foundSoFar.has(id))
    if (missingInStart.length === 0) break

    const lookISO = shiftISO(endSnap.date, -daysBack)
    if (lookISO <= startSnap.date) break // don't cross into the start snapshot

    let snap = null
    try { snap = await fetchFundCompare(lookISO) } catch { continue }
    if (!snap || snap.date === endSnap.date) continue

    for (const pf of snap.funds) {
      if (!foundSoFar.has(pf.regNo)) {
        mergedEnd.push({ ...pf, stale: true, staleDate: snap.date })
        foundSoFar.add(pf.regNo)
        staleFundsCount++
        staleDate = snap.date
      }
    }
  }

  const funds = mergedEnd.map((f) => {
    const s = startById.get(f.regNo)
    const rangeReturn =
      s && s.navRet > 0 && f.navRet > 0 ? (f.navRet / s.navRet - 1) * 100 : null
    return { ...f, rangeReturn, unitsStart: s ? s.units : null }
  })

  return { startDate: startSnap.date, endDate: endSnap.date, staleFundsCount, staleDate, funds }
}

// Top N funds of a category by range return. Drops broken outliers and charity funds.
export function topByRange(funds, typeId, n = 10) {
  return funds
    .filter((f) => f.type === typeId && !f.isCharity)
    .filter((f) => Number.isFinite(f.rangeReturn) && Math.abs(f.rangeReturn) < 10000)
    .sort((a, b) => b.rangeReturn - a.rangeReturn)
    .slice(0, n)
}

// ── Aggregate-by-category (اطلاعات تجمیعی صفحه) ───────────────────────────────
// Category groups for the aggregate page. `types: 'rest'` catches every type
// not claimed by a named group.
export const AGG_CATEGORIES = [
  { label: 'درآمد ثابت', types: [4] },
  { label: 'اهرمی', types: [22] },
  { label: 'سهامی کلاسیک', types: [6] },
  { label: 'بخشی', types: [21] },
  { label: 'مختلط', types: [7] },
  { label: 'کالایی', types: [5] },
  { label: 'شاخصی', types: [23] },
  { label: 'سایر', types: 'rest' },
]

const NAMED_AGG_TYPES = [4, 22, 6, 21, 7, 5, 23]
const validReturn = (r) => Number.isFinite(r) && Math.abs(r) < 10000

// Per category: AUM-weighted average range return, and net money flow over the
// range = Σ (unitsEnd − unitsStart) × NAVend  (Rial → میلیارد تومان).
// Positive flow = net inflow (money entered the category).
export function aggregateByCategory(funds) {
  const rows = AGG_CATEGORIES.map((cat) => {
    const inCat = funds.filter((f) =>
      cat.types === 'rest' ? !NAMED_AGG_TYPES.includes(f.type) : cat.types.includes(f.type)
    )

    let weight = 0
    let weightedReturn = 0
    let flowRial = 0
    for (const f of inCat) {
      if (validReturn(f.rangeReturn) && f.sizeRial > 0) {
        weight += f.sizeRial
        weightedReturn += f.rangeReturn * f.sizeRial
      }
      if (Number.isFinite(f.unitsStart) && f.navRet > 0) {
        flowRial += (f.units - f.unitsStart) * f.navRet
      }
    }

    return {
      label: cat.label,
      count: inCat.length,
      avgReturn: weight > 0 ? weightedReturn / weight : null,
      netFlow: flowRial / 1e10, // میلیارد تومان
    }
  })

  const totalFlow = rows.reduce((s, r) => s + r.netFlow, 0)
  const totalCount = rows.reduce((s, r) => s + r.count, 0)
  return { rows, total: { netFlow: totalFlow, count: totalCount } }
}

// ── Per-fund metrics (fund-info pages) ───────────────────────────────────────
// Years since the fund started operating.
export const yearsSince = (initiation, endISO) => {
  if (!initiation) return null
  const a = new Date(initiation)
  const b = new Date(endISO + 'T00:00:00')
  const y = (b - a) / (365.25 * 24 * 3600 * 1000)
  return y > 0 ? y : null
}

export const isNewFund = (initiation, endISO) => {
  if (!initiation || !endISO) return false
  const started = new Date(initiation)
  const ended = new Date(endISO + 'T23:59:59')
  const days = (ended - started) / 86400000
  return Number.isFinite(days) && days >= 0 && days <= 30
}

// Fund reserve (میلیارد تومان): (statistical − redemption NAV) × units.
export const reserveBillionToman = (f) =>
  f.statNav && f.cancelNav ? ((f.statNav - f.cancelNav) * f.units) / 1e10 : null

// Bubble (%): premium of statistical price over redemption price.
// For commodity ETFs (type=5), Fipiran often sets statNav === cancelNav so the
// metric is unreliable — return null when the spread is < 0.1%.
export const bubblePercent = (f) => {
  if (!(f.cancelNav > 0)) return null
  const pct = ((f.statNav - f.cancelNav) / f.cancelNav) * 100
  if (f.type === 5 && Math.abs(pct) < 0.1) return null
  return pct
}

// Asset-risk index 0..100 from composition (stocks are the riskiest).
export const riskLevel = (f) => {
  const c = f.comp || {}
  const r = c.stock * 1 + c.other * 0.6 + c.bond * 0.15
  return Math.max(0, Math.min(100, Math.round(r)))
}

// ── Rasad Score v2 — type-aware scoring ─────────────────────────────────────
// Weights per fund type. Keys: ret=return, size, hist=history, bubble, reserve, riskFit, flow
const TYPE_WEIGHTS = {
  4:  { ret: 0.25, size: 0.20, hist: 0.10, bubble: 0.05, reserve: 0.25, riskFit: 0.10, flow: 0.05 }, // درآمد ثابت
  6:  { ret: 0.45, size: 0.18, hist: 0.12, bubble: 0.10, reserve: 0.00, riskFit: 0.05, flow: 0.10 }, // سهامی
  7:  { ret: 0.40, size: 0.20, hist: 0.12, bubble: 0.05, reserve: 0.08, riskFit: 0.05, flow: 0.10 }, // مختلط
  21: { ret: 0.45, size: 0.18, hist: 0.12, bubble: 0.10, reserve: 0.00, riskFit: 0.05, flow: 0.10 }, // بخشی
  22: { ret: 0.35, size: 0.15, hist: 0.10, bubble: 0.30, reserve: 0.00, riskFit: 0.00, flow: 0.10 }, // اهرمی
  5:  { ret: 0.30, size: 0.20, hist: 0.12, bubble: 0.28, reserve: 0.00, riskFit: 0.00, flow: 0.10 }, // کالایی
  23: { ret: 0.30, size: 0.25, hist: 0.15, bubble: 0.20, reserve: 0.00, riskFit: 0.00, flow: 0.10 }, // شاخصی
  24: { ret: 0.25, size: 0.25, hist: 0.15, bubble: 0.00, reserve: 0.30, riskFit: 0.05, flow: 0.00 }, // تضمین اصل
}
const DEFAULT_WEIGHTS = { ret: 0.40, size: 0.25, hist: 0.20, bubble: 0.00, reserve: 0.00, riskFit: 0.00, flow: 0.15 }

// Normalize array of values to 0..1 range (returns Map: index→normVal)
function normMap(arr) {
  const finite = arr.filter(Number.isFinite)
  if (finite.length < 2) return arr.map(() => 0.5)
  const mn = Math.min(...finite)
  const mx = Math.max(...finite)
  return arr.map((v) => (Number.isFinite(v) ? (mx > mn ? (v - mn) / (mx - mn) : 0.5) : null))
}

export function enrichFunds(funds, endISO) {
  // Group funds by type for within-type normalization
  const byType = new Map()
  funds.forEach((f, i) => {
    const t = f.type
    if (!byType.has(t)) byType.set(t, [])
    byType.get(t).push({ f, i })
  })

  // Pre-compute per-fund metrics (type-independent)
  const metrics = funds.map((f) => ({
    years:   yearsSince(f.initiationDate, endISO),
    reserve: reserveBillionToman(f),
    bubble:  bubblePercent(f),
    risk:    riskLevel(f),
  }))

  // Build score array
  const scores = new Array(funds.length).fill(null)

  for (const [type, group] of byType) {
    const w = TYPE_WEIGHTS[type] ?? DEFAULT_WEIGHTS

    // Build raw vectors within the group
    const rets    = group.map(({ f }) => Number.isFinite(f.rangeReturn) && Math.abs(f.rangeReturn) < 10000 ? f.rangeReturn : null)
    const logSizes = group.map(({ f }) => f.sizeRial > 0 ? Math.log10(f.sizeRial) : null)
    const hists   = group.map(({ i }) => metrics[i].years)
    const bubbles = group.map(({ f, i }) => {
      // For non-ETF funds in types where bubble matters, treat as neutral
      if (!f.isETF && [4, 6, 7, 21, 24].includes(type)) return null
      return metrics[i].bubble
    })
    const reserves = group.map(({ i }) => metrics[i].reserve)
    // riskFit: درآمد ثابت باید سهام کم داشته باشه → score = 1 - stock%/100
    const riskFits = group.map(({ f }) =>
      type === 4 ? Math.max(0, 1 - (f.comp?.stock || 0) / 100) : null
    )
    // flow: positive = inflow (good sign), normalize within group
    const flows = group.map(({ f }) =>
      Number.isFinite(f.unitsStart) && f.navRet > 0
        ? (f.units - f.unitsStart) * f.navRet
        : null
    )

    // Normalize each dimension
    const nRet     = normMap(rets)
    const nSize    = normMap(logSizes)
    const nHist    = normMap(hists)
    // Bubble: lower abs bubble = better; threshold-aware
    const nBubble  = bubbles.map((b) => {
      if (b == null) return w.bubble > 0 ? 0.5 : null
      if (Math.abs(b) < 2) return 1.0            // حباب زیر ۲٪ — عالی
      if (Math.abs(b) > 10) return 0.0           // حباب بالای ۱۰٪ — بد
      return 1 - (Math.abs(b) - 2) / 8
    })
    const nReserve = normMap(reserves)            // higher reserve = better
    const nRiskFit = normMap(riskFits)
    const nFlow    = normMap(flows)

    group.forEach(({ f, i }, gi) => {
      const get = (arr, fallback = 0.5) => arr[gi] ?? fallback

      // Redistribute bubble weight to return when bubble not applicable
      let wBubble = w.bubble
      let wRet    = w.ret
      if (nBubble[gi] === 0.5 && !f.isETF) { wRet += wBubble; wBubble = 0 }

      const raw =
        get(nRet)     * wRet     +
        get(nSize)    * w.size   +
        get(nHist)    * w.hist   +
        get(nBubble)  * wBubble  +
        get(nReserve) * w.reserve +
        get(nRiskFit) * w.riskFit +
        get(nFlow)    * w.flow

      // ── جریمه‌ها ──
      let penalty = 0

      // ۱. ذخیره منفی
      const res = metrics[i].reserve
      if (res != null && res < 0) {
        const aumBT = Math.max((f.sizeRial || 0) / 1e10, 1)
        const severity = [4, 24].includes(type) ? 5 : 3  // درآمد ثابت/تضمین = سخت‌تر
        penalty += Math.min(Math.abs(res) / aumBT * severity * 0.1, 0.45)
      }

      // ۲. حباب بالا در ETF (آستانه‌ای)
      const bub = metrics[i].bubble
      if (f.isETF && bub != null && Math.abs(bub) > 10)
        penalty += Math.min((Math.abs(bub) - 10) / 20, 0.25)

      // ۳. صندوق خیلی کوچک (زیر ۵۰۰ میلیارد تومان)
      const tooSmall = f.sizeRial > 0 && f.sizeRial < 5e12
      const score01 = Math.max(0, raw - penalty)
      let rasadScore = Math.max(10, Math.min(100, Math.round(10 + score01 * 90)))
      if (tooSmall) rasadScore = Math.min(rasadScore, 70)

      scores[i] = rasadScore
    })
  }

  return funds.map((f, i) => ({
    ...f,
    years:      metrics[i].years,
    reserve:    metrics[i].reserve,
    bubble:     metrics[i].bubble,
    risk:       metrics[i].risk,
    rasadScore: scores[i] ?? 10,
    isNew:      isNewFund(f.initiationDate, endISO),
  }))
}

// ── Manager aggregation (مدیران صندوق‌ها صفحه) ─────────────────────────────
// Strip entity-type prefixes (longest first) so same-brand entities merge.
const MGMT_PREFIXES = [
  ['مشاور سرمایه‌گذاری ', 'مشاور'],
  ['مشاور سرمایه گذاری ', 'مشاور'],
  ['مشاورسرمایه گذاری ', 'مشاور'],
  ['سرمایه گذاری ', 'سرمایه‌گذاری'],
  ['سبدگردانی ', 'سبدگردان'],
  ['سبد گردان ', 'سبدگردان'],
  ['سبدگردان ', 'سبدگردان'],
  ['سبدگردن ', 'سبدگردان'],     // typo in Fipiran source
  ['کارگزاری ', 'کارگزاری'],
  ['هلدینگ ', 'هلدینگ'],
  ['گروه مالی ', 'گروه مالی'],
  ['گروه ', 'گروه'],
]

// Known core-name aliases (spacing / typo variations in Fipiran source).
const CORE_ALIASES = {
  'سود آفرین': 'سودآفرین',
  'نو ویرا': 'نوویرا',
  'اگاه': 'آگاه',
  'فراز ایده نوآفرین تک فاینتک': 'فراز ایده نوآفرین تک',
  'آگاه سهامی خاص': 'آگاه',
}

function normalizeStr(s) {
  return (s || '').trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ')
}

function splitManagerName(rawName) {
  const n = normalizeStr(rawName)
  for (const [prefix, entityType] of MGMT_PREFIXES) {
    if (n.startsWith(prefix)) {
      const rawCore = n.slice(prefix.length).trim()
      return { core: CORE_ALIASES[rawCore] ?? rawCore, entityType }
    }
  }
  return { core: CORE_ALIASES[n] ?? n, entityType: '' }
}

// Aggregates all funds by manager group. Merges entities with the same brand
// (e.g. سبدگردان کاریزما + مشاور سرمایه‌گذاری کاریزما → گروه کاریزما).
export function computeManagers(funds, endISO) {
  const groups = new Map() // core → { entityTypes: Set, funds[] }

  for (const f of funds) {
    if (f.isCharity) continue
    const { core, entityType } = splitManagerName(f.manager)
    if (!groups.has(core)) groups.set(core, { entityTypes: new Set(), funds: [] })
    const g = groups.get(core)
    g.entityTypes.add(entityType)
    g.funds.push(f)
  }

  const ENTITY_LABEL = {
    'سبدگردان': 'سبدگردان',
    'مشاور': 'مشاور سرمایه‌گذاری',
    'کارگزاری': 'کارگزاری',
    'سرمایه‌گذاری': 'سرمایه‌گذاری',
    'تامین سرمایه': 'تامین سرمایه',
    'هلدینگ': 'هلدینگ',
    'گروه مالی': 'گروه مالی',
    'گروه': 'گروه',
  }

  return Array.from(groups.entries())
    .map(([core, g]) => {
      const types = [...g.entityTypes].filter(Boolean)
      const multiType = types.length > 1

      const displayName = multiType
        ? `گروه ${core}`
        : types.length === 1
          ? `${ENTITY_LABEL[types[0]] ?? types[0]} ${core}`.trim()
          : core

      // AUM (billion toman)
      const aumBT = g.funds.reduce((s, f) => s + (f.sizeRial || 0), 0) / 1e10

      // Money flow over the period (billion toman)
      let flowBT = 0
      for (const f of g.funds) {
        if (Number.isFinite(f.unitsStart) && f.navRet > 0)
          flowBT += (f.units - f.unitsStart) * f.navRet / 1e10
      }
      const startAumBT = aumBT - flowBT
      const flowPct = startAumBT > 0.1 ? (flowBT / startAumBT) * 100 : null

      // Earliest fund (seniority)
      const dates = g.funds.map((f) => f.initiationDate).filter(Boolean).sort()
      const years = dates.length ? yearsSince(dates[0], endISO) : null

      return {
        id: core,
        name: displayName,
        core,
        aumBT,
        aumTBT: aumBT / 1000,
        flowBT,
        flowPct,
        fundCount: g.funds.length,
        years,
        isGroup: multiType,
        funds: g.funds,
      }
    })
    .filter((m) => m.aumBT > 0)
    .sort((a, b) => b.aumBT - a.aumBT)
}

// ── Marketing performance (مارکتینگ صندوق‌ها صفحه) ──────────────────────────
// Compares each fund's actual net flow to what it "deserved" based on its
// start-of-period market share within its category. A fund that attracts
// more than its proportional share outperformed marketing-wise.
//
// Works correctly for both inflow and outflow categories:
//   expectedFlow = marketShare × categoryTotalFlow
//   delta        = actualFlow − expectedFlow
//   relativePerf = delta / |expectedFlow| × 100

const MARKETING_LEVELS = [
  { label: 'بیگ بنگ',    color: '#A78BFA', bg: 'rgba(167,139,250,0.18)', icon: '🚀', score: 5 },
  { label: 'بوم',         color: '#00FF9D', bg: 'rgba(0,255,157,0.14)',   icon: '💥', score: 4 },
  { label: 'بسیار موفق', color: '#00D4FF', bg: 'rgba(0,212,255,0.12)',   icon: '⭐', score: 3 },
  { label: 'موفق',        color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  icon: '↑',  score: 2 },
  { label: 'بی‌تاثیر',   color: '#8A94A6', bg: 'rgba(138,148,166,0.08)', icon: '→',  score: 1 },
  { label: 'ناموفق',      color: '#FF3B6B', bg: 'rgba(255,59,107,0.12)', icon: '↓',  score: 0 },
]
export { MARKETING_LEVELS }

function marketingLevel(relativePerf) {
  if (relativePerf == null) return null
  if (relativePerf > 100) return MARKETING_LEVELS[0]
  if (relativePerf > 30)  return MARKETING_LEVELS[1]
  if (relativePerf > 0)   return MARKETING_LEVELS[2]
  if (relativePerf > -20) return MARKETING_LEVELS[3]
  if (relativePerf > -50) return MARKETING_LEVELS[4]
  return MARKETING_LEVELS[5]
}

export function computeMarketing(funds, typeId) {
  const catFunds = typeId === 0
    ? funds.filter((f) => !f.isCharity)
    : funds.filter((f) => f.type === typeId && !f.isCharity)

  // Per-fund: flow and implied start AUM
  const enriched = catFunds.map((f) => {
    const flowRial =
      Number.isFinite(f.unitsStart) && f.navRet > 0
        ? (f.units - f.unitsStart) * f.navRet
        : 0
    const startAumRial = Math.max(0, (f.sizeRial || 0) - flowRial)
    return { ...f, flowRial, startAumRial }
  })

  const catStartAum = enriched.reduce((s, f) => s + f.startAumRial, 0)
  const catFlow = enriched.reduce((s, f) => s + f.flowRial, 0)
  const absCatFlow = Math.abs(catFlow)

  return enriched.map((f) => {
    const marketSharePct = catStartAum > 0 ? (f.startAumRial / catStartAum) * 100 : 0
    const expectedFlowRial = (marketSharePct / 100) * catFlow
    const deltaRial = f.flowRial - expectedFlowRial

    // Guard: very small expected flow → avoid divide-by-zero; clamp relative perf
    const absExpected = Math.abs(expectedFlowRial)
    const minDenominator = absCatFlow * 0.001 // 0.1% of category flow
    const denom = Math.max(absExpected, minDenominator)
    const relativePerf = denom > 0 ? (deltaRial / denom) * 100 : 0

    const level = marketingLevel(relativePerf)

    return {
      ...f,
      marketSharePct,
      flowBT: f.flowRial / 1e10,
      expectedFlowBT: expectedFlowRial / 1e10,
      deltaAbsBT: deltaRial / 1e10,
      relativePerf,
      marketingLevel: level,
      marketingScore: level?.score ?? 0,
    }
  })
}

// Split fixed-income (type 4) funds into 4 sub-categories:
//   tradeable (ETF) vs issuance/redemption × dividend vs accumulating
export function splitFixedIncome(funds) {
  const fi = funds.filter((f) => f.type === 4)
  return {
    etfDividend:         fi.filter((f) =>  f.isETF && f.dividendDays > 0),
    etfAccumulating:     fi.filter((f) =>  f.isETF && f.dividendDays <= 0),
    issuanceDividend:    fi.filter((f) => !f.isETF && f.dividendDays > 0),
    issuanceAccumulating:fi.filter((f) => !f.isETF && f.dividendDays <= 0),
  }
}

// ── AUM Segmentation (بخشبندی صندوق‌ها) ─────────────────────────────────────
// Divides funds of a given type into 7 AUM-based segments (Seg1=smallest, Seg7=largest)
// using heptile (7-quantile) breakpoints derived from the actual data distribution.

const TYPE_ABBR = { 4: 'FI', 6: 'EQ', 7: 'MX', 22: 'LV', 5: 'CM', 23: 'IX', 21: 'SC' }

// Segment colors from cool-blue (small) to warm-gold (large)
const SEG_COLORS = [
  '#60A5FA', // Seg1 – blue
  '#34D399', // Seg2 – teal
  '#A78BFA', // Seg3 – violet
  '#00D4FF', // Seg4 – cyan
  '#FBBF24', // Seg5 – amber
  '#F97316', // Seg6 – orange
  '#FF3B6B', // Seg7 – red/gold (mega)
]

function segmentGroup(groupFunds, abbr, colorOffset = 0) {
  const sorted = [...groupFunds].sort((a, b) => b.sizeRial - a.sizeRial)
  const n = sorted.length
  if (n === 0) return []
  const segments = []
  for (let seg = 1; seg <= 7; seg++) {
    const startIdx = Math.floor(((seg - 1) * n) / 7)
    const endIdx   = Math.floor((seg * n) / 7)
    const segFunds = sorted.slice(startIdx, endIdx)
    if (segFunds.length === 0) continue
    const minBT   = segFunds[0].sizeRial / 1e10
    const maxBT   = segFunds[segFunds.length - 1].sizeRial / 1e10
    const totalBT = segFunds.reduce((s, f) => s + f.sizeRial / 1e10, 0)
    segments.push({
      label:   `Seg${seg}-${abbr}`,
      seg,
      color:   SEG_COLORS[(seg - 1 + colorOffset) % SEG_COLORS.length],
      funds:   segFunds,
      count:   segFunds.length,
      minBT,
      maxBT,
      totalBT,
      meanBT: totalBT / segFunds.length,
    })
  }
  return segments
}

export function computeSegmentation(funds, typeId) {
  const abbr = TYPE_ABBR[typeId] ?? 'XX'
  const typeFunds = funds.filter((f) => f.type === typeId && !f.isCharity && f.sizeRial > 0)

  if (typeFunds.length === 0) return []

  // درآمد ثابت: دو گروه جداگانه (تقسیم سودی / جمع‌شونده)
  if (typeId === 4) {
    const dividend     = typeFunds.filter((f) => f.dividendDays > 0)
    const accumulating = typeFunds.filter((f) => f.dividendDays <= 0)
    return [
      ...segmentGroup(dividend,     'FI-تقسیم', 0),
      ...segmentGroup(accumulating, 'FI-جمع',   3),
    ]
  }

  return segmentGroup(typeFunds, abbr, 0)
}

// ── Rankings (رتبه‌بندی بازدهی و AUM) ────────────────────────────────────────
// mode: 'return' | 'aum'
// Returns rows sorted by rank asc, each with: rank, priorRank, rankChange, value
export function computeRankings(currentFunds, priorFunds, typeId, mode) {
  const filter = (arr) =>
    typeId === 0
      ? arr
      : arr.filter((f) => f.type === typeId)

  const getValue =
    mode === 'return'
      ? (f) => (Number.isFinite(f.rangeReturn) && Math.abs(f.rangeReturn) < 10000 ? f.rangeReturn : null)
      : (f) => (f.navRet > 0 && f.units > 0 ? f.navRet * f.units : null)

  const rank = (arr) =>
    [...filter(arr)]
      .filter((f) => getValue(f) != null)
      .sort((a, b) => getValue(b) - getValue(a))
      .map((f, i) => ({ regNo: f.regNo, rank: i + 1 }))

  const currRanked = rank(currentFunds)
  const priorRankMap = new Map(rank(priorFunds).map((r) => [r.regNo, r.rank]))
  const currRankMap  = new Map(currRanked.map((r) => [r.regNo, r.rank]))

  const currById = new Map(filter(currentFunds).map((f) => [f.regNo, f]))

  return currRanked.map(({ regNo, rank: r }) => {
    const f = currById.get(regNo)
    const priorRank = priorRankMap.get(regNo) ?? null
    return {
      ...f,
      rank: r,
      value: getValue(f),
      priorRank,
      rankChange: priorRank != null ? priorRank - r : null,
    }
  })
}
