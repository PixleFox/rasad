import { useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { otherFundsColumns } from '../components/fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds } from '../lib/fipiran'
import FundSummary from '../components/FundSummary'
import { useMarketBubbles } from '../hooks/useMarketBubbles'

export default function Equity() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()

  const rows = useMemo(
    () => enrichFunds(funds.filter((f) => f.type === 6), endDate || endISO),
    [funds, endDate, endISO]
  )
  const marketRows = useMarketBubbles(rows)

  return (
    <FundsPageLayout
      badge="صندوق‌های سهامی"
      accentColor="#00D4FF"
      title="صندوق‌های"
      highlight="سهامی"
      titleTail="کلاسیک"
      subtitle="پربازده‌ترین و پرریسک‌ترین دسته — سرمایه‌گذاری در سهام"
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
      floatAsset="/assets/Purple-planet.png"
    >
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundSummary rows={marketRows} loading={loading} />
        <FundsTable
          columns={otherFundsColumns}
          rows={marketRows}
          defaultSortKey="score"
          minWidth={880}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی یافت نشد."
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران و TSETMC · حباب NAV = اختلاف درصدی آخرین قیمت معامله و NAV ابطال · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ است.
      </p>
    </FundsPageLayout>
  )
}
