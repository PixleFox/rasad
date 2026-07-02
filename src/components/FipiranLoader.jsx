import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { fetchCodalNews } from '../lib/fipiran'

const LOADING_TEXT = 'در حال دریافت اطلاعات از مراجع'

export default function FipiranLoader({ loading }) {
  const [codalNews, setCodalNews] = useState([])
  const [newsIdx, setNewsIdx] = useState(0)
  const [dots, setDots]       = useState(1)
  const [typedLength, setTypedLength] = useState(0)

  useEffect(() => {
    fetchCodalNews(80).then(setCodalNews).catch(() => {})
  }, [])

  useEffect(() => {
    if (!loading) return
    const t1 = setInterval(() => setNewsIdx((i) => (i + 1) % Math.max(codalNews.length, 1)), 2200)
    return () => clearInterval(t1)
  }, [loading, codalNews.length])

  useEffect(() => {
    if (!loading) return
    setTypedLength(0)
    setDots(1)
    const typing = setInterval(() => {
      setTypedLength((length) => {
        if (length >= LOADING_TEXT.length) {
          clearInterval(typing)
          return length
        }
        return length + 1
      })
    }, 55)
    return () => clearInterval(typing)
  }, [loading])

  useEffect(() => {
    if (!loading || typedLength < LOADING_TEXT.length) return
    const dotTimer = setInterval(() => setDots((count) => count === 3 ? 1 : count + 1), 650)
    return () => clearInterval(dotTimer)
  }, [loading, typedLength])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center font-dana overflow-hidden"
          dir="rtl"
          style={{ background: '#07090F' }}
        >
          {/* Background glow blobs */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)', filter: 'blur(60px)' }} />

          {/* Floating planet — top right */}
          <motion.img
            src="/assets/Purple-planet.png"
            alt=""
            aria-hidden
            className="absolute top-10 right-10 w-28 pointer-events-none select-none opacity-30"
            style={{ filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.4))' }}
            animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Floating telescope — bottom left */}
          <motion.img
            src="/assets/telescope.png"
            alt=""
            aria-hidden
            className="absolute bottom-16 left-12 w-24 pointer-events-none select-none opacity-20"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.3))' }}
            animate={{ y: [0, 10, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          {/* Floating satellite — top left */}
          <motion.img
            src="/assets/satelite.png"
            alt=""
            aria-hidden
            className="absolute top-20 left-16 w-16 pointer-events-none select-none opacity-20"
            style={{ filter: 'drop-shadow(0 0 15px rgba(0,255,157,0.3))' }}
            animate={{ x: [0, 20, 0], y: [0, -8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />

          {/* Main content */}
          <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-lg px-6">

            {/* Logo + astronaut */}
            <div className="flex flex-col items-center gap-4">
              <motion.img
                src="/assets/Astronut.png"
                alt=""
                aria-hidden
                className="w-24 pointer-events-none select-none"
                style={{ filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.5))' }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <img src="/assets/Logo.png" alt="رصد" className="h-10 w-auto opacity-90"
                style={{ filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.5))' }} />
            </div>

            {/* Loading text */}
            <div className="h-7 flex items-center justify-center">
              <p className="text-sm font-dana text-center" style={{ fontWeight: 700, color: '#00D4FF' }}>
                {LOADING_TEXT.slice(0, typedLength)}
                {typedLength >= LOADING_TEXT.length && (
                  <span className="inline-block w-5 text-right" dir="ltr">{'.'.repeat(dots)}</span>
                )}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4FF, #A78BFA)' }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Codal news */}
            <div className="w-full mt-2">
              <div className="flex items-center gap-2 mb-2.5 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan/60 inline-block" />
                <span className="text-[0.65rem] font-dana text-text-muted/50" style={{ fontWeight: 600 }}>
                  آخرین اطلاعیه‌های کدال
                </span>
              </div>

              <div className="relative h-28 overflow-hidden">
                <AnimatePresence mode="wait">
                  {codalNews.length === 0 ? (
                    <motion.div key="skel"
                      className="absolute inset-0 rounded-2xl animate-pulse"
                      style={{ background: 'rgba(255,255,255,0.04)' }} />
                  ) : (
                    <motion.a
                      key={newsIdx}
                      href={`https://codal.ir/ReportList.aspx?search&TracingNo=${codalNews[newsIdx]?.tracingNo}`}
                      target="_blank" rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0 flex flex-col gap-2.5 p-4 rounded-2xl border cursor-pointer"
                      style={{ background: 'rgba(0,212,255,0.04)', borderColor: 'rgba(0,212,255,0.12)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-dana px-2.5 py-0.5 rounded-lg shrink-0"
                          style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF', fontWeight: 800 }}>
                          {codalNews[newsIdx]?.symbol}
                        </span>
                        <span className="text-xs font-dana text-text-muted truncate" style={{ fontWeight: 600 }}>
                          {codalNews[newsIdx]?.name}
                        </span>
                        <span className="text-[0.6rem] font-dana text-text-muted/40 shrink-0 mr-auto">
                          {codalNews[newsIdx]?.publishDateTime_Gregorian?.slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-sm font-dana text-text-primary leading-relaxed line-clamp-2" style={{ fontWeight: 600 }}>
                        {codalNews[newsIdx]?.title}
                      </p>
                    </motion.a>
                  )}
                </AnimatePresence>
              </div>

              {/* Dot indicators */}
              <div className="flex justify-center gap-1 mt-3">
                {Array.from({ length: Math.min(codalNews.length, 8) }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{ background: i === newsIdx % 8 ? '#00D4FF' : 'rgba(255,255,255,0.12)' }} />
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
