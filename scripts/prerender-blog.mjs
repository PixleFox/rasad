import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { blogPosts } from '../src/data/blogPosts.js'
import { riskSeoFaq, riskSeoKeywords, riskSeoPage, riskSeoSections } from '../src/data/riskSeo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const indexPath = path.join(dist, 'index.html')
const baseHtml = fs.readFileSync(indexPath, 'utf8')
const siteUrl = 'https://ra100.ir'
const brandTitle = 'رصد | سایت رصد برای تحلیل و مقایسه صندوق‌های سرمایه‌گذاری'
const brandDescription = 'سایت رصد ابزار فارسی تحلیل، رتبه‌بندی و مقایسه صندوق‌های سرمایه‌گذاری ایران با داده‌های به‌روز و شاخص اختصاصی رصد است.'

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function writePage(route, { title, description, canonical, type = 'website', keywords = [], jsonLd = [], body }) {
  const outputPath = path.join(dist, ...route.split('/').filter(Boolean), 'index.html')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    keywords.length ? `<meta name="keywords" content="${escapeHtml(keywords.join('، '))}" />` : '',
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    ...jsonLd.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`),
  ].filter(Boolean).join('\n    ')

  const cleanHtml = baseHtml
    .replace(/<meta name="description" content="[\s\S]*?" \/>/, '')
    .replace(/<meta property="og:type" content="[\s\S]*?" \/>/, '')
    .replace(/<link rel="canonical" href="[\s\S]*?" \/>/, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')

  const html = cleanHtml
    .replace(/<title>[\s\S]*?<\/title>/, metadata)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)

  fs.writeFileSync(outputPath, html)
}

function articleJsonLd(post, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: 'fa-IR',
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'رصد' },
    publisher: { '@type': 'Organization', name: 'رصد', url: siteUrl },
  }
}

function faqJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

function faqListJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'رصد',
    alternateName: ['سایت رصد', 'Rasad', 'ra100'],
    url: siteUrl,
    logo: `${siteUrl}/favicon.png`,
    description: 'رصد یا سایت رصد یک پلتفرم فارسی برای تحلیل، رتبه‌بندی و مقایسه صندوق‌های سرمایه‌گذاری ایران است.',
  }
}

function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'رصد',
    alternateName: ['سایت رصد', 'Rasad'],
    url: siteUrl,
    inLanguage: 'fa-IR',
    publisher: { '@id': `${siteUrl}/#organization` },
  }
}

function homeBody() {
  return `
    <main dir="rtl">
      <h1>سایت رصد؛ ابزار تحلیل و مقایسه صندوق‌های سرمایه‌گذاری ایران</h1>
      <p>رصد یک سایت فارسی برای تحلیل، رتبه‌بندی و مقایسه صندوق‌های سرمایه‌گذاری ایران است. سایت رصد داده‌های صندوق‌ها را از نظر بازدهی، دارایی تحت مدیریت، ریسک، جریان پول و شاخص‌های تحلیلی کنار هم قرار می‌دهد تا تصمیم‌گیری شفاف‌تر شود.</p>
      <section>
        <h2>رصد چه کمکی می‌کند؟</h2>
        <ul>
          <li>مقایسه صندوق‌های درآمد ثابت، سهامی، مختلط، طلا، اهرمی، شاخصی، بخشی، جسورانه و بازارگردانی</li>
          <li>رتبه‌بندی صندوق‌ها بر اساس داده‌های قابل مقایسه</li>
          <li>نمایش اطلاعات تجمیعی بازار صندوق‌های سرمایه‌گذاری</li>
          <li>بررسی مدیران صندوق‌ها و ابزارهای تحلیلی مرتبط با بازاریابی صندوق‌ها</li>
          <li>تست ریسک پذیری و پیشنهاد صندوق متناسب با تیپ سرمایه‌گذار</li>
        </ul>
      </section>
      <section>
        <h2>صفحه‌های مهم سایت رصد</h2>
        <ul>
          <li><a href="/compare">مقایسه صندوق‌های سرمایه‌گذاری</a></li>
          <li><a href="/ranking">رتبه‌بندی صندوق‌ها</a></li>
          <li><a href="/funds/fixed-income">صندوق‌های درآمد ثابت</a></li>
          <li><a href="/funds/commodity">صندوق‌های طلا و کالایی</a></li>
          <li><a href="/risk-assessment">تست ریسک پذیری رصد</a></li>
          <li><a href="/about">درباره سایت رصد</a></li>
        </ul>
      </section>
    </main>
  `
}

