import { motion } from 'framer-motion'
import { useState } from 'react'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

const MILESTONES = [
  { year: '۱۴۰۳', label: 'ایده‌پردازی', desc: 'مشاهده خلأ داده‌های شفاف و تحلیلی در بازار صندوق‌های ایران' },
  { year: '۱۴۰۳', label: 'ساخت هسته', desc: 'اتصال زنده به فیپیران، پیاده‌سازی موتور محاسبه بازدهی و جریان پول' },
  { year: '۱۴۰۴', label: 'رصد ۱.۰',   desc: 'انتشار اولین نسخه با پوشش کامل ۵۰۰+ صندوق در ۷ دسته‌بندی' },
  { year: '۱۴۰۵', label: 'امروز',      desc: 'سامانه مقایسه، شاخص رصد، تحلیل مارکتینگ و صفحات مدیران' },
]

const VALUES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: '#00D4FF',
    title: 'شفافیت',
    desc: 'همه داده‌ها از منابع رسمی فیپیران و TSETMC. هیچ عددی دستکاری نمی‌شود.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: '#00FF9D',
    title: 'سرعت',
    desc: 'داده‌های زنده با کمترین تأخیر. تصمیم‌گیری آگاهانه نیاز به اطلاعات لحظه‌ای دارد.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    color: '#A78BFA',
    title: 'دقت',
    desc: 'شاخص رصد با وزن‌دهی علمی به بازدهی، اندازه، سابقه و ارزندگی محاسبه می‌شود.',
  },
]

