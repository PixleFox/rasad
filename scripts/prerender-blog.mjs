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

console.log(`Prerendered ${blogPosts.length + 1} blog pages and ${riskSeoPage.aliases.length + 1} risk pages.`)
