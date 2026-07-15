import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { otherFundsColumns } from '../components/fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, faNum } from '../lib/fipiran'
import FundSummary from '../components/FundSummary'
import { useMarketBubbles } from '../hooks/useMarketBubbles'

const TABS = [
  { id: 'gold', label: 'طلا', badge: 'طلا، سکه و پشتوانه طلا' },
  { id: 'silver', label: 'نقره', badge: 'صندوق‌های مبتنی بر نقره' },
  { id: 'saffron', label: 'زعفران', badge: 'صندوق‌های مبتنی بر زعفران' },
  { id: 'energy', label: 'انرژی', badge: 'نفت، برق، گاز و انرژی' },
]

const commodityColumns = otherFundsColumns.filter((column) => column.key !== 'risk')

const normalizeText = (value) => String(value || '')
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/\s+/g, ' ')
  .trim()

const isoToTseDate = (iso) => Number(String(iso || '').replaceAll('-', ''))
const tseDateToISO = (date) => {
  const value = String(date || '')
  return value.length === 8 ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : null
}

const cleanSupplementalName = (value) => normalizeText(value)
  .replace(/\s*(?:[-–—]\s*)?(?:\d+|[۰-۹]+|[٠-٩]+|یک|يک|اول|دوم|سوم|چهارم|پنجم|ششم)\s*$/g, '')
  .trim()

const subtypeBySymbol = {
  سینرژی: 'energy',
  سیگلو: 'silver',
  سیمین: 'silver',
  سیلور: 'silver',
  نقرابی: 'silver',
  نقران: 'silver',
  نقرسا: 'silver',
  نقرفام: 'silver',
  نقرین: 'silver',
  آتش: 'gold',
  درنا: 'gold',
  لیان: 'gold',
  درخشان: 'gold',
  نهال: 'saffron',
  ناب: 'gold',
  رز: 'gold',
  زمرد: 'gold',
  امرالد: 'gold',
  تابش: 'gold',
  ریتون: 'gold',
}

const supplementalSilverFunds = [
  {
    regNo: 'tsetmc-10098482000925815',
    name: 'کالای آشنای یک',
    symbol: 'سیگلو',
    manager: 'آشنا',
    insCode: '10098482000925815',
  },
  {
    regNo: 'tsetmc-18156575395080321',
    name: 'بازده نقره نوا',
    symbol: 'سیلور',
    manager: 'بازده',
    insCode: '18156575395080321',
  },
  {
    regNo: 'tsetmc-33761569293467411',
    name: 'نقره سیمین هوبر',
    symbol: 'سیمین',
    manager: 'هامرز',
    insCode: '33761569293467411',
  },
  {
    regNo: 'tsetmc-8620139816622134',
    name: 'کالای کهکشان فیروزه یک',
    symbol: 'نقرابی',
    manager: 'توسعه فیروزه',
    insCode: '8620139816622134',
  },
  {
    regNo: 'tsetmc-41483334879559487',
    name: 'کالای کهربا یک',
    symbol: 'نقران',
    manager: 'کاریزما',
    insCode: '41483334879559487',
  },
  {
    regNo: 'tsetmc-47717365931256099',
    name: 'کالای پارسیان یک',
    symbol: 'نقرسا',
    manager: 'لوتوس پارسیان',
    insCode: '47717365931256099',
  },
  {
    regNo: 'tsetmc-30714541738317499',
    name: 'کالای تابان تمدن یک',
    symbol: 'نقرفام',
    manager: 'تمدن',
    insCode: '30714541738317499',
  },
  {
    regNo: 'tsetmc-12590355983583239',
    name: 'کالای نوویرا یک',
    symbol: 'نقرین',
    manager: 'نوویرا',
    insCode: '12590355983583239',
  },
]

function buildSupplementalFund(item, metrics = {}) {
  return {
    ...item,
    name: cleanSupplementalName(item.name),
    id: item.regNo,
    type: 5,
    typeLabel: 'کالایی',
    isCharity: false,
    isETF: true,
    isSupplementalTsetmc: true,
    sizeRial: metrics.sizeRial ?? 0,
    units: 0,
    navRet: metrics.navRet ?? 0,
    statNav: 0,
    cancelNav: metrics.navRet ?? 0,
    issueNav: 0,
    oneYearReturn: null,
    dividendDays: 0,
    initiationDate: null,
    rangeReturn: metrics.rangeReturn ?? null,
    rangeSource: 'tsetmc',
    marketReturnStartDate: metrics.startDate ?? null,
    marketReturnEndDate: metrics.endDate ?? null,
    comp: { stock: 0, bond: 0, cash: 0, deposit: 0, other: 100 },
    website: null,
    dataDate: null,
  }
}

function nearestDailyPrice(dailyList, iso) {
  const target = isoToTseDate(iso)
  return [...dailyList]
    .filter((row) => Number(row?.dEven) <= target && Number(row?.pDrCotVal) > 0)
    .sort((a, b) => Number(b.dEven) - Number(a.dEven))[0] || null
}

