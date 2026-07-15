import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable from '../components/FundsTable'
import { useRankingData } from '../hooks/useRankingData'
import { computeManagers, faNum, monthsBeforeISO, todayISO } from '../lib/fipiran'

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

function RankChangeCell({ value }) {
  if (value == null) return <span className="text-text-muted/40 text-xs">—</span>
  if (value === 0) return <span className="text-text-muted/50 text-sm" style={{ fontWeight: 700 }}>═</span>
  const up = value > 0
  return <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 900, color: up ? '#00FF9D' : '#FF3B6B' }}>{up ? '▲' : '▼'} {faNum(Math.abs(value))}</span>
}

export default function Managers() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialEnd = searchParams.get('end') || todayISO()
  const initialStart = searchParams.get('start') || monthsBeforeISO(initialEnd, 1)
  const {
    currentFunds,
    priorFunds,
    startDate,
    endDate,
    loading,
    error,
    startISO,
    endISO,
    setStartISO: setRankingStartISO,
    setEndISO: setRankingEndISO,
  } = useRankingData({ startISO: initialStart, endISO: initialEnd })

  const setStartISO = (value) => {
    setRankingStartISO(value)
    setSearchParams({ start: value, end: endISO }, { replace: true })
  }

  const setEndISO = (value) => {
    setRankingEndISO(value)
    setSearchParams({ start: startISO, end: value }, { replace: true })
  }

  const rows = useMemo(() => {
    const current = computeManagers(currentFunds, endDate || endISO)
    const prior = computeManagers(priorFunds, startDate || startISO)
    const priorRanks = new Map(prior.map((manager, index) => [manager.id, index + 1]))
    return current.map((manager, index) => {
      const rank = index + 1
      const priorRank = priorRanks.get(manager.id) ?? null
      return { ...manager, rank, priorRank, rankChange: priorRank == null ? null : priorRank - rank }
    })
  }, [currentFunds, priorFunds, startDate, endDate, startISO, endISO])

  const columns = [
    {
      key: 'name',
      label: 'نام مدیر',
      align: 'start',
      render: (row) => (
        <button
          onClick={() => navigate(`/managers/${encodeURIComponent(row.core)}?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`)}
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
      key: 'rankChange',
      label: 'تغییر رتبه',
      sortVal: (row) => row.rankChange,
      render: (row) => <RankChangeCell value={row.rankChange} />,
      exportValue: (row) => row.rankChange,
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
          goodSortKeys={['aum', 'rankChange', 'count', 'years', 'flow', 'flowPct']}
          rowKey={(row) => row.id}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        منبع: فیپیران · برندهای یکسان با انواع مختلف نهاد در یک گروه ادغام شده‌اند · سابقه از تاریخ تأسیس اولین صندوق
      </p>
    </FundsPageLayout>
  )
}
