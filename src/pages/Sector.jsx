import FundCategoryPage from '../components/FundCategoryPage'

const sectorTabs = [
  { id: 'all', label: 'همه' },
  { id: 'financial', label: 'بانک و بیمه' },
  { id: 'petrochemical', label: 'شیمیایی و پترو' },
  { id: 'metals', label: 'فلزات' },
  { id: 'mining', label: 'معدنی' },
  { id: 'auto', label: 'خودرو' },
  { id: 'food', label: 'غذایی' },
  { id: 'cement', label: 'سیمان' },
  { id: 'pharma', label: 'دارویی' },
  { id: 'energy', label: 'انرژی' },
  { id: 'transport', label: 'حمل و نقل' },
  { id: 'unknown', label: 'نامشخص' },
]

const normalize = (value) => String(value || '')
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/\s+/g, ' ')
  .trim()

const sectorBySymbol = {
  'آلکان': 'petrochemical',
  'آذرین': 'metals',
  'آلیاژ': 'metals',
  'استیل': 'metals',
  'اتوآگاه': 'auto',
  'اتوداریوش': 'auto',
  'اکتان': 'petrochemical',
  'امگا': 'energy',
  'بانکا': 'financial',
  'بانکدار': 'financial',
  'بانکو': 'financial',
  'بانکیا': 'financial',
  'بازبیمه': 'financial',
  'بنکر': 'financial',
  'بنکوداریوش': 'financial',
  'بهین رو': 'auto',
  'پالایش': 'petrochemical',
  'پتروآبان': 'petrochemical',
  'پتروآگاه': 'petrochemical',
  'پتروپاداش': 'petrochemical',
  'پتروداریوش': 'petrochemical',
  'پتروسورین': 'petrochemical',
  'پتروصبا': 'petrochemical',
  'پتروفارس': 'petrochemical',
  'پتروما': 'petrochemical',
  'پناه': 'financial',
  'پولاد': 'metals',
  'تخت گاز': 'auto',
  'چاشنی': 'food',
  'چتر': 'financial',
  'خودران': 'auto',
  'دارا یکم': 'financial',
  'دارونو': 'pharma',
  'دلتا': 'financial',
  'رسانا': 'mining',
  'رویین': 'metals',
  'سمان': 'cement',
  'سورنافود': 'food',
  'سیمانا': 'cement',
  'سیمانو': 'cement',
  'سیمانیا': 'cement',
  'طعام': 'food',
  'فارما کیان': 'pharma',
  'فارمانی': 'pharma',
  'فرا الگوریتم': 'food',
  'فلزا': 'metals',
  'فلزفارابی': 'metals',
  'لذیذ': 'food',
  'متال': 'metals',
  'مسگون': 'metals',
  'مزه': 'food',
  'معدن': 'mining',
  'ناوگان': 'transport',
  'نبات': 'food',
  'نفتوداریوش': 'petrochemical',
  'نمک': 'food',
  'نیروانا': 'energy',
  'ولتاژ': 'energy',
}

const getSectorGroup = (fund) => {
  const symbol = normalize(fund.symbol)
  const name = normalize(fund.name)
  if (sectorBySymbol[symbol]) return sectorBySymbol[symbol]
  if (name.includes('صنایع تمدن')) return 'financial'
  return 'unknown'
}

const patchSectorRow = (fund) => {
  const name = normalize(fund.name)
  if (!fund.symbol && name.includes('صنایع تمدن')) {
    return { ...fund, symbol: 'دلتا' }
  }
  return fund
}

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
      groupTabs={sectorTabs}
      getRowGroup={getSectorGroup}
      patchRow={patchSectorRow}
    />
  )
}
