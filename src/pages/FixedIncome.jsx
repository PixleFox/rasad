import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { fixedIncomeColumnParts } from '../components/fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { splitFixedIncome, enrichFunds, faNum, daysBetween } from '../lib/fipiran'
import { fixedIncomeDeclaredRates } from '../data/fixedIncomeDeclaredRates'
import FundSummary from '../components/FundSummary'

const TABS = [
  { id: 'etfDividend',          label: 'ETF تقسیم سودی',    badge: 'قابل معامله · با پرداخت سود' },
  { id: 'etfAccumulating',      label: 'ETF جمع‌شونده',      badge: 'قابل معامله · بدون پرداخت سود' },
  { id: 'issuanceDividend',     label: 'صدور/ابطالی تقسیم سودی',    badge: 'غیرقابل معامله · با پرداخت سود' },
  { id: 'issuanceAccumulating', label: 'صدور/ابطالی جمع‌شونده',      badge: 'غیرقابل معامله · بدون پرداخت سود' },
]

const normalizeText = (value) => String(value || '')
  .trim()
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/[\u200c\u200d\u200e\u200f]/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/^(?:صندوق سرمایه گذاری|صندوق سرمایه‌گذاری|در اوراق بهادار با درآمد ثابت|درآمد ثابت|نوع دوم)\s+/g, '')
  .replace(/\s+/g, ' ')

const compactKey = (value) => normalizeText(value).replace(/\s+/g, '')
const declaredBySymbol = new Map(fixedIncomeDeclaredRates.filter((rate) => rate.symbol).map((rate) => [compactKey(rate.symbol), rate]))
const declaredByName = new Map(fixedIncomeDeclaredRates.map((rate) => [compactKey(rate.name), rate]))

function findDeclaredRate(fund) {
  const bySymbol = fund.symbol ? declaredBySymbol.get(compactKey(fund.symbol)) : null
  if (bySymbol) return bySymbol
  const fundName = compactKey(fund.name)
  return declaredByName.get(fundName) || null
}

function annualizedYtm(rangeReturn, dayCount) {
  if (!Number.isFinite(rangeReturn) || !Number.isFinite(dayCount) || dayCount <= 0 || rangeReturn <= -100) return null
  return (Math.pow(1 + rangeReturn / 100, 365 / dayCount) - 1) * 100
}

function buildColumns(tab) {
  const c = fixedIncomeColumnParts
  const dividend = tab === 'etfDividend' || tab === 'issuanceDividend'
  const issuance = tab === 'issuanceDividend' || tab === 'issuanceAccumulating'
  return [
    c.name,
    ...(!issuance ? [c.symbol] : []),
    c.size,
    ...(!dividend ? [c.ytm] : []),
    c.declaredRate,
    c.years,
    {
      key: 'reserve',
      label: 'ذخیره صندوق (میلیارد تومان)',
      sortVal: (f) => f.reserve,
      exportValue: (f) => f.reserve,
      render: (f) =>
        f.reserve != null ? (
          <span
            className="text-sm font-dana tabular-nums"
            style={{ fontWeight: 700, color: f.reserve >= 0 ? '#00FF9D' : '#FF3B6B' }}
          >
            {(f.reserve >= 0 ? '+' : '−') + faNum(Math.abs(Math.round(f.reserve)))}
          </span>
        ) : (
          <span className="text-text-muted/40 text-xs">—</span>
        ),
    },
    c.score,
    c.site,
  ]
}

export default function FixedIncome() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds({
    useEtfMarketReturns: true,
    etfMarketTypes: [4],
    marketPriceField: 'pDrCotVal',
  })
  const [tab, setTab] = useState('etfDividend')

  const groups = useMemo(() => {
    const split = splitFixedIncome(funds)
    const addDeclaredAndYtm = (rows) => enrichFunds(rows, endDate || endISO).map((fund) => {
      const declared = findDeclaredRate(fund)
      const dayCount = fund.rangeDayCount || daysBetween(startDate || startISO, endDate || endISO)
      return {
        ...fund,
        declaredRate: declared?.declaredRate ?? null,
        declaredRateUpdatedAt: declared?.updatedAt ?? null,
        ytmReturn: annualizedYtm(fund.rangeReturn, dayCount),
      }
    })
    return {
      etfDividend:          addDeclaredAndYtm(split.etfDividend),
      etfAccumulating:      addDeclaredAndYtm(split.etfAccumulating),
      issuanceDividend:     addDeclaredAndYtm(split.issuanceDividend),
      issuanceAccumulating: addDeclaredAndYtm(split.issuanceAccumulating),
    }
  }, [funds, startDate, endDate, startISO, endISO])

  const rows = groups[tab]
  const getTabCount = (id) => groups[id]?.length ?? 0
  const dividendTab = tab === 'etfDividend' || tab === 'issuanceDividend'
  const columns = useMemo(() => buildColumns(tab), [tab])

  return (
    <FundsPageLayout
      badge="صندوق‌های درآمد ثابت"
      accentColor="#00FF9D"
      title="صندوق‌های"
      highlight="درآمد ثابت"
      subtitle="کم‌ریسک‌ترین دسته — مناسب حفظ ارزش سرمایه"
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
        {[...TABS].sort((a, b) => getTabCount(b.id) - getTabCount(a.id)).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-start px-4 py-2 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
              tab === t.id
                ? 'bg-neon-green/15 text-neon-green border border-neon-green/40'
                : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
            }`}
            style={{ fontWeight: 600 }}
          >
            <span className="flex items-center gap-1.5">
              {t.label}
              {(!loading || t.id === 'declaredRates') && (
                <span className="text-xs opacity-70">({faNum(getTabCount(t.id))})</span>
              )}
            </span>
            <span className="text-[0.65rem] opacity-50 mt-0.5" style={{ fontWeight: 400 }}>{t.badge}</span>
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <FundSummary rows={rows} loading={loading} showReturns={!dividendTab} returnKey="ytmReturn" returnLabel="YTM میانگین" />
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="score"
          minWidth={900}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
          goodSortKeys={['score', 'ytm', 'size', 'years', 'reserve', 'declaredRate']}
          rowKey={(row) => row.id ?? row.regNo}
          exportFileName="fixed-income-funds"
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران، TSETMC و فایل دستی نرخ اعلامی · بازده ETFها از آخرین قیمت معامله تاریخی بازار و بازده صندوق‌های صدور/ابطالی از NAV ابطال محاسبه می‌شود · ذخیره صندوق = (قیمت آماری − قیمت ابطال) × تعداد واحد
      </p>
    </FundsPageLayout>
  )
}
