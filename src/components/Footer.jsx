import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AtSign, BriefcaseBusiness, ChevronDown, Send } from 'lucide-react'

const links = {
  'صندوق‌ها': [
    { label: 'درآمد ثابت', to: '/funds/fixed-income' },
    { label: 'سهامی', to: '/funds/equity' },
    { label: 'مختلط', to: '/funds/mixed' },
    { label: 'کالایی', to: '/funds/commodity' },
    { label: 'اهرمی', to: '/funds/leveraged' },
  ],
  'ابزارها': [
    { label: 'سامانه مقایسه', to: '/compare' },
    { label: 'اطلاعات تجمیعی', to: '/aggregate' },
    { label: 'مدیران صندوق‌ها', to: '/managers' },
    { label: 'مارکتینگ صندوق‌ها', to: '/marketing' },
    { label: 'رتبه‌بندی صندوق‌ها', to: '/ranking' },
  ],
  'شرکت': [
    { label: 'وبلاگ رصد', to: '/blog' },
    { label: 'درباره رصد', to: '/about' },
    { label: 'تماس با ما', to: '/about' },
  ],
}

const socials = [
  { label: 'توییتر', icon: AtSign },
  { label: 'لینکدین', icon: BriefcaseBusiness },
  { label: 'تلگرام', icon: Send },
]

export default function Footer() {
  const [openSection, setOpenSection] = useState(null)

  return (
    <footer className="relative overflow-hidden border-t border-neon-cyan/10 bg-surface/30 backdrop-blur-sm">
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-1 gap-6 md:grid-cols-5 md:gap-10">
          <div className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <img src="/assets/Logo.png" alt="" className="h-8 w-auto object-contain" />
              <span className="text-xl text-white" style={{ fontWeight: 900 }}>رصد</span>
            </div>
            <p className="mb-4 max-w-sm text-xs leading-6 text-text-muted sm:mb-6 sm:max-w-xs sm:text-sm" style={{ fontWeight: 600 }}>
              پلتفرم جامع تحلیل و مقایسه صندوق‌های سرمایه‌گذاری ایران؛ داده‌های شفاف برای تصمیم‌های بهتر.
            </p>
            <div className="flex gap-2">
              {socials.map(({ label, icon: Icon }) => (
                <a key={label} href="#" aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg border border-neon-cyan/10 bg-surface/60 text-text-muted transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title} className="hidden md:block">
              <h4 className="mb-4 text-sm text-white" style={{ fontWeight: 900 }}>{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => <li key={item.label}><Link to={item.to} className="text-sm text-text-muted transition-colors hover:text-neon-cyan" style={{ fontWeight: 600 }}>{item.label}</Link></li>)}
              </ul>
            </div>
          ))}

          <div className="divide-y divide-neon-cyan/10 border-y border-neon-cyan/10 md:hidden">
            {Object.entries(links).map(([title, items]) => {
              const open = openSection === title
              return (
                <div key={title}>
                  <button type="button" onClick={() => setOpenSection(open ? null : title)} className="flex h-11 w-full items-center justify-between text-sm text-white" style={{ fontWeight: 800 }} aria-expanded={open}>
                    {title}<ChevronDown size={17} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid overflow-hidden transition-all ${open ? 'grid-rows-[1fr] pb-3' : 'grid-rows-[0fr]'}`}>
                    <ul className="grid min-h-0 grid-cols-2 gap-x-4 gap-y-1 overflow-hidden">
                      {items.map((item) => <li key={item.label}><Link to={item.to} className="block py-1.5 text-xs text-text-muted" style={{ fontWeight: 600 }}>{item.label}</Link></li>)}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <div className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-neon-cyan/10 pt-4 sm:mt-12 sm:flex-row sm:gap-4 sm:pt-6">
          <p className="text-center text-[0.68rem] text-text-muted sm:text-right" style={{ fontWeight: 600 }}>© ۱۴۰۴ رصد. تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neon-green" /><span className="text-[0.68rem] text-neon-green" style={{ fontWeight: 600 }}>سیستم آنلاین و فعال</span></div>
        </div>
      </div>
    </footer>
  )
}