async function fetchSupplementalSilverMetric(fund, startISO, endISO) {
  const [infoRes, etfRes, dailyRes] = await Promise.all([
    fetch(`/tsetmc/Instrument/GetInstrumentInfo/${fund.insCode}`),
    fetch(`/tsetmc/Fund/GetETFByInsCode/${fund.insCode}`),
    fetch(`/tsetmc/ClosingPrice/GetClosingPriceDailyList/${fund.insCode}/400`),
  ])
  const [info, etf, daily] = await Promise.all([infoRes.json(), etfRes.json(), dailyRes.json()])
  const units = Number(info?.instrumentInfo?.etfIssuedUnit) || Number(info?.instrumentInfo?.zTitad) || 0
  const nav = Number(etf?.etf?.pRedTran) || 0
  const dailyList = Array.isArray(daily?.closingPriceDaily) ? daily.closingPriceDaily : []
  const startRow = nearestDailyPrice(dailyList, startISO)
  const endRow = nearestDailyPrice(dailyList, endISO)
  const startPrice = Number(startRow?.pDrCotVal)
  const endPrice = Number(endRow?.pDrCotVal)
  return {
    sizeRial: units > 0 && nav > 0 ? units * nav : 0,
    navRet: nav,
    rangeReturn: startPrice > 0 && endPrice > 0 ? (endPrice / startPrice - 1) * 100 : null,
    startDate: tseDateToISO(startRow?.dEven),
    endDate: tseDateToISO(endRow?.dEven),
  }
}

function commoditySubtype(fund) {
  const symbol = normalizeText(fund.symbol)
  if (subtypeBySymbol[symbol]) return subtypeBySymbol[symbol]
  const text = normalizeText(`${fund.name} ${fund.symbol}`)
  if (/نقره|سیمین|سیلور/i.test(text)) return 'silver'
  if (/زعفران|سحرخیز/i.test(text)) return 'saffron'
  if (/انرژی|نفت|برق|گاز/i.test(text)) return 'energy'
  if (/طلا|سکه|زر|زرد|گلد|گلدیس|گوهر|جواهر|کهربا|مثقال|قیراط|دفینه|زروان|آلتون|زرفام|زرگر|رزگلد|گلدا|گنج|نگین|میراث|همیان|نفیس|قلک گلد/i.test(text)) {
    return 'gold'
  }
  return 'gold'
}

export default function Commodity() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [tab, setTab] = useState('gold')
  const [supplementalMetrics, setSupplementalMetrics] = useState({})

  useEffect(() => {
    let cancelled = false
    Promise.all(supplementalSilverFunds.map(async (fund) => {
      try {
        return [fund.insCode, await fetchSupplementalSilverMetric(fund, startISO, endISO)]
      } catch {
        return [fund.insCode, null]
      }
    })).then((entries) => {
      if (!cancelled) setSupplementalMetrics(Object.fromEntries(entries.filter(([, value]) => value)))
    })
    return () => {
      cancelled = true
    }
  }, [startISO, endISO])

  const allRows = useMemo(() => {
    const commodityFunds = funds.filter((fund) => fund.type === 5 && !fund.isCharity)
    const seen = new Set(commodityFunds.flatMap((fund) => [fund.insCode, normalizeText(fund.symbol)]).filter(Boolean))
    const supplemental = supplementalSilverFunds
      .filter((fund) => !seen.has(fund.insCode) && !seen.has(normalizeText(fund.symbol)))
      .map((fund) => buildSupplementalFund(fund, supplementalMetrics[fund.insCode]))
    return enrichFunds([...commodityFunds, ...supplemental], endDate || endISO)
  }, [funds, endDate, endISO, supplementalMetrics])
  const groups = useMemo(() => {
    const next = Object.fromEntries(TABS.map((item) => [item.id, []]))
    allRows.forEach((fund) => {
      next[commoditySubtype(fund)].push(fund)
    })
    return next
  }, [allRows])
  const rows = useMarketBubbles(groups[tab] || [])
  const getTabCount = (id) => groups[id]?.length ?? 0

  return (
    <FundsPageLayout
      badge="صندوق‌های کالایی"
      accentColor="#FBBF24"
      title="صندوق‌های"
      highlight="کالایی"
      subtitle="سرمایه‌گذاری در طلا، نقره، زعفران، انرژی و سایر کالاها"
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
      floatAsset="/assets/satelite.png"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-start px-4 py-2 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
              tab === item.id
                ? 'bg-amber-400/15 text-amber-300 border border-amber-300/40'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-amber-300/30 hover:text-text-primary'
            }`}
            style={{ fontWeight: 600 }}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {!loading && <span className="text-xs opacity-70">({faNum(getTabCount(item.id))})</span>}
            </span>
            <span className="text-[0.65rem] opacity-50 mt-0.5" style={{ fontWeight: 400 }}>{item.badge}</span>
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundSummary rows={rows} loading={loading} />
        <FundsTable
          columns={commodityColumns}
          rows={rows}
          defaultSortKey="score"
          minWidth={860}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((date) => date)}
          emptyText="صندوقی در این دسته یافت نشد."
          exportFileName={`commodity-funds-${tab}`}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران و TSETMC · حباب NAV از اختلاف آخرین قیمت معامله و NAV ابطال محاسبه می‌شود.
      </p>
    </FundsPageLayout>
  )
}
