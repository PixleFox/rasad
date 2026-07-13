import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from './FundsPageLayout'
import FundsTable from './FundsTable'
import { otherFundsColumns } from './fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, faNum } from '../lib/fipiran'
import FundSummary from './FundSummary'
import { useMarketBubbles } from '../hooks/useMarketBubbles'

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
}) {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [tab, setTab] = useState('etf')

  const allRows = useMemo(
    () => enrichFunds(funds.filter((f) => f.type === typeId && !f.isCharity), endDate || endISO),
    [funds, typeId, endDate, endISO]
  )
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
      return excluded.size ? otherFundsColumns.filter((c) => !excluded.has(c.key)) : otherFundsColumns
    },
    [excludeColumns, splitByTradingType, tab]
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
