import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FundsTable from '../components/FundsTable'
import {
  fetchRangeReturns, computeManagers, faNum, fmtPercent,
  todayISO, monthsBeforeISO, FUND_TYPES,
} from '../lib/fipiran'

// ── helpers ──────────────────────────────────────────────────────────────────
function rankWithinType(funds, typeId) {
  const typed = funds
    .filter((f) => f.type === typeId && Number.isFinite(f.rangeReturn) && Math.abs(f.rangeReturn) < 10000)
    .sort((a, b) => b.rangeReturn - a.rangeReturn)
  const map = new Map()
  typed.forEach((f, i) => map.set(f.regNo, { rank: i + 1, total: typed.length }))
  return map
}

// ── cells ─────────────────────────────────────────────────────────────────────
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

function RetCell({ value }) {
  if (!Number.isFinite(value)) return <span className="text-text-muted/40 text-xs">—</span>
  const color = value > 0 ? '#00FF9D' : value < 0 ? '#FF3B6B' : '#8A94A6'
  return <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>{faNum(value.toFixed(1))}٪</span>
}

function RankCell({ rank, total }) {
  if (rank == null) return <span className="text-text-muted/40 text-xs">—</span>
  const color = rank <= 3 ? '#FFD700' : rank <= Math.ceil(total * 0.2) ? '#00FF9D' : '#8A94A6'
  return (
    <span className="text-sm font-dana tabular-nums" style={{ fontWeight: 700, color }}>
      {faNum(rank)}{' '}
      <span className="text-xs text-text-muted">از {faNum(total)}</span>
    </span>
  )
}

