import FundCategoryPage from '../components/FundCategoryPage'

export default function Index() {
  return (
    <FundCategoryPage
      typeId={23}
      badge="صندوق‌های شاخصی"
      accentColor="#00D4FF"
      title="صندوق‌های"
      highlight="شاخصی"
      subtitle="دنباله‌رو شاخص بورس — تنوع‌سازی با هزینه‌ی پایین"
      floatAsset="/assets/satelite.png"
      footnote="منبع: فیپیران · سطح ریسک از ترکیب دارایی (۰ تا ۱۰۰) · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ است."
    />
  )
}
