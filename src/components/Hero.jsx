import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const stars = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 3 + 2,
}))

const shootingStars = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  top: Math.random() * 40 + 5,
  right: Math.random() * 60 + 20,
  delay: i * 3 + Math.random() * 2,
}))

export default function Hero() {
  const ref = useRef(null)
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const contentY = useTransform(scrollY, [0, 400], [0, 60])

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover"
          style={{ objectPosition: '30% center' }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/assets/grok-f50e1a24-4cc4-4f36-8ced-d1d26b81ab54-720p.mp4" type="video/mp4" />
        </video>

        {/* Base darkening overlay for global contrast */}
        <div className="absolute inset-0 bg-space/30" />

        {/* Radial spotlight behind text — boosts contrast where the headline sits */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(5,8,15,0.65) 0%, rgba(5,8,15,0.3) 50%, transparent 80%)',
          }}
        />

        {/* Top + bottom gradient fades */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-space/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-space to-transparent" />

        {/* Subtle nebula tint */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-violet/20 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-neon-cyan/15 blur-[100px]" />
        </div>
      </div>

      {/* Stars */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
        {shootingStars.map((s) => (
          <div
            key={s.id}
            className="absolute w-24 h-px opacity-0"
            style={{
              top: `${s.top}%`,
              right: `${s.right}%`,
              background: 'linear-gradient(90deg, transparent, #00D4FF, white)',
              animation: `shoot 4s ease-in ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main hero content */}
      <motion.div
        style={{ opacity, y: contentY }}
        className="relative z-10 text-center px-5 sm:px-6 max-w-4xl mx-auto py-24"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-neon-cyan/40 bg-space/60 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
          <span className="text-neon-cyan text-xs sm:text-sm font-dana" style={{ fontWeight: 600 }}>
            پلتفرم هوشمند تحلیل بازار سرمایه
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[2.5rem] leading-[1.15] sm:text-6xl lg:text-7xl font-dana mb-5"
          style={{ fontWeight: 900, textShadow: '0 2px 30px rgba(5,8,15,0.9)' }}
        >
          <span className="text-white">بازار را </span>
          <span
            className="text-neon-cyan"
            style={{ textShadow: '0 0 40px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.3)' }}
          >
            رصد
          </span>
          <span className="text-white"> کنید</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-lg sm:text-2xl lg:text-3xl text-white/90 font-dana mb-5"
          style={{ fontWeight: 600, textShadow: '0 2px 20px rgba(5,8,15,0.9)' }}
        >
          با دقت رصدخانه، با سرعت نور
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-white/75 text-sm sm:text-base lg:text-lg max-w-xl mx-auto mb-9 leading-relaxed font-dana"
          style={{ fontWeight: 600, textShadow: '0 1px 12px rgba(5,8,15,0.9)' }}
        >
          سایت رصد، پایگاه داده و ابزار تحلیل صندوق‌های سرمایه‌گذاری ایران است؛
          مقایسه هوشمند، رتبه‌بندی و اطلاعات شفاف برای تصمیم‌های بهتر.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <a
            href="#funds"
            className="group relative w-full sm:w-auto px-8 py-4 rounded-xl font-dana text-space text-base cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              fontWeight: 900,
              background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
              boxShadow: '0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.1)',
            }}
          >
            <span className="relative z-10">مشاهده صندوق‌ها</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-dana text-white text-base cursor-pointer border border-neon-cyan/40 bg-space/50 backdrop-blur-md hover:border-neon-cyan/70 hover:bg-neon-cyan/10 transition-all duration-300 hover:scale-105"
            style={{ fontWeight: 600 }}
          >
            چرا رصد؟
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[0.7rem] text-white/60 font-dana" style={{ fontWeight: 600 }}>
          اسکرول کنید
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border border-neon-cyan/50 flex items-start justify-center pt-1"
        >
          <div className="w-1 h-2 rounded-full bg-neon-cyan" />
        </motion.div>
      </motion.div>
    </section>
  )
}
