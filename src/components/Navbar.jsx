import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronDown,
  CircleX,
  FolderSearch,
  Home,
  Landmark,
  Menu,
  Search,
  Users,
  X,
} from 'lucide-react'
import { computeManagers, fetchFundCompare, todayISO } from '../lib/fipiran'

const menuItems = [
  {
    label: 'اطلاعات صندوق‌ها',
    sub: [
      { label: 'درآمد ثابت', to: '/funds/fixed-income', keywords: 'نرخ اعلامی fixed income' },
      { label: 'سهامی', to: '/funds/equity', keywords: 'equity سهام' },
      { label: 'مختلط', to: '/funds/mixed', keywords: 'mixed' },
      { label: 'کالایی', to: '/funds/commodity', keywords: 'طلا کالا commodity' },
      { label: 'اهرمی', to: '/funds/leveraged', keywords: 'leveraged' },
      { label: 'شاخصی', to: '/funds/index-fund', keywords: 'index شاخص' },
      { label: 'بخشی', to: '/funds/sector', keywords: 'sector' },
      { label: 'بازارگردانی', to: '/funds/market-maker', keywords: 'market maker' },
      { label: 'جسورانه', to: '/funds/venture', keywords: 'venture vc' },
      { label: 'سایر', to: '/funds/other', keywords: 'other' },
    ],
  },
  { label: 'اطلاعات تجمیعی صندوق‌ها', to: '/aggregate', keywords: 'aggregate جریان پول' },
  { label: 'جریان پول زنده', to: '/live-flow', keywords: 'live flow tsetmc' },
  { label: 'مدیران صندوق‌ها', to: '/managers', keywords: 'مدیر مدیران شرکت' },
  { label: 'سامانه مقایسه', to: '/compare', keywords: 'مقایسه compare' },
  { label: 'رتبه‌بندی صندوق‌ها', to: '/ranking', keywords: 'ranking رتبه بازدهی دارایی' },
  { label: 'مارکتینگ صندوق‌ها', to: '/marketing', keywords: 'marketing بازاریابی کیفیت تابلو' },
  { label: 'درباره ما', to: '/about', keywords: 'about تماس' },
]

const quickNav = [
  { label: 'خانه', to: '/', icon: Home },
  { label: 'صندوق‌ها', to: '/funds/fixed-income', icon: Landmark },
  { label: 'جستجو', action: 'search', icon: Search },
  { label: 'تجمیع', to: '/aggregate', icon: BarChart3 },
  { label: 'مدیران', to: '/managers', icon: Users },
]

const fundRoutes = {
  4: '/funds/fixed-income', 5: '/funds/commodity', 6: '/funds/equity',
  7: '/funds/mixed', 11: '/funds/market-maker', 12: '/funds/venture',
  21: '/funds/sector', 22: '/funds/leveraged', 23: '/funds/index-fund',
}

const flattenItems = (items) =>
  items.flatMap((item) => item.sub ? item.sub.map((sub) => ({ ...sub, group: item.label })) : [item])

const mobileSections = [
  { title: 'صندوق‌ها', items: menuItems[0].sub },
  { title: 'ابزارها و صفحات', items: menuItems.slice(1) },
]

