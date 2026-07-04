import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
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
import ManagerDashboard from './pages/ManagerDashboard'
import Marketing from './pages/Marketing'
import Comparison from './pages/Comparison'
import About from './pages/About'
import Ranking from './pages/Ranking'
import Triggers from './pages/Triggers'
import LiveFlow from './pages/LiveFlow'
import MarketMakerFunds from './pages/MarketMakerFunds'
import VentureFunds from './pages/VentureFunds'
import OtherFunds from './pages/OtherFunds'
import ScrollToTop from './components/ScrollToTop'
import AdminLeads from './pages/AdminLeads'
import Recommendation from './pages/Recommendation'
import Seo from './components/Seo'

function MainLayout() {
  return (
    <div className="min-h-screen bg-space pb-20 font-dana lg:pb-0" dir="rtl">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const today = todayISO()
    fetchFundCompare(today).catch(() => {})
    fetchFundCompare(monthsBeforeISO(today, 1)).catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Seo />
      <Routes>
        {/* Standalone pages — no navbar/footer */}
        <Route path="/triggers" element={<Triggers />} />

        {/* Main layout pages */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/aggregate" element={<Aggregate />} />
          <Route path="/funds/fixed-income" element={<FixedIncome />} />
          <Route path="/funds/equity" element={<Equity />} />
          <Route path="/funds/mixed" element={<Mixed />} />
          <Route path="/funds/commodity" element={<Commodity />} />
          <Route path="/funds/leveraged" element={<Leveraged />} />
          <Route path="/funds/index-fund" element={<Index />} />
          <Route path="/funds/sector" element={<Sector />} />
          <Route path="/funds/market-maker" element={<MarketMakerFunds />} />
          <Route path="/funds/venture" element={<VentureFunds />} />
          <Route path="/funds/other" element={<OtherFunds />} />
          <Route path="/live-flow" element={<LiveFlow />} />
          <Route path="/managers" element={<Managers />} />
          <Route path="/managers/:managerId" element={<ManagerDashboard />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/compare" element={<Comparison />} />
          <Route path="/about" element={<About />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/recommendation" element={<Recommendation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
