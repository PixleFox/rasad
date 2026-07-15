import FundCategoryPage from '../components/FundCategoryPage'

const supplementalSectorFunds = [
  { symbol: 'آلیاژ', name: 'صنایع آگاه ۳', manager: 'آگاه', insCode: '52497713622747990' },
  { symbol: 'اتوآگاه', name: 'صنایع آگاه ۲', manager: 'آگاه', insCode: '6328167131743522' },
  { symbol: 'اتوداریوش', name: 'بخشی داریوش ۲', manager: 'داریوش', insCode: '71779402170497603' },
  { symbol: 'اکتان', name: 'صنایع مفید ۴', manager: 'مفید', insCode: '40374861063260484' },
  { symbol: 'امگا', name: 'بخشی صنایع سورنا ۳', manager: 'سورنا', insCode: '62945240926992257' },
  { symbol: 'بانکا', name: 'صنایع آگاه ۴', manager: 'آگاه', insCode: '37120336886630649' },
  { symbol: 'بنکر', name: 'صنایع اندیشه صبا ۲', manager: 'اندیشه صبا', insCode: '65736765815044639' },
  { symbol: 'بنکوداریوش', name: 'بخشی داریوش ۳', manager: 'داریوش', insCode: '8456220681927384' },
  { symbol: 'پولاد', name: 'بخشی صنایع آبان ۲', manager: 'آبان', insCode: '71051000490303906' },
  { symbol: 'چاشنی', name: 'صنایع ویستا ۲', manager: 'ویستا', insCode: '11731629977819447' },
  { symbol: 'چتر', name: 'بخشی گستره فیروزه ۲', manager: 'گستره فیروزه', insCode: '118005828419984' },
  { symbol: 'خودران', name: 'صنایع مفید ۲', manager: 'مفید', insCode: '67261627618765635' },
  { symbol: 'دارونو', name: 'صنایع مفید ۵', manager: 'مفید', insCode: '34074071043606558' },
  { symbol: 'دلتا', name: 'صنایع تمدن ۱', manager: 'تمدن', insCode: '60410592153141114' },
  { symbol: 'سورنافود', name: 'بخشی صنایع سورنا ۲', manager: 'سورنا', insCode: '40126421241992147' },
  { symbol: 'سیمانا', name: 'صنایع دایا ۲', manager: 'دایا', insCode: '46918165794045813' },
  { symbol: 'سیمانو', name: 'صنایع مفید ۳', manager: 'مفید', insCode: '62069100905581368' },
  { symbol: 'طعام', name: 'بخشی بازده صنایع ۲', manager: 'بازده', insCode: '31230051169165044' },
  { symbol: 'فلزا', name: 'بخشی صنایع پاداش ۲', manager: 'پاداش', insCode: '12840158707161274' },
  { symbol: 'مزه', name: 'صنایع دایا ۳', manager: 'دایا', insCode: '20789606562681728' },
  { symbol: 'مسگون', name: 'بخشی گستره فیروزه ۴', manager: 'گستره فیروزه', insCode: '36255121262639515' },
  { symbol: 'معدن', name: 'صنایع مفید ۶', manager: 'مفید', insCode: '59641261891847088' },
  { symbol: 'نفتوداریوش', name: 'بخشی داریوش ۴', manager: 'داریوش', insCode: '15437111449299444' },
  { symbol: 'نمک', name: 'بخشی گستره فیروزه ۳', manager: 'گستره فیروزه', insCode: '59345957997866018' },
  { symbol: 'نیروانا', name: 'قلک ۲ بخشی', manager: 'قلک', insCode: '54362614710319812' },
]

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
      supplementalFunds={supplementalSectorFunds}
      groupTabs={sectorTabs}
      getRowGroup={getSectorGroup}
      patchRow={patchSectorRow}
    />
  )
}
