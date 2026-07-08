import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getBlogPost } from '../data/blogPosts'
import { riskSeoFaq, riskSeoKeywords, riskSeoPage } from '../data/riskSeo'

const DEFAULT = {
  title: 'رصد | تحلیل و مقایسه صندوق‌های سرمایه‌گذاری',
  description: 'تحلیل، رتبه‌بندی و مقایسه صندوق‌های سرمایه‌گذاری ایران با داده‌های به‌روز و شاخص اختصاصی رصد.',
}

const pages = {
  '/': DEFAULT,
  '/aggregate': { title: 'اطلاعات تجمیعی صندوق‌های سرمایه‌گذاری | رصد', description: 'نمای کلی دارایی، بازدهی و جریان پول انواع صندوق‌های سرمایه‌گذاری ایران.' },
  '/funds/fixed-income': { title: 'صندوق‌های درآمد ثابت؛ مقایسه نرخ و بازدهی | رصد', description: 'مقایسه صندوق‌های درآمد ثابت بر اساس بازدهی، دارایی تحت مدیریت، نرخ اعلامی و شاخص رصد.' },
  '/funds/equity': { title: 'مقایسه صندوق‌های سهامی ایران | رصد', description: 'رتبه‌بندی و مقایسه صندوق‌های سهامی بر اساس بازدهی، ریسک، حباب NAV و دارایی.' },
  '/funds/mixed': { title: 'مقایسه صندوق‌های مختلط | رصد', description: 'اطلاعات و رتبه‌بندی صندوق‌های سرمایه‌گذاری مختلط ایران.' },
  '/funds/commodity': { title: 'صندوق‌های کالایی و طلا | رصد', description: 'مقایسه صندوق‌های کالایی و طلا بر اساس بازدهی، حباب NAV، ریسک و شاخص رصد.' },
  '/funds/leveraged': { title: 'صندوق‌های اهرمی؛ بازدهی و حباب NAV | رصد', description: 'رتبه‌بندی صندوق‌های اهرمی ایران و مقایسه بازدهی، حباب NAV و دارایی تحت مدیریت.' },
  '/funds/index-fund': { title: 'صندوق‌های شاخصی ایران | رصد', description: 'مقایسه عملکرد و دارایی صندوق‌های سرمایه‌گذاری شاخصی.' },
  '/funds/sector': { title: 'صندوق‌های بخشی ایران | رصد', description: 'رتبه‌بندی صندوق‌های بخشی بازار سرمایه ایران بر اساس بازدهی و شاخص رصد.' },
  '/funds/market-maker': { title: 'صندوق‌های بازارگردانی | رصد', description: 'اطلاعات دارایی و عملکرد صندوق‌های اختصاصی بازارگردانی ایران.' },
  '/funds/venture': { title: 'صندوق‌های جسورانه ایران | رصد', description: 'فهرست و مقایسه صندوق‌های سرمایه‌گذاری جسورانه و خطرپذیر ایران.' },
  '/funds/other': { title: 'سایر صندوق‌های سرمایه‌گذاری | رصد', description: 'اطلاعات صندوق‌های نیکوکاری، املاک، پروژه و دیگر انواع صندوق‌های سرمایه‌گذاری.' },
  '/managers': { title: 'رتبه‌بندی مدیران صندوق‌های سرمایه‌گذاری | رصد', description: 'مقایسه شرکت‌های مدیریت دارایی بر اساس مجموع دارایی، تعداد صندوق و تغییر رتبه.' },
  '/ranking': { title: 'رتبه‌بندی صندوق‌های سرمایه‌گذاری | رصد', description: 'رتبه‌بندی صندوق‌های ایران بر اساس بازدهی و دارایی در بازه زمانی دلخواه.' },
  '/compare': { title: 'مقایسه صندوق‌های سرمایه‌گذاری | رصد', description: 'مقایسه مستقیم عملکرد، ریسک، دارایی و شاخص رصد صندوق‌های سرمایه‌گذاری.' },
  '/marketing': { title: 'تحلیل بازاریابی صندوق‌های سرمایه‌گذاری | رصد', description: 'تحلیل جریان پول، بازارگردانی و عملکرد بازاریابی صندوق‌های سرمایه‌گذاری.' },
  '/live-flow': { title: 'جریان زنده پول صندوق‌ها | رصد', description: 'رصد جریان ورود و خروج پول و معاملات صندوق‌های قابل معامله.' },
  '/recommendation': { title: riskSeoPage.title, description: riskSeoPage.description },
  '/risk-assessment': { title: riskSeoPage.title, description: riskSeoPage.description },
  '/risk-test': { title: riskSeoPage.title, description: riskSeoPage.description },
  '/risk-profile-test': { title: riskSeoPage.title, description: riskSeoPage.description },
  '/blog': { title: 'وبلاگ رصد | راهنمای صندوق‌های سرمایه‌گذاری', description: 'آموزش و راهنمای انتخاب، مقایسه و رتبه‌بندی صندوق‌های سرمایه‌گذاری ایران با داده‌های رصد.' },
  '/about': { title: 'درباره رصد | تحلیل صندوق‌های سرمایه‌گذاری', description: 'رصد، پلتفرم تحلیل داده و مقایسه صندوق‌های سرمایه‌گذاری ایران.' },
}

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) { element = document.createElement('meta'); document.head.appendChild(element) }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
}

