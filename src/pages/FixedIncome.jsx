import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { fixedIncomeColumnParts } from '../components/fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { splitFixedIncome, enrichFunds, fetchTsetmcQuality, fetchEtfDividendEvent, computeBoardQualityScore, faNum, daysBetween, toMonthlyScheduleLabel } from '../lib/fipiran'
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

function reserveScore(fund) {
  const aumBT = fund.sizeRial > 0 ? fund.sizeRial / 1e10 : null
  if (!Number.isFinite(fund.reserve) || !aumBT) return 0
  const pct = (fund.reserve / aumBT) * 100
  if (pct <= 0) return 0
  return Number(Math.min(15, 15 * Math.pow(Math.min(pct, 30) / 30, 0.55)).toFixed(1))
}

function negativeReservePenalty(fund) {
  if (!Number.isFinite(fund.reserve) || fund.reserve >= 0) return 0
  const absReserveBT = Math.abs(fund.reserve)
  if (absReserveBT >= 100) return -10
  if (absReserveBT >= 50) return -7
  if (absReserveBT >= 20) return -4
  return -2
}

function historyScore(years) {
  if (!Number.isFinite(years)) return 0
  if (years > 5) return 5
  if (years >= 3) return 4
  if (years >= 1) return 3
  return 0
}

function aumScore(sizeRial) {
  const hemat = Number(sizeRial) / 1e13
  if (!Number.isFinite(hemat) || hemat <= 0) return 0
  if (hemat >= 50) return 20
  if (hemat >= 5) return Number((8 + ((hemat - 5) / 45) * 12).toFixed(1))
  if (hemat >= 1) return Number((2 + ((hemat - 1) / 4) * 6).toFixed(1))
  return Number(Math.max(0.5, hemat * 2).toFixed(1))
}

function buildReturnScoreMap(rows) {
  const scoreForYtm = (ytmReturn) => {
    if (!Number.isFinite(ytmReturn)) return 0
    if (ytmReturn <= 30) return 0
    const strength = Math.min(1, (ytmReturn - 30) / 12)
    return Number((40 * Math.pow(strength, 1.1)).toFixed(1))
  }
  return new Map(rows.map((fund) => [fund.regNo, scoreForYtm(fund.ytmReturn)]))
}

function applyEtfScore(rows, qData) {
  const returnScores = buildReturnScoreMap(rows)
  return rows.map((fund) => {
    const boardRaw = computeBoardQualityScore(fund, qData[fund.insCode])?.total ?? 0
    const boardScore = Number(((boardRaw / 35) * 20).toFixed(1))
    const reserve = reserveScore(fund)
    const ytm = returnScores.get(fund.regNo) ?? 0
    const history = historyScore(fund.years)
    const aum = aumScore(fund.sizeRial)
    const reservePenalty = negativeReservePenalty(fund)
    const rasadScore = Math.max(0, Math.min(100, boardScore + reserve + reservePenalty + ytm + history + aum))
    return {
      ...fund,
      rasadScore,
      rasadScoreMax: 100,
      rasadScoreParts: { board: boardScore, reserve, reservePenalty, ytm, history, aum },
    }
  })
}

