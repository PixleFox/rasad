import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { fetchFundCompare, todayISO } from '../lib/fipiran'

function useCounter(target, duration = 2000, inView = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])
  return count
}

const stats = [
  { value: 347, suffix: '+', label: 'صندوق فعال', color: '#00D4FF', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
    </svg>
  )},
  { value: 890, suffix: ' هزار میلیارد تومان', label: 'کل دارایی تحت مدیریت', color: '#00FF9D', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
    </svg>
  )},
  { value: 141, suffix: '', label: 'شرکت مدیریت دارایی', color: '#7C3AED', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )},
  { value: 98, suffix: '%', label: 'پوشش بازار صندوق‌های ایران', color: '#FBBF24', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  )},
]

function StatCard({ stat, inView, liveValue, loading }) {
  const effectiveValue = liveValue ?? stat.value
  const count = useCounter(effectiveValue, 1800, inView && !loading)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative p-6 rounded-2xl border border-neon-cyan/10 bg-surface/50 backdrop-blur-sm overflow-hidden group hover:border-neon-cyan/25 transition-all duration-300"
    >
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl"
        style={{ background: `radial-gradient(circle at center, ${stat.color}, transparent 70%)` }}
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ color: stat.color, background: `${stat.color}15`, boxShadow: `0 0 0 1px ${stat.color}30` }}
        >
          {stat.icon}
        </div>

        <div
          className="text-3xl sm:text-4xl font-dana tabular-nums"
          style={{ fontWeight: 900, color: stat.color, textShadow: `0 0 20px ${stat.color}60` }}
        >
          {loading
            ? <span className="text-lg opacity-50 animate-pulse">در حال لود...</span>
            : <>{count.toLocaleString('fa-IR')}{stat.suffix}</>
          }
        </div>

        <p className="text-text-muted text-sm font-dana" style={{ fontWeight: 600 }}>
          {stat.label}
        </p>
      </div>
    </motion.div>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  // Live fund count and total AUM from Fipiran
  const [liveCount, setLiveCount] = useState(null)
  const [liveAUM, setLiveAUM]     = useState(null)
  const [liveLoading, setLiveLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { funds } = await fetchFundCompare(todayISO())
      setLiveCount(funds.length)
      const totalRial = funds.reduce((s, f) => s + (f.navRet > 0 && f.units > 0 ? f.navRet * f.units : 0), 0)
      setLiveAUM(Math.round(totalRial / 1e13))
    }

    run().catch(() => {}).finally(() => setLiveLoading(false))
  }, [])

  return (
    <section ref={ref} className="relative py-20 px-4 overflow-hidden">
      {/* Divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-neon-cyan/30 to-transparent" />

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-neon-cyan/5 blur-[100px] rounded-full" />
      </div>

      {/* Floating astronaut */}
      <motion.img
        src="/assets/Astronut.png"
        alt=""
        aria-hidden="true"
        className="absolute top-8 right-2 lg:right-10 w-24 lg:w-40 object-contain opacity-40 pointer-events-none select-none hidden sm:block"
        style={{ filter: 'drop-shadow(0 0 25px rgba(0,212,255,0.35))' }}
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            <span className="text-neon-green text-sm font-dana" style={{ fontWeight: 600 }}>خلاصه بازار</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-dana text-white" style={{ fontWeight: 900 }}>
            اعداد واقعی، داده‌های{' '}
            <span className="text-neon-green" style={{ textShadow: '0 0 30px rgba(0,255,157,0.5)' }}>
              زنده
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => {
            const liveValue =
              stat.label === 'صندوق فعال' && liveCount != null ? liveCount
              : stat.label === 'کل دارایی تحت مدیریت' && liveAUM != null ? liveAUM
              : null
            const isLiveStat = stat.label === 'صندوق فعال' || stat.label === 'کل دارایی تحت مدیریت'
            return <StatCard key={stat.label} stat={stat} inView={inView} liveValue={liveValue} loading={isLiveStat && liveLoading} />
          })}
        </div>
      </div>
    </section>
  )
}
