import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

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
    { label: 'درباره رصد', to: '/about' },
    { label: 'تماس با ما', to: '/about' },
  ],
}

export default function Footer() {
  const year = '۱۴۰۴'

  return (
    <footer className="relative border-t border-neon-cyan/10 bg-surface/30 backdrop-blur-sm overflow-hidden">
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.5), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-5 gap-10"
        >
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/assets/Logo.png"
                alt=""
                className="h-9 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.4))' }}
              />
              <span
                className="text-2xl font-dana text-white"
                style={{ fontWeight: 900, textShadow: '0 0 20px rgba(0,212,255,0.4)' }}
              >
                رصد
              </span>
            </div>

            <p className="text-text-muted text-sm font-dana leading-relaxed mb-6 max-w-xs" style={{ fontWeight: 600 }}>
              پلتفرم جامع تحلیل و مقایسه صندوق‌های سرمایه‌گذاری ایران. رصد با دقت رصدخانه، با سرعت نور.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {[
                { label: 'توییتر', icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )},
                { label: 'لینکدین', icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                )},
                { label: 'تلگرام', icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                )},
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg border border-neon-cyan/10 bg-surface/60 flex items-center justify-center text-text-muted hover:text-neon-cyan hover:border-neon-cyan/40 transition-all duration-200 cursor-pointer"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white text-sm font-dana mb-4" style={{ fontWeight: 900 }}>
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-text-muted text-sm font-dana hover:text-neon-cyan transition-colors duration-150 cursor-pointer"
                      style={{ fontWeight: 600 }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-neon-cyan/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs font-dana text-center sm:text-right" style={{ fontWeight: 600 }}>
            © {year} رصد. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-neon-green text-xs font-dana" style={{ fontWeight: 600 }}>
              سیستم آنلاین و فعال
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
