import { useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, FUND_TYPES, faNum, fmtSize, fmtPercent } from '../lib/fipiran'
import FundSummary from '../components/FundSummary'

// انواعی که در منوهای اصلی نیستند
const OTHER_TYPE_IDS = [13, 16, 17, 18, 24, 25]

const columns = [
  {
    key: 'name',
    label: 'نام صندوق',
    align: 'start',
    render: (f) => (
      <div className="flex flex-col gap-0.5 min-w-[140px]">
        <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>{f.name}</span>
        <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>{f.manager}</span>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'نوع',
    render: (f) => (
      <span className="px-2 py-0.5 rounded text-xs font-dana text-text-muted"
        style={{ fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {FUND_TYPES[f.type] || 'سایر'}
      </span>
    ),
  },
  {
    key: 'size',
    label: 'دارایی (میلیارد تومان)',
    sortVal: (f) => f.sizeRial,
    render: (f) => <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>{fmtSize(f.sizeRial)}</span>,
  },
  {
    key: 'return',
    label: 'بازدهی بازه',
    sortVal: (f) => f.rangeReturn,
    render: (f) => {
      if (f.rangeReturn == null) return <span className="text-text-muted/40 text-xs">—</span>
      const color = f.rangeReturn >= 0 ? '#00FF9D' : '#FF3B6B'
      return <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 800, color }}>{fmtPercent(f.rangeReturn)}</span>
    },
  },
  {
    key: 'score',
    label: 'امتیاز رصد',
    sortVal: (f) => f.rasadScore,
    render: (f) => {
      const s = f.rasadScore ?? 0
      const color = s >= 70 ? '#00FF9D' : s >= 50 ? '#FBBF24' : '#FF3B6B'
      return <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color }}>{faNum(s)}</span>
    },
  },
]

export default function OtherFunds() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()

  const rows = useMemo(() => {
    const filtered = funds.filter((f) => OTHER_TYPE_IDS.includes(f.type))
    return enrichFunds(filtered, endDate || endISO)
  }, [funds, endDate, endISO])

  return (
    <FundsPageLayout
      badge="سایر صندوق‌ها"
      accentColor="#8A94A6"
      title="سایر"
      highlight="صندوق‌ها"
      subtitle="پروژه، خصوصی، نیکوکاری، املاک، تضمین اصل سرمایه و بازنشستگی"
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
    >
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundSummary rows={rows} loading={loading} />
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="size"
          minWidth={720}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
          rowKey={(f) => f.regNo}
        />
      </motion.div>
    </FundsPageLayout>
  )
}
