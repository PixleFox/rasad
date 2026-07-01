import FundCategoryPage from '../components/FundCategoryPage'

export default function Leveraged() {
  return (
    <FundCategoryPage
      typeId={22}
      badge="صندوق‌های اهرمی"
      accentColor="#FF3B6B"
      title="صندوق‌های"
      highlight="اهرمی"
      subtitle="پرریسک‌ترین دسته — بازدهی چندبرابری در هر دو جهت"
      floatAsset="/assets/Purple-planet.png"
      footnote="منبع: فیپیران · سطح ریسک از ترکیب دارایی (۰ تا ۱۰۰) · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ است."
    />
  )
}
