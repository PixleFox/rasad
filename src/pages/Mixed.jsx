import FundCategoryPage from '../components/FundCategoryPage'

export default function Mixed() {
  return (
    <FundCategoryPage
      typeId={7}
      badge="صندوق‌های مختلط"
      accentColor="#7C3AED"
      title="صندوق‌های"
      highlight="مختلط"
      subtitle="ترکیبی از سهام و اوراق — ریسک و بازدهی متوسط"
      floatAsset="/assets/Purple-planet.png"
      footnote="منبع: فیپیران · سطح ریسک از ترکیب دارایی (۰ تا ۱۰۰) · شاخص رصد امتیاز اختصاصی ۱۰ تا ۱۰۰ است."
    />
  )
}
