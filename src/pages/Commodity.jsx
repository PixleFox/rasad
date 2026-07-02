import FundCategoryPage from '../components/FundCategoryPage'

export default function Commodity() {
  return (
    <FundCategoryPage
      typeId={5}
      badge="صندوق‌های کالایی"
      accentColor="#FBBF24"
      title="صندوق‌های"
      highlight="کالایی"
      subtitle="سرمایه‌گذاری در طلا، فلزات و کالاهای اساسی"
      floatAsset="/assets/satelite.png"
      footnote="منبع: فیپیران و TSETMC · حباب NAV از اختلاف آخرین قیمت معامله و NAV ابطال محاسبه می‌شود."
      excludeColumns={['risk']}
    />
  )
}