// ── section title ─────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h2 className="text-right text-text-primary font-dana mb-3" style={{ fontWeight: 900, fontSize: 16 }}>
      {children}
    </h2>
  )
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = '#7C3AED' }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-white/10 bg-white/5">
      <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{label}</span>
      <span className="text-xl font-dana tabular-nums" style={{ fontWeight: 900, color }}>{value}</span>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const { managerId } = useParams()
  const navigate = useNavigate()
  const core = decodeURIComponent(managerId)

  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [mgrRow, setMgrRow] = useState(null)
  const [monthFunds, setMonthFunds]   = useState([])
  const [quarterFunds, setQuarterFunds] = useState([])

  useEffect(() => {
    const today = todayISO()
    const m1    = monthsBeforeISO(today, 1)
    const m3    = monthsBeforeISO(today, 3)
    setLoading(true)
    Promise.all([
      fetchRangeReturns(m1, today),
      fetchRangeReturns(m3, today),
    ])
      .then(([res1, res3]) => {
        const mgrs = computeManagers(res1.funds, res1.endDate)
        const found = mgrs.find((m) => m.core === core)
        if (!found) { setError('مدیر یافت نشد'); return }
        setMgrRow(found)
        setMonthFunds(res1.funds)
        setQuarterFunds(res3.funds)
      })
      .catch((e) => setError(e.message || 'خطا در دریافت داده'))
      .finally(() => setLoading(false))
  }, [core])

  // ── table 1: status ──────────────────────────────────────────────────────
  const statusCols = [
    {
      key: 'name', label: 'نام صندوق', align: 'start',
      render: (f) => (
        <div className="flex flex-col min-w-[180px]">
          <span className="text-text-primary text-sm font-dana" style={{ fontWeight: 800 }}>{f.name}</span>
          <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{FUND_TYPES[f.type] ?? 'سایر'}</span>
        </div>
      ),
    },
    {
      key: 'aum', label: 'دارایی خالص (میلیارد ریال)', sortVal: (f) => f.sizeRial,
      render: (f) => (
        <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
          {f.sizeRial > 0 ? faNum(Math.round(f.sizeRial / 1e9)) : '—'}
        </span>
      ),
    },
    {
      key: 'flow', label: 'خالص ورود و خروج پول (میلیارد ریال)',
      sortVal: (f) => (Number.isFinite(f.unitsStart) && f.navRet > 0 ? (f.units - f.unitsStart) * f.navRet / 1e9 : null),
      render: (f) => {
        const v = Number.isFinite(f.unitsStart) && f.navRet > 0
          ? Math.round((f.units - f.unitsStart) * f.navRet / 1e9) : null
        return <FlowCell value={v} />
      },
    },
  ]

  // ── table 2: rankings ────────────────────────────────────────────────────
  const { rankMonth, rankQuarter } = useMemo(() => {
    if (!mgrRow) return { rankMonth: new Map(), rankQuarter: new Map() }
    const types = [...new Set(mgrRow.funds.map((f) => f.type))]
    const rm = new Map(), rq = new Map()
    types.forEach((t) => {
      rankWithinType(monthFunds, t).forEach((v, k) => rm.set(k, v))
      rankWithinType(quarterFunds, t).forEach((v, k) => rq.set(k, v))
    })
    return { rankMonth: rm, rankQuarter: rq }
  }, [mgrRow, monthFunds, quarterFunds])

  const rankCols = [
    {
      key: 'name', label: 'نام صندوق', align: 'start',
      render: (f) => (
        <div className="flex flex-col min-w-[180px]">
          <span className="text-text-primary text-sm font-dana" style={{ fontWeight: 800 }}>{f.name}</span>
          <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{FUND_TYPES[f.type] ?? 'سایر'}</span>
        </div>
      ),
    },
    {
      key: 'rankM', label: 'رتبه ماهانه',
      sortVal: (f) => rankMonth.get(f.regNo)?.rank ?? 9999,
      render: (f) => { const d = rankMonth.get(f.regNo); return d ? <RankCell rank={d.rank} total={d.total} /> : <span className="text-text-muted/40 text-xs">—</span> },
    },
    {
      key: 'retM', label: 'بازده ماهانه (%)',
      sortVal: (f) => { const mf = monthFunds.find((x) => x.regNo === f.regNo); return mf?.rangeReturn ?? -Infinity },
      render: (f) => { const mf = monthFunds.find((x) => x.regNo === f.regNo); return <RetCell value={mf?.rangeReturn} /> },
    },
    {
      key: 'rankQ', label: 'رتبه سه‌ماهه',
      sortVal: (f) => rankQuarter.get(f.regNo)?.rank ?? 9999,
      render: (f) => { const d = rankQuarter.get(f.regNo); return d ? <RankCell rank={d.rank} total={d.total} /> : <span className="text-text-muted/40 text-xs">—</span> },
    },
    {
      key: 'retQ', label: 'بازده سه‌ماهه (%)',
      sortVal: (f) => { const qf = quarterFunds.find((x) => x.regNo === f.regNo); return qf?.rangeReturn ?? -Infinity },
      render: (f) => { const qf = quarterFunds.find((x) => x.regNo === f.regNo); return <RetCell value={qf?.rangeReturn} /> },
    },
  ]

  // ── summary ──────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    if (!mgrRow) return null
    const funds = mgrRow.funds
    const totalAumRial = funds.reduce((s, f) => s + (f.sizeRial || 0), 0)
    const totalFlowRial = funds.reduce((s, f) =>
      s + (Number.isFinite(f.unitsStart) && f.navRet > 0 ? (f.units - f.unitsStart) * f.navRet : 0), 0)
    const monthRets = funds.map((f) => monthFunds.find((x) => x.regNo === f.regNo)?.rangeReturn).filter(Number.isFinite)
    const avgMonthRet = monthRets.length ? monthRets.reduce((a, b) => a + b, 0) / monthRets.length : null
    return {
      fundCount: funds.length,
      aumBT: totalAumRial / 1e10,
      flowBT: totalFlowRial / 1e10,
      avgMonthRet,
    }
  }, [mgrRow, monthFunds])

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-text-muted font-dana text-lg animate-pulse" style={{ fontWeight: 700 }}>در حال بارگذاری...</span>
      </div>
    )
  }
  if (error || !mgrRow) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-red-400 font-dana text-lg">{error ?? 'مدیر یافت نشد'}</span>
        <button onClick={() => navigate('/managers')} className="text-neon-violet underline font-dana">بازگشت به لیست مدیران</button>
      </div>
    )
  }

  const fundRows = [...mgrRow.funds].sort((a, b) => (b.sizeRial ?? 0) - (a.sizeRial ?? 0))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10" dir="rtl">
      {/* back */}
      <button
        onClick={() => navigate('/managers')}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors font-dana text-sm"
        style={{ fontWeight: 700 }}
      >
        ← بازگشت به لیست مدیران
      </button>

      {/* header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="flex items-center gap-3 mb-1">
          <span className="px-3 py-1 rounded-full text-xs font-dana" style={{ background: 'rgba(124,58,237,0.15)', color: '#7C3AED', fontWeight: 800 }}>
            داشبورد مدیر
          </span>
        </div>
        <h1 className="text-3xl font-dana text-text-primary" style={{ fontWeight: 900 }}>
          {mgrRow.name}
        </h1>
        <p className="text-text-muted text-sm font-dana mt-1" style={{ fontWeight: 600 }}>
          وضعیت و عملکرد صندوق‌های تحت مدیریت
        </p>
      </motion.div>

      {/* summary cards */}
      {summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          className="flex flex-wrap gap-3">
          <StatCard label="تعداد صندوق‌ها" value={faNum(summary.fundCount)} />
          <StatCard label="مجموع دارایی (هزار میلیارد تومان)" value={faNum(summary.aumBT.toFixed(1))} color="#00D4FF" />
          <StatCard
            label="خالص جریان نقدی (میلیارد تومان)"
            value={(summary.flowBT >= 0 ? '▲ ' : '▼ ') + faNum(Math.abs(Math.round(summary.flowBT)))}
            color={summary.flowBT >= 0 ? '#00FF9D' : '#FF3B6B'}
          />
          {summary.avgMonthRet != null && (
            <StatCard
              label="میانگین بازده ماهانه"
              value={(summary.avgMonthRet >= 0 ? '+' : '') + faNum(summary.avgMonthRet.toFixed(1)) + '٪'}
              color={summary.avgMonthRet >= 0 ? '#00FF9D' : '#FF3B6B'}
            />
          )}
        </motion.div>
      )}

      {/* table 1 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <SectionTitle>وضعیت ابزارهای مدیریت دارایی {mgrRow.core}:</SectionTitle>
        <FundsTable
          columns={statusCols}
          rows={fundRows}
          defaultSortKey="aum"
          minWidth={540}
          loading={false}
          goodSortKeys={['aum']}
          rowKey={(f) => f.regNo}
          emptyText="صندوقی یافت نشد"
        />
        <p className="text-left text-text-muted text-xs font-dana mt-2" style={{ fontWeight: 600 }}>
          اعداد به میلیارد ریال می‌باشد.
        </p>

        {/* table 1 totals */}
        {summary && (
          <div className="flex flex-wrap gap-4 mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>جمع کل دارایی‌ها</span>
              <span className="text-text-primary text-base font-dana tabular-nums" style={{ fontWeight: 900 }}>
                {faNum(Math.round(summary.aumBT * 1000))} <span className="text-xs text-text-muted">میلیارد ریال</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>جمع خالص جریان نقدی</span>
              <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: summary.flowBT >= 0 ? '#00FF9D' : '#FF3B6B' }}>
                {summary.flowBT >= 0 ? '▲' : '▼'} {faNum(Math.abs(Math.round(summary.flowBT * 1000)))} <span className="text-xs text-text-muted">میلیارد ریال</span>
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* table 2 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <SectionTitle>رتبه بازدهی صندوق‌های {mgrRow.core} در میان صندوق‌های مشابه:</SectionTitle>
        <FundsTable
          columns={rankCols}
          rows={fundRows}
          defaultSortKey="rankM"
          defaultSortDir="asc"
          minWidth={640}
          loading={false}
          goodSortKeys={['retM', 'retQ']}
          rowKey={(f) => f.regNo}
          emptyText="داده رتبه‌بندی در دسترس نیست"
        />
        <p className="text-left text-text-muted text-xs font-dana mt-2" style={{ fontWeight: 600 }}>
          منبع بازدهی‌ها: فیپیران · رتبه در میان صندوق‌های هم‌نوع
        </p>

        {/* table 2 totals */}
        {summary?.avgMonthRet != null && (
          <div className="flex flex-wrap gap-4 mt-4 p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>میانگین بازده ماهانه صندوق‌ها</span>
              <span className="text-base font-dana tabular-nums" style={{ fontWeight: 900, color: summary.avgMonthRet >= 0 ? '#00FF9D' : '#FF3B6B' }}>
                {faNum(summary.avgMonthRet.toFixed(1))}٪
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>تعداد صندوق‌های دارای رتبه‌بندی</span>
              <span className="text-text-primary text-base font-dana tabular-nums" style={{ fontWeight: 900 }}>
                {faNum(fundRows.filter((f) => rankMonth.get(f.regNo)).length)}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