function setJsonLd(id, data) {
  let element = document.head.querySelector(`script[data-rasad-jsonld="${id}"]`)
  if (!data) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.setAttribute('data-rasad-jsonld', id)
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(data)
}

export default function Seo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const managerPage = pathname.startsWith('/managers/')
    const blogMatch = pathname.match(/^\/blog\/([^/]+)$/)
    const blogPost = blogMatch ? getBlogPost(decodeURIComponent(blogMatch[1])) : null
    const riskPage = pathname === '/recommendation' || pathname === '/risk-assessment' || pathname === '/risk-test' || pathname === '/risk-profile-test'
    const page = blogPost
      ? { title: `${blogPost.title} | رصد`, description: blogPost.description }
      : managerPage
      ? { title: 'اطلاعات مدیر صندوق | رصد', description: 'داشبورد دارایی، عملکرد و صندوق‌های تحت مدیریت نهاد مالی.' }
      : pages[pathname] || DEFAULT
    const canonicalPath = riskPage ? riskSeoPage.canonicalPath : pathname === '/' ? '/' : pathname.replace(/\/$/, '')
    const canonicalUrl = `https://ra100.ir${canonicalPath}`
    const noindex = pathname.startsWith('/admin/') || pathname === '/triggers'
    document.title = page.title
    setMeta('meta[name="description"]', { name: 'description', content: page.description })
    setMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: page.title })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: page.description })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    setMeta('meta[property="og:type"]', { property: 'og:type', content: blogPost ? 'article' : 'website' })
    setMeta('meta[name="keywords"]', { name: 'keywords', content: blogPost ? blogPost.keywords.join('، ') : riskPage ? riskSeoKeywords.join('، ') : 'مقایسه صندوق سرمایه‌گذاری، صندوق درآمد ثابت، صندوق طلا، رتبه‌بندی صندوق‌ها، رصد' })
    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = canonicalUrl

    setJsonLd('article', blogPost ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blogPost.title,
      description: blogPost.description,
      datePublished: blogPost.publishedAt,
      dateModified: blogPost.updatedAt,
      inLanguage: 'fa-IR',
      mainEntityOfPage: canonicalUrl,
      author: { '@type': 'Organization', name: 'رصد' },
      publisher: { '@type': 'Organization', name: 'رصد', url: 'https://ra100.ir' },
    } : null)
    setJsonLd('faq', blogPost || riskPage ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: (blogPost ? blogPost.faq : riskSeoFaq).map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    } : null)
    setJsonLd('webapp', riskPage ? {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'تست ریسک پذیری رصد',
      url: 'https://ra100.ir/risk-assessment',
      applicationCategory: 'FinanceApplication',
      inLanguage: 'fa-IR',
      description: riskSeoPage.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'IRR' },
    } : null)
    setJsonLd('organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'رصد',
      url: 'https://ra100.ir',
      description: 'رصد یک ابزار مقایسه صندوق‌های سرمایه‌گذاری در ایران است که داده‌های صندوق‌ها را برای تحلیل، رتبه‌بندی و تصمیم‌گیری شفاف‌تر نمایش می‌دهد.',
    })
  }, [pathname])
  return null
}