function ContactForm() {
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formsubmit.co/ajax/alirezaeslamibidgoli@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          نام: form.name,
          ایمیل: form.email,
          موضوع: form.subject,
          پیام: form.message,
          _subject: `پیام جدید از رصد — ${form.subject}`,
          _captcha: 'false',
          _template: 'table',
        }),
      })
      if (res.ok) {
        setStatus('sent')
        setForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-neon-cyan/20 bg-surface/30 backdrop-blur-sm p-8 sm:p-10 flex flex-col items-center gap-4 text-center"
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,255,157,0.15)', border: '1px solid rgba(0,255,157,0.3)' }}>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#00FF9D">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-white text-lg font-dana" style={{ fontWeight: 900 }}>پیام ارسال شد!</h3>
        <p className="text-text-muted text-sm font-dana" style={{ fontWeight: 600 }}>
          پیام شما با موفقیت دریافت شد. در اسرع وقت پاسخ خواهیم داد.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-neon-cyan text-sm font-dana cursor-pointer hover:text-white transition-colors"
          style={{ fontWeight: 700 }}
        >
          ارسال پیام دیگر
        </button>
      </motion.div>
    )
  }

  return (
    <div className="rounded-2xl border border-neon-cyan/10 bg-surface/30 backdrop-blur-sm p-6 sm:p-8">
      <h3 className="text-white text-base mb-6" style={{ fontWeight: 900 }}>ارسال پیام</h3>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-muted text-xs font-dana mb-1.5" style={{ fontWeight: 600 }}>نام و نام خانوادگی</label>
            <input required type="text" value={form.name} onChange={set('name')}
              placeholder="علیرضا اسلامی بیدگلی"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neon-cyan/15 bg-space/60 text-text-primary text-sm font-dana outline-none focus:border-neon-cyan/40 transition-colors"
              style={{ fontWeight: 600 }} />
          </div>
          <div>
            <label className="block text-text-muted text-xs font-dana mb-1.5" style={{ fontWeight: 600 }}>ایمیل</label>
            <input required type="email" value={form.email} onChange={set('email')}
              placeholder="email@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-neon-cyan/15 bg-space/60 text-text-primary text-sm font-dana outline-none focus:border-neon-cyan/40 transition-colors"
              style={{ fontWeight: 600 }} />
          </div>
        </div>
        <div>
          <label className="block text-text-muted text-xs font-dana mb-1.5" style={{ fontWeight: 600 }}>موضوع</label>
          <input required type="text" value={form.subject} onChange={set('subject')}
            placeholder="پیشنهاد / گزارش مشکل / همکاری"
            className="w-full px-3.5 py-2.5 rounded-lg border border-neon-cyan/15 bg-space/60 text-text-primary text-sm font-dana outline-none focus:border-neon-cyan/40 transition-colors"
            style={{ fontWeight: 600 }} />
        </div>
        <div>
          <label className="block text-text-muted text-xs font-dana mb-1.5" style={{ fontWeight: 600 }}>پیام</label>
          <textarea required rows={4} value={form.message} onChange={set('message')}
            placeholder="پیام خود را بنویسید..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-neon-cyan/15 bg-space/60 text-text-primary text-sm font-dana outline-none focus:border-neon-cyan/40 transition-colors resize-none"
            style={{ fontWeight: 600 }} />
        </div>
        {status === 'error' && (
          <p className="text-xs font-dana" style={{ color: '#FF3B6B', fontWeight: 600 }}>
            خطا در ارسال. لطفاً مستقیم به alirezaeslamibidgoli@gmail.com ایمیل بزنید.
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full py-3 rounded-xl text-sm font-dana text-space bg-neon-cyan hover:bg-white transition-all duration-200 cursor-pointer shadow-neon-cyan disabled:opacity-60"
          style={{ fontWeight: 900 }}
        >
          {status === 'sending' ? 'در حال ارسال...' : 'ارسال پیام'}
        </button>
      </form>
    </div>
  )
}

export default function About() {
  return (
    <div className="min-h-screen bg-space pt-20 pb-20 relative overflow-hidden font-dana" dir="rtl">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <motion.div {...fade(0)} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
            style={{ fontWeight: 700, background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse inline-block" />
            درباره رصد
          </div>
          <h1 className="text-4xl sm:text-5xl text-white mb-5" style={{ fontWeight: 900 }}>
            داستان <span className="text-neon-cyan">رصد</span>
          </h1>
          <p className="text-text-muted text-base leading-relaxed max-w-2xl mx-auto" style={{ fontWeight: 600 }}>
            رصد از یک سؤال ساده متولد شد: <span className="text-text-primary">چرا سرمایه‌گذار ایرانی برای مقایسه چند صندوق، باید ساعت‌ها وقت بگذارد؟</span>
          </p>
        </motion.div>

        {/* ── Brand story ──────────────────────────────────────── */}
        <motion.section {...fade(0.1)} className="mb-20">
          <div className="rounded-2xl border border-neon-cyan/10 bg-surface/30 backdrop-blur-sm p-8 sm:p-10">
            <h2 className="text-xl text-white mb-6" style={{ fontWeight: 900 }}>
              چرا رصد؟
            </h2>
            <div className="space-y-5 text-text-muted leading-relaxed text-sm" style={{ fontWeight: 600 }}>
              <p>
                بازار صندوق‌های سرمایه‌گذاری ایران با بیش از <span className="text-neon-cyan text-base" style={{ fontWeight: 900 }}>۵۰۰ صندوق</span> و <span className="text-neon-cyan text-base" style={{ fontWeight: 900 }}>۲,۸۰۰ هزار میلیارد تومان</span> دارایی، یکی از بزرگ‌ترین بازارهای مالی کشور است. اما ابزارهای تحلیلی در اختیار سرمایه‌گذاران و مدیران، به‌قدری محدود بود که تصمیم‌گیری آگاهانه عملاً دشوار بود.
              </p>
              <p>
                رصد با هدف پر کردن این خلأ ساخته شد. نه فقط یک جدول ساده از بازدهی‌ها، بلکه یک <span className="text-text-primary">پلتفرم هوشمند</span> که داده‌های خام فیپیران را به بینش‌های عملی تبدیل می‌کند: از شاخص ترکیبی رصد تا تحلیل مارکتینگ صندوق‌ها.
              </p>
              <p>
                نام «رصد» از دیده‌بانی نجومی الهام گرفته. درست مثل یک رصدخانه که ستاره‌های دور را با دقت رصد می‌کند، این پلتفرم بازار سرمایه ایران را زیر نگاه دقیق داده‌محور می‌گیرد.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Values ───────────────────────────────────────────── */}
        <motion.section {...fade(0.2)} className="mb-20">
          <h2 className="text-center text-xl text-white mb-8" style={{ fontWeight: 900 }}>ارزش‌های ما</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border p-6 text-center"
                style={{ borderColor: `${v.color}20`, background: `${v.color}06` }}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ background: `${v.color}15`, color: v.color, border: `1px solid ${v.color}30` }}>
                  {v.icon}
                </div>
                <h3 className="text-white text-base mb-2" style={{ fontWeight: 900 }}>{v.title}</h3>
                <p className="text-text-muted text-xs leading-relaxed" style={{ fontWeight: 600 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── Timeline ─────────────────────────────────────────── */}
        <motion.section {...fade(0.3)} className="mb-20">
          <h2 className="text-center text-xl text-white mb-10" style={{ fontWeight: 900 }}>مسیر رصد</h2>
          <div className="relative">
            {/* Line */}
            <div className="absolute right-[3.25rem] top-0 bottom-0 w-px bg-gradient-to-b from-neon-cyan/30 via-neon-violet/20 to-transparent" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex items-start gap-5 pr-2">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 56 }}>
                    <div className="w-3 h-3 rounded-full bg-neon-cyan border-2 border-space z-10" />
                    <span className="text-[0.6rem] text-neon-cyan/60 font-dana tabular-nums" style={{ fontWeight: 700 }}>{m.year}</span>
                  </div>
                  <div className="rounded-xl border border-neon-cyan/10 bg-surface/30 p-4 flex-1">
                    <span className="text-neon-cyan text-sm font-dana" style={{ fontWeight: 900 }}>{m.label}</span>
                    <p className="text-text-muted text-xs mt-1 leading-relaxed" style={{ fontWeight: 600 }}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Contact ──────────────────────────────────────────── */}
        <motion.section {...fade(0.4)}>
          <h2 className="text-center text-xl text-white mb-8" style={{ fontWeight: 900 }}>تماس با ما</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
                label: 'ایمیل',
                value: 'info@rasad.io',
                color: '#00D4FF',
              },
              {
                icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
                label: 'تلگرام',
                value: '@rasad_io',
                color: '#00FF9D',
              },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-4 rounded-xl border border-neon-cyan/10 bg-surface/30 p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}25` }}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>{c.label}</p>
                  <p className="text-text-primary text-sm font-dana" style={{ fontWeight: 900, direction: 'ltr' }}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          <ContactForm />
        </motion.section>

      </div>
    </div>
  )
}
