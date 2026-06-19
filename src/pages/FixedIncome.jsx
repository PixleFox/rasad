import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { fixedIncomeColumns } from '../components/fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { splitFixedIncome, enrichFunds, faNum } from '../lib/fipiran'

const TABS = [
  { id: 'etfDividend',          label: 'ETF تقسیم سودی',    badge: 'قابل معامله · با پرداخت سود' },
  { id: 'etfAccumulating',      label: 'ETF جمع‌شونده',      badge: 'قابل معامله · بدون پرداخت سود' },
  { id: 'issuanceDividend',     label: 'صدور/ابطالی تقسیم سودی',    badge: 'غیرقابل معامله · با پرداخت سود' },
  { id: 'issuanceAccumulating', label: 'صدور/ابطالی جمع‌شونده',      badge: 'غیرقابل معامله · بدون پرداخت سود' },
]

export default function FixedIncome() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()
  const [tab, setTab] = useState('etfDividend')

  const groups = useMemo(() => {
    const split = splitFixedIncome(funds)
    return {
      etfDividend:          enrichFunds(split.etfDividend,          endDate || endISO),
      etfAccumulating:      enrichFunds(split.etfAccumulating,      endDate || endISO),
      issuanceDividend:     enrichFunds(split.issuanceDividend,     endDate || endISO),
      issuanceAccumulating: enrichFunds(split.issuanceAccumulating, endDate || endISO),
    }
  }, [funds, endDate, endISO])

  const rows = groups[tab]

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
      {/* Tabs sorted by count descending */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {[...TABS].sort((a, b) => (groups[b.id]?.length ?? 0) - (groups[a.id]?.length ?? 0)).map((t) => (
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
              {!loading && (
                <span className="text-xs opacity-70">({faNum(groups[t.id].length)})</span>
              )}
            </span>
            <span className="text-[0.65rem] opacity-50 mt-0.5" style={{ fontWeight: 400 }}>{t.badge}</span>
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <FundsTable
          columns={fixedIncomeColumns}
          rows={rows}
          defaultSortKey="score"
          minWidth={860}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران · ذخیره صندوق = (قیمت آماری − قیمت ابطال) × تعداد واحد · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ بر اساس بازدهی، اندازه، سابقه و ارزندگی است.
      </p>
    </FundsPageLayout>
  )
}