function aboutBody() {
  return `
    <main dir="rtl">
      <h1>سایت رصد چیست؟</h1>
      <p>سایت رصد در نشانی ${siteUrl} یک پلتفرم داده‌محور برای تحلیل و مقایسه صندوق‌های سرمایه‌گذاری ایران است. رصد خودش صندوق سرمایه‌گذاری نیست؛ نقش آن نمایش، تحلیل، رتبه‌بندی و مقایسه داده‌های صندوق‌ها برای تصمیم‌گیری شفاف‌تر است.</p>
      <section>
        <h2>رصد برای چه کسانی ساخته شده است؟</h2>
        <p>رصد برای سرمایه‌گذاران، مدیران صندوق، تیم‌های بازاریابی صندوق‌ها و افرادی ساخته شده که می‌خواهند صندوق‌های سرمایه‌گذاری ایران را با داده‌های منظم‌تر بررسی کنند.</p>
      </section>
      <section>
        <h2>رصد چه داده‌هایی را نمایش می‌دهد؟</h2>
        <p>در سایت رصد می‌توان اطلاعاتی مانند بازدهی، دارایی تحت مدیریت، گروه صندوق، جریان پول، داده‌های مقایسه‌ای و شاخص‌های تحلیلی صندوق‌ها را بررسی کرد.</p>
      </section>
      <section>
        <h2>نام‌های مرتبط با رصد</h2>
        <p>این سرویس با نام‌های رصد، سایت رصد، Rasad و ra100 شناخته می‌شود. دامنه رسمی رصد ${siteUrl} است.</p>
      </section>
    </main>
  `
}

const brandFaq = [
  {
    question: 'سایت رصد چیست؟',
    answer: 'سایت رصد یک پلتفرم فارسی برای تحلیل، رتبه‌بندی و مقایسه صندوق‌های سرمایه‌گذاری ایران است.',
  },
  {
    question: 'آدرس رسمی سایت رصد چیست؟',
    answer: 'آدرس رسمی سایت رصد https://ra100.ir/ است.',
  },
  {
    question: 'آیا رصد خودش صندوق سرمایه‌گذاری است؟',
    answer: 'خیر. رصد صندوق سرمایه‌گذاری نیست و داده‌های صندوق‌ها را برای تحلیل، مقایسه و تصمیم‌گیری شفاف‌تر نمایش می‌دهد.',
  },
]

function blogIndexBody() {
  return `
    <main dir="rtl">
      <h1>وبلاگ رصد؛ راهنمای انتخاب و مقایسه صندوق‌های سرمایه‌گذاری</h1>
      <p>رصد یک ابزار مقایسه صندوق‌های سرمایه‌گذاری در ایران است. در وبلاگ رصد، مفاهیم مهم صندوق‌ها ساده و کاربردی توضیح داده می‌شود.</p>
      <ul>
        ${blogPosts.map((post) => `<li><a href="/blog/${post.slug}">${escapeHtml(post.title)}</a><p>${escapeHtml(post.description)}</p></li>`).join('\n        ')}
      </ul>
    </main>
  `
}

function postBody(post) {
  return `
    <article dir="rtl">
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.hero)}</p>
      ${post.sections.map((section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.body ? section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n') : ''}
          ${section.list ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}</ul>` : ''}
        </section>
      `).join('\n')}
      <section>
        <h2>پرسش‌های پرتکرار</h2>
        ${post.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('\n')}
      </section>
    </article>
  `
}

