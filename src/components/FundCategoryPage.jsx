import { useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from './FundsPageLayout'
import FundsTable from './FundsTable'
import { otherFundsColumns } from './fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, fmtSize } from '../lib/fipiran'

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
  showTotalAUM = true,
}) {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()

  const rows = useMemo(
    () => enrichFunds(funds.filter((f) => f.type === typeId && !f.isCharity), endDate || endISO),
    [funds, typeId, endDate, endISO]
  )

  const columns = useMemo(
    () => excludeColumns.length ? otherFundsColumns.filter((c) => !excludeColumns.includes(c.key)) : otherFundsColumns,
    [excludeColumns]
  )

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
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="score"
          minWidth={900}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی یافت نشد."
          showTotalAUM={showTotalAUM}
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