function SearchBox({ funds, compact = false, autoFocus = false, onNavigate }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const ref = useRef(null)
  const pages = useMemo(() => flattenItems(menuItems), [])
  const managers = useMemo(() => computeManagers(funds, todayISO()), [funds])

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('fa')
    if (!q) return pages.slice(0, compact ? 6 : 5).map((item) => ({ ...item, kind: 'page' }))

    const fundMatches = funds
      .filter((fund) => `${fund.name} ${fund.symbol || ''} ${fund.manager} ${fund.typeLabel}`.toLocaleLowerCase('fa').includes(q))
      .slice(0, 5)
      .map((fund) => ({ ...fund, kind: 'fund' }))
    const managerMatches = managers
      .filter((manager) => `${manager.name} ${manager.core}`.toLocaleLowerCase('fa').includes(q))
      .slice(0, 3)
      .map((manager) => ({ ...manager, kind: 'manager' }))
    const pageMatches = pages
      .filter((page) => `${page.label} ${page.group || ''} ${page.keywords || ''}`.toLocaleLowerCase('fa').includes(q))
      .slice(0, 3)
      .map((page) => ({ ...page, kind: 'page' }))
    return [...fundMatches, ...managerMatches, ...pageMatches].slice(0, 9)
  }, [query, funds, managers, pages, compact])

  useEffect(() => {
    const close = (event) => ref.current && !ref.current.contains(event.target) && setFocused(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const go = (result) => {
    if (!result) return
    if (result.kind === 'manager') navigate(`/managers/${encodeURIComponent(result.core)}`)
    else if (result.kind === 'fund') {
      const route = fundRoutes[result.type] || '/funds/other'
      navigate(`${route}?q=${encodeURIComponent(result.symbol || result.name)}`)
    } else navigate(result.to)
    setQuery('')
    setFocused(false)
    onNavigate?.()
  }

  const resultMeta = (result) => {
    if (result.kind === 'fund') return `${result.symbol || 'بدون نماد'} · ${result.manager || result.typeLabel}`
    if (result.kind === 'manager') return `${result.fundCount} صندوق تحت مدیریت`
    return result.group || 'صفحه'
  }

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={(event) => { event.preventDefault(); go(results[0]) }} role="search">
        <label className="relative block">
          <Search aria-hidden="true" size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            autoFocus={autoFocus}
            value={query}
            onFocus={() => setFocused(true)}
            onChange={(event) => { setQuery(event.target.value); setFocused(true) }}
            placeholder="نام، نماد یا مدیر صندوق..."
            className={`w-full rounded-xl border border-neon-cyan/15 bg-surface/80 py-3 pr-10 pl-3 text-sm font-dana text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-neon-cyan/50 ${compact ? 'h-12' : 'h-10'}`}
            style={{ fontWeight: 600 }}
          />
        </label>
      </form>

      {focused && (
        <div className="absolute right-0 left-0 top-full z-50 mt-2 max-h-[65vh] overflow-y-auto rounded-xl border border-neon-cyan/15 bg-surface shadow-xl">
          {results.length ? results.map((result, index) => {
            const ResultIcon = result.kind === 'fund' ? Landmark : result.kind === 'manager' ? Building2 : FolderSearch
            return (
              <button
                key={`${result.kind}-${result.regNo || result.id || result.to || index}`}
                type="button"
                onClick={() => go(result)}
                className="flex w-full items-center gap-3 border-b border-neon-cyan/5 px-3 py-3 text-right transition-colors last:border-0 hover:bg-neon-cyan/5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon-cyan/10 text-neon-cyan"><ResultIcon size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-text-primary" style={{ fontWeight: 800 }}>{result.name || result.label}</span>
                  <span className="mt-0.5 block truncate text-[0.68rem] text-text-muted" style={{ fontWeight: 600 }}>{resultMeta(result)}</span>
                </span>
                <span className="rounded-md bg-white/5 px-1.5 py-1 text-[0.6rem] text-text-muted">{result.kind === 'fund' ? 'صندوق' : result.kind === 'manager' ? 'مدیر' : 'صفحه'}</span>
              </button>
            )
          }) : (
            <div className="flex flex-col items-center gap-2 px-4 py-7 text-text-muted">
              <CircleX size={24} />
              <span className="text-xs font-dana" style={{ fontWeight: 600 }}>نتیجه‌ای پیدا نشد.</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DesktopNavItem({ item }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (!item.sub) return <Link to={item.to} className="whitespace-nowrap text-[0.65rem] font-dana text-text-muted transition-colors hover:text-neon-cyan xl:text-[0.7rem]" style={{ fontWeight: 700 }}>{item.label}</Link>
  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)}>
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 whitespace-nowrap text-[0.65rem] font-dana text-text-muted hover:text-neon-cyan xl:text-[0.7rem]" style={{ fontWeight: 700 }}>
        {item.label}<ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`absolute right-0 top-full z-50 pt-3 transition-all ${open ? 'opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} onMouseLeave={() => setOpen(false)}>
        <div className="grid w-72 grid-cols-2 gap-1 rounded-xl border border-neon-cyan/10 bg-surface p-2 shadow-xl">
          {item.sub.map((sub) => <Link key={sub.label} to={sub.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-text-muted hover:bg-neon-cyan/5 hover:text-neon-cyan" style={{ fontWeight: 700 }}>{sub.label}</Link>)}
        </div>
      </div>
    </div>
  )
}

function MobileBottomNav({ onSearch }) {
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 border-t border-neon-cyan/10 bg-space/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {quickNav.map((item) => {
          const Icon = item.icon
          const active = item.to && (location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to)))
          const classes = `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] font-dana transition-colors ${active || item.action === 'search' ? 'text-neon-cyan' : 'text-text-muted'}`
          return item.action === 'search'
            ? <button key={item.label} type="button" onClick={onSearch} className={classes} style={{ fontWeight: 800 }}><Icon size={21} strokeWidth={2.2} />{item.label}</button>
            : <Link key={item.label} to={item.to} className={classes} style={{ fontWeight: 800 }}><Icon size={21} strokeWidth={2.2} />{item.label}</Link>
        })}
      </div>
    </nav>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [funds, setFunds] = useState([])
  const location = useLocation()

  useEffect(() => {
    fetchFundCompare(todayISO()).then((snapshot) => setFunds(snapshot.funds)).catch(() => {})
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])
  useEffect(() => { setMobileOpen(false); setSearchOpen(false) }, [location.pathname])

  return (
    <>
      <header className={`fixed top-0 right-0 left-0 z-50 transition-all ${scrolled ? 'border-b border-neon-cyan/10 bg-space/90 shadow-lg backdrop-blur-xl' : 'bg-space/55 backdrop-blur-md lg:bg-transparent'}`}>
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="رصد - صفحه اصلی">
            <img src="/assets/Logo.png" alt="" className="h-9 w-auto object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.4))' }} />
            <span className="text-xl text-white sm:text-2xl" style={{ fontWeight: 900 }}>رصد</span>
          </Link>
          <div className="hidden flex-1 items-center justify-center gap-2 lg:flex xl:gap-3">{menuItems.map((item) => <DesktopNavItem key={item.label} item={item} />)}</div>
          <div className="hidden w-56 shrink-0 xl:w-64 lg:block"><SearchBox funds={funds} /></div>
          <div className="flex items-center gap-1 lg:hidden">
            <button type="button" onClick={() => setSearchOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-neon-cyan/10 bg-surface/70 text-neon-cyan" aria-label="جستجو"><Search size={21} /></button>
            <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="grid h-11 w-11 place-items-center rounded-xl border border-neon-cyan/10 bg-surface/70 text-text-primary" aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
          </div>
        </nav>
        <div className={`overflow-hidden border-t border-neon-cyan/10 bg-space/96 transition-all lg:hidden ${mobileOpen ? 'max-h-[calc(100vh-4rem)] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto px-4 pb-24 pt-3">
            <SearchBox funds={funds} compact onNavigate={() => setMobileOpen(false)} />
            <div className="mt-3 divide-y divide-neon-cyan/10 rounded-lg border border-neon-cyan/10 bg-surface/35 px-3">
              {mobileSections.map((section) => (
                <section key={section.title} className="py-2.5">
                  <h2 className="mb-1 px-1 text-[0.65rem] text-text-muted" style={{ fontWeight: 700 }}>{section.title}</h2>
                  <div className="grid grid-cols-2 gap-x-2">
                    {section.items.map((item) => (
                      <Link key={item.label} to={item.to} className="flex min-h-9 items-center justify-between gap-1 border-b border-white/[0.04] px-1 py-1.5 text-xs text-text-primary" style={{ fontWeight: 700 }}>
                        <span className="truncate">{item.label}</span>
                        <ChevronLeft size={13} className="shrink-0 text-text-muted/50" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </header>
      {searchOpen && <div className="fixed inset-0 z-[60] bg-space/95 px-4 pt-20 backdrop-blur-xl lg:hidden"><button type="button" onClick={() => setSearchOpen(false)} className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-xl border border-neon-cyan/10 bg-surface/80 text-text-primary" aria-label="بستن جستجو"><X size={22} /></button><SearchBox funds={funds} compact autoFocus onNavigate={() => setSearchOpen(false)} /></div>}
      <MobileBottomNav onSearch={() => setSearchOpen(true)} />
    </>
  )
}