function buildColumns(tab) {
  const c = fixedIncomeColumnParts
  const dividend = tab === 'etfDividend' || tab === 'issuanceDividend'
  const issuance = tab === 'issuanceDividend' || tab === 'issuanceAccumulating'
  return [
    c.name,
    ...(!issuance ? [c.symbol] : []),
    c.size,
    ...(!dividend ? [c.return] : []),
    ...(tab === 'etfDividend' || !dividend ? [c.ytm] : []),
    ...(tab === 'etfDividend' ? [{
      key: 'dividendDate',
      label: 'زمان تقسیم سود',
      sortVal: (f) => f.dividendDayOfMonth,
      exportValue: (f) => f.dividendDate ? toMonthlyScheduleLabel(f.dividendDate) : null,
      render: (f) => f.dividendDate ? (
        <span className="text-sm font-dana tabular-nums text-text-primary" style={{ fontWeight: 700 }}>
          {toMonthlyScheduleLabel(f.dividendDate)}
        </span>
      ) : <span className="text-text-muted/40 text-xs">—</span>,
    }] : []),
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
  const [tab, setTab] = useState('etfAccumulating')
  const [qData, setQData] = useState({})
  const [qLoading, setQLoading] = useState(false)
  const [dividendData, setDividendData] = useState({})
  const [dividendLoading, setDividendLoading] = useState(false)

  const fixedIncomeEtfs = useMemo(
    () => funds.filter((fund) => fund.type === 4 && fund.isETF && fund.insCode),
    [funds]
  )
  const dividendEtfs = useMemo(() => fixedIncomeEtfs.filter((fund) => fund.dividendDays > 0), [fixedIncomeEtfs])

  useEffect(() => {
    if (!fixedIncomeEtfs.length) {
      setQLoading(false)
      return
    }
    let cancelled = false
    setQLoading(true)
    Promise.all(fixedIncomeEtfs.map(async (fund) => {
      try {
        return [fund.insCode, await fetchTsetmcQuality(fund.insCode)]
      } catch {
        return [fund.insCode, null]
      }
    }))
      .then((pairs) => {
        if (cancelled) return
        setQData((prev) => {
          const next = { ...prev }
          pairs.forEach(([insCode, data]) => {
            if (data) next[insCode] = data
          })
          return next
        })
      })
      .finally(() => {
        if (!cancelled) setQLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fixedIncomeEtfs])

  useEffect(() => {
    if (!dividendEtfs.length) {
      setDividendData({})
      setDividendLoading(false)
      return
    }
    let cancelled = false
    setDividendLoading(true)
    Promise.all(dividendEtfs.map(async (fund) => {
      try {
        return [fund.regNo, await fetchEtfDividendEvent(fund, endISO, 'pDrCotVal')]
      } catch {
        return [fund.regNo, null]
      }
    }))
      .then((pairs) => {
        if (!cancelled) setDividendData(Object.fromEntries(pairs.filter(([, data]) => data)))
      })
      .finally(() => {
        if (!cancelled) setDividendLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dividendEtfs, endISO])

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
    const etfAccumulating = addDeclaredAndYtm(split.etfAccumulating)
    const etfDividend = addDeclaredAndYtm(split.etfDividend).map((fund) => {
      const event = dividendData[fund.regNo]
      return event ? { ...fund, ...event, ytmReturn: event.dividendAnnualizedReturn } : { ...fund, ytmReturn: null }
    })
    return {
      etfDividend:          applyEtfScore(etfDividend, qData),
      etfAccumulating:      applyEtfScore(etfAccumulating, qData),
      issuanceDividend:     addDeclaredAndYtm(split.issuanceDividend),
      issuanceAccumulating: addDeclaredAndYtm(split.issuanceAccumulating),
    }
  }, [funds, startDate, endDate, startISO, endISO, qData, dividendData])

  const rows = groups[tab]
  const getTabCount = (id) => groups[id]?.length ?? 0
  const dividendTab = tab === 'etfDividend' || tab === 'issuanceDividend'
  const activeLoading = loading || ((tab === 'etfAccumulating' || tab === 'etfDividend') && qLoading) || (tab === 'etfDividend' && dividendLoading)
  const columns = useMemo(() => buildColumns(tab), [tab])

  return (
    <FundsPageLayout
      badge="صندوق‌های درآمد ثابت"
      accentColor="#00FF9D"
      title="صندوق‌های"
      highlight="درآمد ثابت"
      subtitle="کم‌ریسک‌ترین دسته — مناسب حفظ ارزش سرمایه"
      loading={activeLoading}
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
        <FundSummary rows={rows} loading={activeLoading} showReturns={!dividendTab || tab === 'etfDividend'} returnKey="ytmReturn" returnLabel="بازدهی سالانه‌شده میانگین" />
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="score"
          minWidth={900}
          loading={activeLoading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
          goodSortKeys={['score', 'ytm', 'size', 'years', 'reserve', 'declaredRate']}
          rowKey={(row) => row.id ?? row.regNo}
          exportFileName="fixed-income-funds"
          defaultHiddenColumnKeys={['years', '__dollarValue']}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران، TSETMC و فایل دستی نرخ اعلامی · بازده ETFها از آخرین قیمت معامله تاریخی بازار و بازده صندوق‌های صدور/ابطالی از NAV ابطال محاسبه می‌شود · ذخیره صندوق = (قیمت آماری − قیمت ابطال) × تعداد واحد
      </p>
    </FundsPageLayout>
  )
}
