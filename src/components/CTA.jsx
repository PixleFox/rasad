import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-neon-violet/10 blur-[120px]" />
      </div>

      {/* Floating astronaut */}
      <motion.div
        className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:block"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src="/assets/grok-54cec29a-d517-4dbe-adaf-927d453d7948.png"
          alt=""
          className="w-48 h-60 object-contain opacity-50"
          style={{ filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.4))' }}
        />
      </motion.div>

      {/* Telescope right */}
      <motion.div
        className="absolute right-10 bottom-8 pointer-events-none hidden xl:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <img
          src="/assets/grok-edd0e202-bdf9-4bda-8ab6-d6e652a9e811.png"
          alt=""
          className="w-36 h-36 object-contain opacity-40"
          style={{ filter: 'drop-shadow(0 0 15px rgba(0,212,255,0.5))' }}
        />
      </motion.div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative p-8 sm:p-12 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,17,31,0.9), rgba(124,58,237,0.1))',
            border: '1px solid rgba(0,212,255,0.2)',
            boxShadow: '0 0 60px rgba(124,58,237,0.15), 0 0 120px rgba(0,212,255,0.05)',
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-20"
            style={{ background: 'radial-gradient(circle, #00D4FF, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }} />

          {/* Icon */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 mx-auto mb-6 relative"
          >
            <img
              src="/assets/telescope.png"
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.6))' }}
            />
          </motion.div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-dana text-white mb-4"
            style={{ fontWeight: 900 }}
          >
            آماده‌اید بازار را{' '}
            <span
              className="text-neon-cyan"
              style={{ textShadow: '0 0 40px rgba(0,212,255,0.7)' }}
            >
              رصد
            </span>{' '}
            کنید؟
          </h2>

          <p
            className="text-text-muted text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed font-dana"
            style={{ fontWeight: 600 }}
          >
            به بیش از ۵۰ هزار سرمایه‌گذار بپیوندید که با رصد تصمیم‌های بهتری می‌گیرند.
            دسترسی رایگان، بدون نیاز به ثبت‌نام.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/aggregate"
              className="group px-8 py-4 rounded-xl font-dana text-space text-base cursor-pointer transition-all duration-300 hover:scale-105 relative overflow-hidden text-center"
              style={{
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
                boxShadow: '0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,212,255,0.1)',
              }}
            >
              <span className="relative z-10">شروع</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-15 transition-opacity duration-300" />
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 rounded-xl font-dana text-text-primary text-base cursor-pointer border border-neon-cyan/30 hover:border-neon-cyan/60 bg-neon-cyan/5 hover:bg-neon-cyan/10 transition-all duration-300 hover:scale-105 text-center"
              style={{ fontWeight: 600 }}
            >
              درباره رصد بیشتر بدانید
            </Link>
          </div>

          {/* Features row */}
          <div className="mt-10 pt-8 border-t border-neon-cyan/10 grid grid-cols-3 gap-4">
            {[
              { label: 'رایگان برای همیشه', icon: '✦' },
              { label: 'به‌روزرسانی لحظه‌ای', icon: '✦' },
              { label: 'بدون نیاز به ثبت‌نام', icon: '✦' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1">
                <span className="text-neon-cyan text-xs" style={{ textShadow: '0 0 10px rgba(0,212,255,0.6)' }}>
                  {item.icon}
                </span>
                <span className="text-text-muted text-xs font-dana text-center" style={{ fontWeight: 600 }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
