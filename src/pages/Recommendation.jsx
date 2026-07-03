import { motion } from 'framer-motion'
import { BarChart3, ClipboardCheck, ShieldCheck, Sparkles } from 'lucide-react'

const steps = [
  { icon: ClipboardCheck, title: 'شناخت ریسک‌پذیری', text: 'بررسی تجربه، افق زمانی و واکنش شما به نوسان بازار' },
  { icon: BarChart3, title: 'تحلیل پاسخ‌ها', text: 'تبدیل پاسخ‌ها به یک نمای روشن از سطح ریسک مناسب شما' },
  { icon: ShieldCheck, title: 'پیشنهاد متناسب', text: 'انتخاب ترکیبی از صندوق‌ها هماهنگ با شرایط و ترجیحات شما' },
]

export default function Recommendation() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-24 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)', backgroundSize: '54px 54px' }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-neon-green/30 bg-neon-green/10 text-neon-green shadow-[0_0_30px_rgba(0,255,157,0.18)]">
          <Sparkles size={30} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <span className="text-xs text-neon-green" style={{ fontWeight: 800 }}>پیشنهاد اختصاصی رصد</span>
          <h1 className="mx-auto mt-3 max-w-3xl text-3xl leading-relaxed text-white sm:text-5xl sm:leading-relaxed" style={{ fontWeight: 900 }}>
            قبل از پیشنهاد پورتفوی اختصاصی برای شما، باید یک آزمون ریسک‌پذیری از شما بگیریم.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted sm:text-base">
            پاسخ‌های شما کمک می‌کند پیشنهاد نهایی با افق سرمایه‌گذاری، هدف مالی و میزان تحمل نوسان شما هماهنگ باشد.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-10 grid gap-px overflow-hidden rounded-lg border border-neon-cyan/10 bg-neon-cyan/10 text-right sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-space/95 p-5">
              <Icon size={21} className="mb-3 text-neon-cyan" />
              <h2 className="text-sm text-white" style={{ fontWeight: 900 }}>{title}</h2>
              <p className="mt-2 text-xs leading-6 text-text-muted" style={{ fontWeight: 600 }}>{text}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  )
}
