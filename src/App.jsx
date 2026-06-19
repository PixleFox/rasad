import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { fetchFundCompare, todayISO, monthsBeforeISO } from './lib/fipiran'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Aggregate from './pages/Aggregate'
import FixedIncome from './pages/FixedIncome'
import Equity from './pages/Equity'
import Mixed from './pages/Mixed'
import Commodity from './pages/Commodity'
import Leveraged from './pages/Leveraged'
import Index from './pages/Index'
import Sector from './pages/Sector'
import Managers from './pages/Managers'
import Marketing from './pages/Marketing'
import Comparison from './pages/Comparison'
import About from './pages/About'
import Ranking from './pages/Ranking'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  // Warm the in-memory cache as soon as the app boots so all pages load instantly
  useEffect(() => {
    const today = todayISO()
    fetchFundCompare(today).catch(() => {})
    fetchFundCompare(monthsBeforeISO(today, 1)).catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-space font-dana" dir="rtl">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/aggregate" element={<Aggregate />} />
          <Route path="/funds/fixed-income" element={<FixedIncome />} />
          <Route path="/funds/equity" element={<Equity />} />
          <Route path="/funds/mixed" element={<Mixed />} />
          <Route path="/funds/commodity" element={<Commodity />} />
          <Route path="/funds/leveraged" element={<Leveraged />} />
          <Route path="/funds/index-fund" element={<Index />} />
          <Route path="/funds/sector" element={<Sector />} />
          <Route path="/managers" element={<Managers />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/compare" element={<Comparison />} />
          <Route path="/about" element={<About />} />
          <Route path="/ranking" element={<Ranking />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
