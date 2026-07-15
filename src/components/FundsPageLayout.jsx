import { motion } from 'framer-motion'
import RangePicker from './RangePicker'
import { toJalali } from '../lib/fipiran'
import FipiranLoader from './FipiranLoader'

// Shared chrome for the fund-info pages: background, header with title + badge +
// Shamsi range pickers + resolved-date subtitle. Renders children below.
export default function FundsPageLayout({
  badge,
  accentColor = '#00D4FF',
  title,
  highlight,
  titleTail,
  subtitle,
  loading,
  startDate,
  endDate,
  startISO,
  endISO,
  setStartISO,
  setEndISO,
  floatAsset,
  children,
}) {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const slowLoad = Boolean(startISO && new Date(`${startISO}T00:00:00`) < oneYearAgo)
  return (
    <main className="relative min-h-screen overflow-hidden">
      <FipiranLoader loading={loading} slow={slowLoad} />
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-neon-violet/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[300px] bg-neon-cyan/8 blur-[120px] rounded-full" />
      </div>
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {floatAsset && (
        <motion.img
          src={floatAsset}
          alt=""
          aria-hidden="true"
          className="absolute top-28 left-6 lg:left-20 w-24 lg:w-36 object-contain opacity-30 pointer-events-none select-none hidden sm:block"
          style={{ filter: 'drop-shadow(0 0 25px rgba(0,212,255,0.35))' }}
          animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-2 pb-12 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 flex flex-col justify-between gap-4 sm:mb-8 lg:mb-10 lg:flex-row lg:items-end lg:gap-6"
        >
          <div>
            <div
              className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 sm:mb-3 sm:px-4 sm:py-1.5"
              style={{ borderColor: `${accentColor}4D`, background: `${accentColor}0D` }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              <span className="text-xs font-dana sm:text-sm" style={{ fontWeight: 600, color: accentColor }}>
                {badge}
              </span>
            </div>
            <h1 className="text-[1.7rem] leading-tight font-dana text-white sm:text-4xl lg:text-5xl" style={{ fontWeight: 900 }}>
              {title}{' '}
              <span style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}80` }}>{highlight}</span>{' '}
              {titleTail}
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-text-muted sm:mt-3 sm:text-base" style={{ fontWeight: 600 }}>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-neon-cyan">
                  <span className="w-3 h-3 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                  {slowLoad ? 'دریافت این بازه قدیمی کمی زمان می‌برد…' : 'در حال دریافت داده از پایگاه داده رصد…'}
                </span>
              ) : (
                <>
                  {subtitle}
                  {startDate && endDate && (
                    <span className="text-text-muted/70">
                      {' '}— از {toJalali(startDate)} تا {toJalali(endDate)}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          <RangePicker startISO={startISO} endISO={endISO} onStart={setStartISO} onEnd={setEndISO} />
        </motion.div>

        {children}
      </div>
    </main>
  )
}
