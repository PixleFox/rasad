import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    title: 'داده‌های لحظه‌ای',
    desc: 'اطلاعات ناو، بازده، ضریب بتا و شارپ تمام صندوق‌ها را به‌صورت زنده و لحظه‌ای دنبال کنید.',
    color: '#00D4FF',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: 'سامانه مقایسه',
    desc: 'صندوق‌های مختلف را کنار هم بگذارید و با نمودارها و معیارهای دقیق بهترین انتخاب را کنید.',
    color: '#7C3AED',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'شفافیت کامل',
    desc: 'اطلاعات مدیران، ترکیب پورتفولیو، و تاریخچه عملکرد تمام صندوق‌ها بدون پنهان‌کاری.',
    color: '#00FF9D',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'پروفایل مدیران',
    desc: 'شناخت کامل تیم مدیریت صندوق‌ها، سابقه عملکرد و مقایسه بین مدیران مختلف.',
    color: '#FBBF24',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: 'رصد پیشرفته',
    desc: 'هشدارهای هوشمند، تحلیل روند و پیش‌بینی مبتنی بر داده برای سرمایه‌گذاران حرفه‌ای.',
    color: '#00D4FF',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'اطلاعات تجمیعی',
    desc: 'تصویر کلی بازار صندوق‌ها: جریان نقدینگی، میانگین بازده، حجم معاملات و شاخص‌های کلان.',
    color: '#7C3AED',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Features() {
  return (
    <section id="features" className="relative py-24 px-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neon-violet/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating purple planet */}
      <motion.img
        src="/assets/Purple-planet.png"
        alt=""
        aria-hidden="true"
        className="absolute -top-6 left-4 lg:left-16 w-28 lg:w-44 object-contain opacity-40 pointer-events-none select-none"
        style={{ filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.3))' }}
        animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Floating satellite */}
      <motion.img
        src="/assets/satelite.png"
        alt=""
        aria-hidden="true"
        className="absolute bottom-10 right-2 lg:right-12 w-20 lg:w-32 object-contain opacity-30 pointer-events-none select-none hidden sm:block"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.4))' }}
        animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-neon-violet/30 bg-neon-violet/5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-violet" />
            <span className="text-neon-violet text-sm font-dana" style={{ fontWeight: 600 }}>چرا رصد؟</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-dana text-white mb-4"
            style={{ fontWeight: 900 }}
          >
            ابزاری که بازار را{' '}
            <span
              className="text-neon-cyan"
              style={{ textShadow: '0 0 30px rgba(0,212,255,0.5)' }}
            >
              شفاف
            </span>{' '}
            می‌کند
          </h2>
          <p
            className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto font-dana leading-relaxed"
            style={{ fontWeight: 600 }}
          >
            رصد با ترکیب داده‌های رسمی و تحلیل‌های هوشمند، تصمیم‌گیری سرمایه‌گذاری را ساده‌تر می‌کند.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative p-6 rounded-2xl border border-neon-cyan/10 bg-surface/60 backdrop-blur-sm cursor-default overflow-hidden transition-all duration-300"
              style={{
                '--hover-color': f.color,
              }}
            >
              {/* Hover border glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 1px ${f.color}40, 0 0 30px ${f.color}15`,
                }}
              />

              {/* Corner decoration */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: f.color }}
              />

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                style={{
                  color: f.color,
                  background: `${f.color}15`,
                  boxShadow: `0 0 0 1px ${f.color}30`,
                }}
              >
                {f.icon}
              </div>

              <h3
                className="text-white text-lg font-dana mb-3"
                style={{ fontWeight: 900 }}
              >
                {f.title}
              </h3>
              <p
                className="text-text-muted text-sm leading-relaxed font-dana"
                style={{ fontWeight: 600 }}
              >
                {f.desc}
              </p>

              {/* Bottom line */}
              <div
                className="absolute bottom-0 right-0 left-0 h-0.5 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
