import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from './FundsPageLayout'
import FundsTable from './FundsTable'
import { otherFundsColumns } from './fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, faNum } from '../lib/fipiran'
import FundSummary from './FundSummary'
import { useMarketBubbles } from '../hooks/useMarketBubbles'

const isoToTseDate = (iso) => Number(String(iso || '').replaceAll('-', ''))
const tseDateToISO = (date) => {
  const value = String(date || '')
  return value.length === 8 ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : null
}

const normalizeSymbol = (value) => String(value || '')
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/\s+/g, ' ')
  .trim()

const cleanSupplementalName = (value) => normalizeSymbol(value)
  .replace(/\s*(?:[-–—]\s*)?(?:\d+|[۰-۹]+|[٠-٩]+|یک|يک|اول|دوم|سوم|چهارم|پنجم|ششم)\s*$/g, '')
  .trim()

function nearestDailyPrice(dailyList, iso) {
  const target = isoToTseDate(iso)
  return [...dailyList]
    .filter((row) => Number(row?.dEven) <= target && Number(row?.pDrCotVal) > 0)
    .sort((a, b) => Number(b.dEven) - Number(a.dEven))[0] || null
}

async function fetchSupplementalMetric(fund, startISO, endISO) {
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
    marketReturnStartDate: tseDateToISO(startRow?.dEven),
    marketReturnEndDate: tseDateToISO(endRow?.dEven),
  }
}

function buildSupplementalFund(item, typeId, metrics = {}) {
  return {
    ...item,
    name: cleanSupplementalName(item.name),
    regNo: item.regNo || `tsetmc-${item.insCode}`,
    id: item.regNo || `tsetmc-${item.insCode}`,
    type: typeId,
    isCharity: false,
    isETF: true,
    isSupplementalTsetmc: true,
    sizeRial: metrics.sizeRial ?? 0,
    manager: item.manager || '',
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
    marketReturnStartDate: metrics.marketReturnStartDate ?? null,
    marketReturnEndDate: metrics.marketReturnEndDate ?? null,
    comp: { stock: 100, bond: 0, cash: 0, deposit: 0, other: 0 },
    website: null,
    dataDate: null,
  }
}

