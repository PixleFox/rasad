import { useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { enrichFunds, faNum, fmtSize, fmtPercent } from '../lib/fipiran'

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
    key: 'symbol',
    label: 'نماد',
    render: (f) => f.symbol
      ? <span className="px-2 py-0.5 rounded text-xs font-dana text-neon-cyan" style={{ fontWeight: 600, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>{f.symbol}</span>
      : <span className="text-text-muted/40 text-xs">—</span>,
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

export default function MarketMakerFunds() {
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()

  const rows = useMemo(() => {
    const filtered = funds.filter((f) => f.type === 11)
    return enrichFunds(filtered, endDate || endISO)
  }, [funds, endDate, endISO])

  return (
    <FundsPageLayout
      badge="صندوق‌های بازارگردانی"
      accentColor="#FB7185"
      title="صندوق‌های"
      highlight="بازارگردانی"
      subtitle="صندوق‌هایی که نقدشوندگی بازار را تامین می‌کنند"
      loading={loading}
      startDate={startDate}
      endDate={endDate}
      startISO={startISO}
      endISO={endISO}
      setStartISO={setStartISO}
      setEndISO={setEndISO}
    >
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="size"
          minWidth={700}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوق بازارگردانی یافت نشد."
          rowKey={(f) => f.regNo}
        />
      </motion.div>
    </FundsPageLayout>
  )
}
