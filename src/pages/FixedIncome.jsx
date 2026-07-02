import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import FundsPageLayout from '../components/FundsPageLayout'
import FundsTable, { SiteLink } from '../components/FundsTable'
import { fixedIncomeColumns } from '../components/fundColumns'
import { useRangeFunds } from '../hooks/useRangeFunds'
import { splitFixedIncome, enrichFunds, faNum, fmtPercent } from '../lib/fipiran'
import { fixedIncomeDeclaredRates } from '../data/fixedIncomeDeclaredRates'

const TABS = [
  { id: 'etfDividend',          label: 'ETF تقسیم سودی',    badge: 'قابل معامله · با پرداخت سود' },
  { id: 'etfAccumulating',      label: 'ETF جمع‌شونده',      badge: 'قابل معامله · بدون پرداخت سود' },
  { id: 'issuanceDividend',     label: 'صدور/ابطالی تقسیم سودی',    badge: 'غیرقابل معامله · با پرداخت سود' },
  { id: 'issuanceAccumulating', label: 'صدور/ابطالی جمع‌شونده',      badge: 'غیرقابل معامله · بدون پرداخت سود' },
  { id: 'declaredRates',        label: 'نرخ اعلامی صندوق‌های درآمد ثابت', badge: 'داده دستی · نرخ اعلامی' },
]

const toBillionToman = (rial) => (Number.isFinite(rial) ? rial / 1e10 : null)
const rateText = (value) => (Number.isFinite(value) ? fmtPercent(value) : '—')
const amountText = (rial) => {
  const value = toBillionToman(rial)
  return Number.isFinite(value) ? faNum(Math.round(value)) : '—'
}

const declaredRateColumns = [
  {
    key: 'name',
    label: 'نام صندوق',
    align: 'start',
    render: (f) => (
      <div className="flex flex-col gap-0.5 min-w-[170px]">
        <span className="text-text-primary text-sm font-dana truncate" style={{ fontWeight: 900 }}>{f.name}</span>
        <span className="text-text-muted text-xs font-dana truncate" style={{ fontWeight: 600 }}>
          {f.symbol || f.investmentMethod || '—'}
        </span>
      </div>
    ),
    exportValue: (f) => f.name,
  },
  {
    key: 'declaredRate',
    label: 'درصد نرخ اعلامی',
    sortVal: (f) => f.declaredRate,
    render: (f) => (
      <span className="text-sm font-dana tabular-nums text-neon-green" style={{ fontWeight: 900 }}>
        {rateText(f.declaredRate)}
      </span>
    ),
    exportValue: (f) => f.declaredRate,
  },
  {
    key: 'netAsset',
    label: 'سرمایه تحت مدیریت (میلیارد تومان)',
    sortVal: (f) => f.netAssetRial,
    render: (f) => (
      <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
        {amountText(f.netAssetRial)}
      </span>
    ),
    exportValue: (f) => Math.round(toBillionToman(f.netAssetRial) || 0),
  },
  {
    key: 'oneYearReturn',
    label: 'بازده یک ساله',
    sortVal: (f) => f.oneYearReturn,
    render: (f) => (
      <span className="text-text-primary text-sm font-dana tabular-nums" style={{ fontWeight: 700 }}>
        {rateText(f.oneYearReturn)}
      </span>
    ),
    exportValue: (f) => f.oneYearReturn,
  },
  {
    key: 'updatedAt',
    label: 'تاریخ به‌روزرسانی',
    render: (f) => (
      <span className="text-text-muted text-xs font-dana tabular-nums" style={{ fontWeight: 600 }}>
        {f.updatedAt || '—'}
      </span>
    ),
    exportValue: (f) => f.updatedAt,
  },
  {
    key: 'site',
    label: 'سایت',
    render: (f) => <SiteLink url={f.website} />,
    exportValue: (f) => f.website,
  },
  {
    key: 'contactStatus',
    label: 'وضعیت تماس',
    render: (f) => (
      <span className={`text-xs font-dana ${f.contactStatus ? 'text-amber-300' : 'text-text-muted/40'}`} style={{ fontWeight: 600 }}>
        {f.contactStatus || '—'}
      </span>
    ),
    exportValue: (f) => f.contactStatus,
  },
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

  const isDeclaredRatesTab = tab === 'declaredRates'
  const rows = isDeclaredRatesTab ? fixedIncomeDeclaredRates : groups[tab]
  const getTabCount = (id) => (id === 'declaredRates' ? fixedIncomeDeclaredRates.length : groups[id]?.length ?? 0)

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {[...TABS].sort((a, b) => getTabCount(b.id) - getTabCount(a.id)).map((t) => (
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
              {(!loading || t.id === 'declaredRates') && (
                <span className="text-xs opacity-70">({faNum(getTabCount(t.id))})</span>
              )}
            </span>
            <span className="text-[0.65rem] opacity-50 mt-0.5" style={{ fontWeight: 400 }}>{t.badge}</span>
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <FundsTable
          columns={isDeclaredRatesTab ? declaredRateColumns : fixedIncomeColumns}
          rows={rows}
          defaultSortKey={isDeclaredRatesTab ? 'declaredRate' : 'score'}
          minWidth={isDeclaredRatesTab ? 980 : 860}
          loading={isDeclaredRatesTab ? false : loading}
          error={isDeclaredRatesTab ? null : error}
          onRetry={() => setStartISO((d) => d)}
          emptyText="صندوقی در این دسته یافت نشد."
          goodSortKeys={isDeclaredRatesTab ? ['declaredRate', 'netAsset', 'oneYearReturn'] : undefined}
          rowKey={(row) => row.id ?? row.regNo}
          exportFileName={isDeclaredRatesTab ? 'fixed-income-declared-rates' : 'fixed-income-funds'}
        />
      </motion.div>

      <p className="text-center text-text-muted text-xs font-dana mt-5 leading-relaxed" style={{ fontWeight: 600 }}>
        {isDeclaredRatesTab
          ? 'منبع: فایل دستی نرخ اعلامی صندوق‌ها · سرمایه تحت مدیریت به میلیارد تومان نمایش داده می‌شود.'
          : 'منبع: فیپیران · ذخیره صندوق = (قیمت آماری − قیمت ابطال) × تعداد واحد · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ بر اساس بازدهی، اندازه، سابقه و ارزندگی است.'}
      </p>
    </FundsPageLayout>
  )
}
