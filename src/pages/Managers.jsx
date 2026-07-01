import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { computeManagers, faNum } from '../lib/fipiran'

function FlowCell({ value }) {
  if (!Number.isFinite(value)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = value > 0 ? '#00FF9D' : value < 0 ? '#FF3B6B' : '#8A94A6'
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : ''
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>
      {arrow} {faNum(Math.abs(Math.round(value)))}
    </span>
  )
}

function FlowPctCell({ value }) {
  if (!Number.isFinite(value)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = value > 0 ? '#00FF9D' : value < 0 ? '#FF3B6B' : '#8A94A6'
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : ''
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>
      {arrow} {faNum(Math.abs(value).toFixed(1))}٪
    </span>
  )
}

export default function Managers() {
  const navigate = useNavigate()
  const { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO } = useRangeFunds()

  const rows = useMemo(
    () => computeManagers(funds, endDate || endISO),
    [funds, endDate, endISO]
  )

  const columns = [
    {
      key: 'name',
      label: 'نام مدیر',
      align: 'start',
      render: (row) => (
        <button
          onClick={() => navigate(`/managers/${encodeURIComponent(row.core)}`)}
          className="flex items-center gap-2 hover:opacity-75 transition-opacity text-right"
        >
          <span className="text-neon-violet text-sm" style={{ fontWeight: 700 }}>↗</span>
          <span className="text-text-primary text-sm font-dana underline underline-offset-2 decoration-neon-violet/40" style={{ fontWeight: 900 }}>
            {row.name}
          </span>
        </button>
      ),
    },
    {
      key: 'aum',
      label: 'دارایی تحت مدیریت (هزار میلیارد تومان)',
      sortVal: (row) => row.aumTBT,
      render: (row) => (
        <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
          {Number.isFinite(row.aumTBT) ? faNum(row.aumTBT.toFixed(1)) : '—'}
        </span>
      ),
    },
    {
      key: 'count',
      label: 'تعداد صندوق',
      sortVal: (row) => row.fundCount,
      render: (row) => (
        <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
          {faNum(row.fundCount)}
        </span>
      ),
    },
    {
      key: 'years',
      label: 'سابقه (سال)',
      sortVal: (row) => row.years,
      render: (row) =>
        row.years != null ? (
          <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 600 }}>
            {faNum(row.years.toFixed(1))}
          </span>
        ) : <span className="text-text-muted/40 text-xs">—</span>,
    },
    {
      key: 'flow',
      label: 'تغییرات دارایی (میلیارد تومان)',
      sortVal: (row) => row.flowBT,
      render: (row) => <FlowCell value={row.flowBT} />,
    },
    {
      key: 'flowPct',
      label: 'درصد تغییرات',
      sortVal: (row) => row.flowPct,
      render: (row) => <FlowPctCell value={row.flowPct} />,
    },
  ]

  return (
    <FundsPageLayout
      badge="مدیران صندوق‌ها"
      accentColor="#7C3AED"
      title="مدیران"
      highlight="صندوق‌ها"
      subtitle="رتبه‌بندی شرکت‌های مدیریت دارایی — برای مشاهده داشبورد هر مدیر روی نامش کلیک کنید"
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
        {!loading && rows.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { label: 'شرکت‌های مدیریت دارایی', value: faNum(rows.length) },
              { label: 'مجموع دارایی (هزار میلیارد تومان)', value: faNum(rows.reduce((s, r) => s + r.aumTBT, 0).toFixed(1)) },
              { label: 'مجموع صندوق‌ها', value: faNum(rows.reduce((s, r) => s + r.fundCount, 0)) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-neon-violet/20 bg-neon-violet/5"
              >
                <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{stat.label}</span>
                <span className="text-neon-violet text-xl font-dana tabular-nums" style={{ fontWeight: 900 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}

        <FundsTable
          columns={columns}
          rows={rows}
          defaultSortKey="aum"
          minWidth={860}
          loading={loading}
          error={error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="داده‌ای یافت نشد."
          goodSortKeys={['aum', 'count', 'years', 'flow', 'flowPct']}
          rowKey={(row) => row.id}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران · برندهای یکسان با انواع مختلف نهاد در یک گروه ادغام شده‌اند · سابقه از تاریخ تأسیس اولین صندوق
      </p>
    </FundsPageLayout>
  )
}