function riskBody() {
  return `
    <main dir="rtl">
      <h1>تست ریسک پذیری و آزمون ریسک سنجی سرمایه‌گذاری</h1>
      <p>با تست ریسک پذیری رصد، میزان ریسک‌پذیری مالی خود را بسنجید، تیپ سرمایه‌گذاری‌تان را بشناسید و پیشنهاد صندوق متناسب با داده‌های روز دریافت کنید.</p>
      <p>این صفحه برای عبارت‌های ${riskSeoKeywords.map(escapeHtml).join('، ')} طراحی شده است.</p>
      ${riskSeoSections.map((section) => `
        <section>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.body)}</p>
        </section>
      `).join('\n')}
      <section>
        <h2>پرسش‌های پرتکرار آزمون ریسک سنجی</h2>
        ${riskSeoFaq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('\n')}
      </section>
      <p><a href="/risk-assessment">شروع تست ریسک پذیری</a></p>
    </main>
  `
}

writePage('/', {
  title: brandTitle,
  description: brandDescription,
  canonical: `${siteUrl}/`,
  keywords: ['سایت رصد', 'رصد', 'Rasad', 'مقایسه صندوق سرمایه گذاری', 'رتبه بندی صندوق‌ها'],
  body: homeBody(),
  jsonLd: [organizationJsonLd(), websiteJsonLd(), faqListJsonLd(brandFaq)],
})

writePage('/about', {
  title: 'سایت رصد چیست؟ | درباره رصد',
  description: 'درباره سایت رصد؛ پلتفرم فارسی تحلیل، رتبه‌بندی و مقایسه صندوق‌های سرمایه‌گذاری ایران در نشانی ra100.ir.',
  canonical: `${siteUrl}/about`,
  keywords: ['سایت رصد چیست', 'درباره رصد', 'رصد چیست', 'Rasad'],
  body: aboutBody(),
  jsonLd: [organizationJsonLd(), faqListJsonLd(brandFaq)],
})

writePage('/blog', {
  title: 'وبلاگ رصد | راهنمای صندوق‌های سرمایه‌گذاری',
  description: 'آموزش و راهنمای انتخاب، مقایسه و رتبه‌بندی صندوق‌های سرمایه‌گذاری ایران با داده‌های رصد.',
  canonical: `${siteUrl}/blog`,
  keywords: ['وبلاگ رصد', 'صندوق سرمایه گذاری', 'مقایسه صندوق‌ها'],
  body: blogIndexBody(),
  jsonLd: [{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'وبلاگ رصد',
    url: `${siteUrl}/blog`,
    inLanguage: 'fa-IR',
  }],
})

for (const post of blogPosts) {
  const canonical = `${siteUrl}/blog/${post.slug}`
  writePage(`/blog/${post.slug}`, {
    title: `${post.title} | رصد`,
    description: post.description,
    canonical,
    type: 'article',
    keywords: post.keywords,
    body: postBody(post),
    jsonLd: [articleJsonLd(post, canonical), faqJsonLd(post)],
  })
}

const riskJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'تست ریسک پذیری رصد',
    url: `${siteUrl}/risk-assessment`,
    applicationCategory: 'FinanceApplication',
    inLanguage: 'fa-IR',
    description: riskSeoPage.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IRR' },
  },
  faqListJsonLd(riskSeoFaq),
]

for (const route of [riskSeoPage.canonicalPath, ...riskSeoPage.aliases]) {
  writePage(route, {
    title: riskSeoPage.title,
    description: riskSeoPage.description,
    canonical: `${siteUrl}${riskSeoPage.canonicalPath}`,
    type: 'website',
    keywords: riskSeoKeywords,
    body: riskBody(),
    jsonLd: riskJsonLd,
  })
}

console.log(`Prerendered 2 brand pages, ${blogPosts.length + 1} blog pages and ${riskSeoPage.aliases.length + 1} risk pages.`)
