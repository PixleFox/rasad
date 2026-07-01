import FundCategoryPage from '../components/FundCategoryPage'

export default function Sector() {
  return (
    <FundCategoryPage
      typeId={21}
      badge="صندوق‌های بخشی"
      accentColor="#00FF9D"
      title="صندوق‌های"
      highlight="بخشی"
      subtitle="تمرکز بر یک صنعت خاص — فولاد، پتروشیمی، دارو و ..."
      floatAsset="/assets/Purple-planet.png"
      footnote="منبع: فیپیران · سطح ریسک از ترکیب دارایی (۰ تا ۱۰۰) · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ است."
    />
  )
}
