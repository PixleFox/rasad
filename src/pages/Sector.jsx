import FundCategoryPage from '../components/FundCategoryPage'

const supplementalSectorFunds = [
  { symbol: 'آلیاژ', name: 'صنایع آگاه ۳', insCode: '52497713622747990' },
  { symbol: 'اتوآگاه', name: 'صنایع آگاه ۲', insCode: '6328167131743522' },
  { symbol: 'اتوداریوش', name: 'بخشی داریوش ۲', insCode: '71779402170497603' },
  { symbol: 'اکتان', name: 'صنایع مفید ۴', insCode: '40374861063260484' },
  { symbol: 'امگا', name: 'بخشی صنایع سورنا ۳', insCode: '62945240926992257' },
  { symbol: 'بانکا', name: 'صنایع آگاه ۴', insCode: '37120336886630649' },
  { symbol: 'بنکر', name: 'صنایع اندیشه صبا ۲', insCode: '65736765815044639' },
  { symbol: 'بنکوداریوش', name: 'بخشی داریوش ۳', insCode: '8456220681927384' },
  { symbol: 'پولاد', name: 'بخشی صنایع آبان ۲', insCode: '71051000490303906' },
  { symbol: 'چاشنی', name: 'صنایع ویستا ۲', insCode: '11731629977819447' },
  { symbol: 'چتر', name: 'بخشی گستره فیروزه ۲', insCode: '118005828419984' },
  { symbol: 'خودران', name: 'صنایع مفید ۲', insCode: '67261627618765635' },
  { symbol: 'دارونو', name: 'صنایع مفید ۵', insCode: '34074071043606558' },
  { symbol: 'دلتا', name: 'صنایع تمدن ۱', insCode: '60410592153141114' },
  { symbol: 'سورنافود', name: 'بخشی صنایع سورنا ۲', insCode: '40126421241992147' },
  { symbol: 'سیمانا', name: 'صنایع دایا ۲', insCode: '46918165794045813' },
  { symbol: 'سیمانو', name: 'صنایع مفید ۳', insCode: '62069100905581368' },
  { symbol: 'طعام', name: 'بخشی بازده صنایع ۲', insCode: '31230051169165044' },
  { symbol: 'فلزا', name: 'بخشی صنایع پاداش ۲', insCode: '12840158707161274' },
  { symbol: 'مزه', name: 'صنایع دایا ۳', insCode: '20789606562681728' },
  { symbol: 'مسگون', name: 'بخشی گستره فیروزه ۴', insCode: '36255121262639515' },
  { symbol: 'معدن', name: 'صنایع مفید ۶', insCode: '59641261891847088' },
  { symbol: 'نفتوداریوش', name: 'بخشی داریوش ۴', insCode: '15437111449299444' },
  { symbol: 'نمک', name: 'بخشی گستره فیروزه ۳', insCode: '59345957997866018' },
  { symbol: 'نیروانا', name: 'قلک ۲ بخشی', insCode: '54362614710319812' },
]

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
    />
  )
}
