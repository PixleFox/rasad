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
  return (
    <main className="relative min-h-screen overflow-hidden">
      <FipiranLoader loading={loading} />
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10"
        >
          <div>
            <div
              className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border"
              style={{ borderColor: `${accentColor}4D`, background: `${accentColor}0D` }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              <span className="text-sm font-dana" style={{ fontWeight: 600, color: accentColor }}>
                {badge}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-dana text-white" style={{ fontWeight: 900 }}>
              {title}{' '}
              <span style={{ color: accentColor, textShadow: `0 0 30px ${accentColor}80` }}>{highlight}</span>{' '}
              {titleTail}
            </h1>
            <p className="text-text-muted text-sm sm:text-base font-dana mt-3 max-w-xl leading-relaxed" style={{ fontWeight: 600 }}>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-neon-cyan">
                  <span className="w-3 h-3 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                  در حال دریافت داده‌ی زنده از فیپیران…
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
