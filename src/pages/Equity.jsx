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
  { id: 'etf', label: 'ETF', badge: 'قابل معامله در بازار' },
  { id: 'issuance', label: 'صدور/ابطالی', badge: 'بدون معامله روزانه در تابلو' },
]

const equityEtfColumns = otherFundsColumns
const equityIssuanceColumns = otherFundsColumns.filter((column) => !['symbol', 'bubble'].includes(column.key))

export default function Equity() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [tab, setTab] = useState('etf')

  const allRows = useMemo(
    () => enrichFunds(funds.filter((f) => f.type === 6), endDate || endISO),
    [funds, endDate, endISO]
  )
  const etfRows = useMemo(() => allRows.filter((fund) => fund.isETF), [allRows])
  const issuanceRows = useMemo(() => allRows.filter((fund) => !fund.isETF), [allRows])
  const marketEtfRows = useMarketBubbles(etfRows)
  const rows = tab === 'etf' ? marketEtfRows : issuanceRows
  const columns = tab === 'etf' ? equityEtfColumns : equityIssuanceColumns
  const getTabCount = (id) => (id === 'etf' ? etfRows.length : issuanceRows.length)

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

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundSummary rows={rows} loading={loading} />
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="score"
          minWidth={tab === 'etf' ? 880 : 760}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی یافت نشد."
          exportFileName={`equity-funds-${tab}`}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران و TSETMC · حباب NAV = اختلاف درصدی آخرین قیمت معامله و NAV ابطال · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ است.
      </p>
    </FundsPageLayout>
  )
}
