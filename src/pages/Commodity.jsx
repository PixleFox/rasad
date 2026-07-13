import { useMemo, useState } from 'react'
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
  { id: 'other', label: 'سایر کالایی', badge: 'چندکالایی یا نامشخص' },
]

const commodityColumns = otherFundsColumns.filter((column) => column.key !== 'risk')

const normalizeText = (value) => String(value || '')
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/\s+/g, ' ')
  .trim()

const subtypeBySymbol = {
  سینرژی: 'energy',
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
}

const supplementalSilverFunds = [
  {
    regNo: 'tsetmc-18156575395080321',
    name: 'بازده نقره نوا',
    symbol: 'سیلور',
    manager: '',
    insCode: '18156575395080321',
  },
  {
    regNo: 'tsetmc-33761569293467411',
    name: 'نقره سیمین هوبر',
    symbol: 'سیمین',
    manager: '',
    insCode: '33761569293467411',
  },
]

function buildSupplementalFund(item) {
  return {
    ...item,
    id: item.regNo,
    type: 5,
    typeLabel: 'کالایی',
    isCharity: false,
    isETF: true,
    isSupplementalTsetmc: true,
    sizeRial: 0,
    units: 0,
    navRet: 0,
    statNav: 0,
    cancelNav: 0,
    issueNav: 0,
    oneYearReturn: null,
    dividendDays: 0,
    initiationDate: null,
    rangeReturn: null,
    rangeSource: 'tsetmc',
    comp: { stock: 0, bond: 0, cash: 0, deposit: 0, other: 100 },
    website: null,
    dataDate: null,
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
  return 'other'
}

export default function Commodity() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [tab, setTab] = useState('gold')

  const allRows = useMemo(() => {
    const commodityFunds = funds.filter((fund) => fund.type === 5 && !fund.isCharity)
    const seen = new Set(commodityFunds.flatMap((fund) => [fund.insCode, normalizeText(fund.symbol)]).filter(Boolean))
    const supplemental = supplementalSilverFunds
      .filter((fund) => !seen.has(fund.insCode) && !seen.has(normalizeText(fund.symbol)))
      .map(buildSupplementalFund)
    return enrichFunds([...commodityFunds, ...supplemental], endDate || endISO)
  }, [funds, endDate, endISO])
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