export default function FundCategoryPage({
  typeId,
  badge,
  accentColor = '#00D4FF',
  title,
  highlight,
  titleTail,
  subtitle,
  floatAsset,
  footnote,
  excludeColumns = [],
  splitByTradingType = false,
  supplementalFunds = [],
  includeLeveragedRatio = false,
}) {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [tab, setTab] = useState('etf')
  const [supplementalMetrics, setSupplementalMetrics] = useState({})
  const [leveragedRatios, setLeveragedRatios] = useState({})

  const leveragedRegNos = useMemo(
    () => includeLeveragedRatio
      ? funds.filter((fund) => fund.type === typeId && !fund.isCharity && fund.regNo).map((fund) => String(fund.regNo)).sort()
      : [],
    [funds, typeId, includeLeveragedRatio]
  )

  useEffect(() => {
    if (!includeLeveragedRatio || !leveragedRegNos.length) {
      setLeveragedRatios({})
      return undefined
    }
    let cancelled = false
    Promise.all(leveragedRegNos.map(async (regNo) => {
      try {
        const response = await fetch(`/fipiran/fund/getfund?regno=${encodeURIComponent(regNo)}`)
        if (!response.ok) return [regNo, null]
        const data = await response.json()
        const item = data.item || data
        const base = Number(item?.baseUnitsTotalNetAssetValue)
        const superValue = Number(item?.superUnitsTotalNetAssetValue)
        return [regNo, base > 0 && superValue > 0 ? base / superValue : null]
      } catch {
        return [regNo, null]
      }
    })).then((entries) => {
      if (!cancelled) setLeveragedRatios(Object.fromEntries(entries.filter(([, value]) => Number.isFinite(value))))
    })
    return () => {
      cancelled = true
    }
  }, [includeLeveragedRatio, leveragedRegNos.join('|')])

  useEffect(() => {
    if (!supplementalFunds.length) {
      setSupplementalMetrics({})
      return undefined
    }
    let cancelled = false
    Promise.all(supplementalFunds.map(async (fund) => {
      try {
        return [fund.insCode, await fetchSupplementalMetric(fund, startISO, endISO)]
      } catch {
        return [fund.insCode, null]
      }
    })).then((entries) => {
      if (!cancelled) setSupplementalMetrics(Object.fromEntries(entries.filter(([, value]) => value)))
    })
    return () => {
      cancelled = true
    }
  }, [supplementalFunds, startISO, endISO])

  const allRows = useMemo(() => {
    const baseRows = funds.filter((f) => f.type === typeId && !f.isCharity)
    const seen = new Set(baseRows.flatMap((fund) => [fund.insCode, normalizeSymbol(fund.symbol)]).filter(Boolean))
    const supplemental = supplementalFunds
      .filter((fund) => !seen.has(fund.insCode) && !seen.has(normalizeSymbol(fund.symbol)))
      .map((fund) => buildSupplementalFund(fund, typeId, supplementalMetrics[fund.insCode]))
    return enrichFunds([...baseRows, ...supplemental], endDate || endISO)
      .map((fund) => ({
        ...fund,
        leveragedRatio: leveragedRatios[String(fund.regNo)] ?? null,
      }))
  }, [funds, typeId, endDate, endISO, supplementalFunds, supplementalMetrics, leveragedRatios])
  const etfRows = useMemo(() => allRows.filter((fund) => fund.isETF), [allRows])
  const issuanceRows = useMemo(() => allRows.filter((fund) => !fund.isETF), [allRows])
  const sourceRows = splitByTradingType
    ? (tab === 'etf' ? etfRows : issuanceRows)
    : allRows

  const columns = useMemo(
    () => {
      const excluded = new Set(excludeColumns)
      if (splitByTradingType && tab === 'issuance') {
        excluded.add('symbol')
        excluded.add('bubble')
      }
      const baseColumns = excluded.size ? otherFundsColumns.filter((c) => !excluded.has(c.key)) : otherFundsColumns
      if (!includeLeveragedRatio) return baseColumns
      const ratioColumn = {
        key: 'leveragedRatio',
        label: 'نسبت اهرمی کلاسیک',
        sortVal: (fund) => fund.leveragedRatio,
        exportValue: (fund) => fund.leveragedRatio,
        render: (fund) => Number.isFinite(fund.leveragedRatio) ? (
          <span className="text-sm font-dana tabular-nums text-neon-pink" style={{ fontWeight: 900 }}>
            {fund.leveragedRatio.toLocaleString('fa-IR', { maximumFractionDigits: 2 })}×
          </span>
        ) : (
          <span className="text-text-muted/40 text-xs">—</span>
        ),
      }
      const scoreIndex = baseColumns.findIndex((column) => column.key === 'score')
      return scoreIndex >= 0
        ? [...baseColumns.slice(0, scoreIndex), ratioColumn, ...baseColumns.slice(scoreIndex)]
        : [...baseColumns, ratioColumn]
    },
    [excludeColumns, splitByTradingType, tab, includeLeveragedRatio]
  )
  const marketRows = useMarketBubbles(sourceRows)
  const getTabCount = (id) => (id === 'etf' ? etfRows.length : issuanceRows.length)

  return (
    <FundsPageLayout
      badge={badge}
      accentColor={accentColor}
      title={title}
      highlight={highlight}
      titleTail={titleTail}
      subtitle={subtitle}
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
      floatAsset={floatAsset}
    >
      {splitByTradingType && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {[
            { id: 'etf', label: 'ETF', badge: 'قابل معامله در بازار' },
            { id: 'issuance', label: 'غیر ETF', badge: 'صدور/ابطالی یا غیرقابل معامله' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-start px-4 py-2 rounded-lg text-sm font-dana cursor-pointer transition-all duration-200 ${
                tab === item.id
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                  : 'bg-surface/60 text-text-muted border border-neon-cyan/10 hover:border-neon-cyan/30 hover:text-text-primary'
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
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundSummary rows={marketRows} loading={loading} />
        <FundsTable
          columns={columns}
          rows={marketRows}
          defaultSortKey="score"
          minWidth={900}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی یافت نشد."
          exportFileName={splitByTradingType ? `funds-${typeId}-${tab}` : `funds-${typeId}`}
        />
      </motion.div>

      {footnote && (
        <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
          {footnote}
        </p>
      )}
    </FundsPageLayout>
  )
}
