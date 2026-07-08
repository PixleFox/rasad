import { Link } from 'react-router-dom'
import { CheckCircle2, HelpCircle, SearchCheck } from 'lucide-react'
import { riskSeoFaq, riskSeoKeywords, riskSeoSections } from '../data/riskSeo'

export default function RiskSeoContent({ onStart }) {
  return (
    <section className="mx-auto mt-16 max-w-5xl text-right">
      <div className="rounded-3xl border border-neon-cyan/10 bg-surface/35 p-5 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon-cyan/10 text-neon-cyan"><SearchCheck size={22} /></span>
          <div>
            <h2 className="text-2xl leading-10 text-white" style={{ fontWeight: 900 }}>تست ریسک پذیری و آزمون ریسک سنجی رصد</h2>
            <p className="mt-2 text-sm leading-8 text-text-muted" style={{ fontWeight: 600 }}>
              اگر نمی‌دانید صندوق درآمد ثابت، طلا، سهامی یا اهرمی برای شما مناسب‌تر است، از این آزمون شروع کنید. رصد بعد از ریسک‌سنجی، نتیجه را به داده واقعی صندوق‌های سرمایه‌گذاری وصل می‌کند.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {riskSeoSections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-white/10 bg-space/45 p-5">
              <CheckCircle2 className="mb-3 text-neon-green" size={20} />
              <h3 className="text-base leading-7 text-white" style={{ fontWeight: 900 }}>{section.title}</h3>
              <p className="mt-3 text-xs leading-7 text-text-muted" style={{ fontWeight: 600 }}>{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-neon-green/15 bg-neon-green/5 p-5">
          <h2 className="text-lg text-white" style={{ fontWeight: 900 }}>عبارت‌هایی که این صفحه دقیقاً پوشش می‌دهد</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {riskSeoKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full border border-white/10 bg-space/50 px-3 py-1.5 text-xs text-text-muted" style={{ fontWeight: 700 }}>{keyword}</span>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {riskSeoFaq.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-white/10 bg-space/45 p-5">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-white" style={{ fontWeight: 900 }}>
                <HelpCircle size={18} className="text-neon-cyan" />
                {item.question}
              </summary>
              <p className="mt-3 text-xs leading-7 text-text-muted" style={{ fontWeight: 600 }}>{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-neon-cyan/15 bg-neon-cyan/5 p-5 sm:flex-row">
          <p className="text-sm leading-7 text-text-primary" style={{ fontWeight: 700 }}>
            برای شروع، آزمون را انجام دهید و بعد نتیجه را با صفحه مقایسه صندوق‌های رصد کامل‌تر بررسی کنید.
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onStart} className="rounded-xl bg-neon-green px-5 py-3 text-xs text-space" style={{ fontWeight: 900 }}>شروع آزمون</button>
            <Link to="/compare" className="rounded-xl border border-white/10 px-5 py-3 text-xs text-text-muted transition-colors hover:text-neon-cyan" style={{ fontWeight: 800 }}>مقایسه صندوق‌ها</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
