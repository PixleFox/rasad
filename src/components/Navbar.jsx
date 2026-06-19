import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const menuItems = [
  {
    label: 'اطلاعات صندوق‌ها',
    sub: [
      { label: 'درآمد ثابت', to: '/funds/fixed-income' },
      { label: 'سهامی', to: '/funds/equity' },
      { label: 'مختلط', to: '/funds/mixed' },
      { label: 'کالایی', to: '/funds/commodity' },
      { label: 'اهرمی', to: '/funds/leveraged' },
      { label: 'شاخصی', to: '/funds/index-fund' },
      { label: 'بخشی', to: '/funds/sector' },
    ],
  },
  { label: 'اطلاعات تجمیعی صندوق‌ها', to: '/aggregate' },
  { label: 'مدیران صندوق‌ها', to: '/managers' },
  { label: 'سامانه مقایسه', to: '/compare' },
  { label: 'رتبه‌بندی صندوق‌ها', to: '/ranking' },
  { label: 'مارکتینگ صندوق‌ها', to: '/marketing' },
  { label: 'درباره ما', to: '/about' },
]

function NavItem({ item }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const dropdownRef = useRef(null)
  const closeTimer = useRef(null)

  const openMenu = () => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }

  const scheduleClose = (e) => {
    // If mouse moves into the dropdown panel or back into the trigger, don't close
    const going = e.relatedTarget
    if (
      (ref.current && ref.current.contains(going)) ||
      (dropdownRef.current && dropdownRef.current.contains(going))
    ) return
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      clearTimeout(closeTimer.current)
    }
  }, [])

  if (!item.sub) {
    const cls =
      'text-text-muted hover:text-neon-cyan transition-colors duration-200 text-xs font-dana cursor-pointer whitespace-nowrap px-1'
    return item.to ? (
      <Link to={item.to} className={cls} style={{ fontWeight: 600 }}>
        {item.label}
      </Link>
    ) : (
      <a href="#" className={cls} style={{ fontWeight: 600 }}>
        {item.label}
      </a>
    )
  }

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        className="flex items-center gap-1 text-text-muted hover:text-neon-cyan transition-colors duration-200 text-xs cursor-pointer whitespace-nowrap px-1"
        style={{ fontWeight: 600, background: 'none', border: 'none' }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {item.label}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={dropdownRef}
        className={`absolute top-full right-0 pt-2 z-50 transition-all duration-200 ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div className="w-44 rounded-xl border border-neon-cyan/10 bg-surface/95 backdrop-blur-sm shadow-xl overflow-hidden">
          {item.sub.map((s) => {
            const subCls =
              'block px-4 py-2.5 text-sm text-text-muted hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors duration-150 cursor-pointer border-b border-neon-cyan/5 last:border-0'
            return s.to ? (
              <Link key={s.label} to={s.to} className={subCls} style={{ fontWeight: 600 }}>
                {s.label}
              </Link>
            ) : (
              <a key={s.label} href="#" className={subCls} style={{ fontWeight: 600 }}>
                {s.label}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-space/90 backdrop-blur-md border-b border-neon-cyan/10 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer group" aria-label="رصد - صفحه اصلی">
          <img
            src="/assets/Logo.png"
            alt=""
            className="h-9 w-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.4))' }}
          />
          <span
            className="text-2xl font-dana text-white group-hover:text-neon-cyan transition-colors duration-200"
            style={{ fontWeight: 900, textShadow: '0 0 20px rgba(0,212,255,0.5)', letterSpacing: '0.05em' }}
          >
            رصد
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-4 font-dana">
          {menuItems.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="#funds"
            className="px-4 py-2 rounded-lg text-xs font-dana text-space bg-neon-cyan hover:bg-white transition-all duration-200 cursor-pointer shadow-neon-cyan"
            style={{ fontWeight: 900 }}
          >
            مشاهده صندوق‌ها
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 text-text-muted hover:text-neon-cyan transition-colors cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="منو"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } bg-surface/98 backdrop-blur-md border-b border-neon-cyan/10`}
      >
        <div className="px-4 py-4 flex flex-col gap-1 font-dana">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.to ? (
                <Link
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 px-2 text-text-muted hover:text-neon-cyan transition-colors duration-150 text-sm border-b border-neon-cyan/5 cursor-pointer"
                  style={{ fontWeight: 600 }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  href="#"
                  className="block py-3 px-2 text-text-muted hover:text-neon-cyan transition-colors duration-150 text-sm border-b border-neon-cyan/5 cursor-pointer"
                  style={{ fontWeight: 600 }}
                >
                  {item.label}
                </a>
              )}
              {item.sub && (
                <div className="pr-4">
                  {item.sub.map((s) => {
                    const mCls =
                      'block py-2 px-2 text-xs text-text-muted/70 hover:text-neon-cyan transition-colors duration-150 cursor-pointer'
                    return s.to ? (
                      <Link key={s.label} to={s.to} onClick={() => setMobileOpen(false)} className={mCls} style={{ fontWeight: 600 }}>
                        – {s.label}
                      </Link>
                    ) : (
                      <a key={s.label} href="#" className={mCls} style={{ fontWeight: 600 }}>
                        – {s.label}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
          <a
            href="#funds"
            className="mt-4 w-full py-3 rounded-lg text-center text-sm font-dana text-space bg-neon-cyan cursor-pointer"
            style={{ fontWeight: 900 }}
          >
            مشاهده صندوق‌ها
          </a>
        </div>
      </div>
    </header>
  )
}
