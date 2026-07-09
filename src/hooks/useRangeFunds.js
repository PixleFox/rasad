import { useState, useEffect } from 'react'
import { fetchRangeReturns, todayISO, monthsBeforeISO } from '../lib/fipiran'

// Shared loader for the range-based fund pages: fetches the [start, end]
// snapshot pair and exposes the enriched END funds plus range state.
export function useRangeFunds(options = {}) {
  const {
    useEtfMarketReturns = false,
    etfMarketTypes = null,
    marketPriceField = 'pDrCotVal',
  } = options
  const etfMarketTypesKey = Array.isArray(etfMarketTypes) ? etfMarketTypes.join(',') : ''
  const [startISO, setStartISO] = useState(() => monthsBeforeISO(todayISO(), 1))
  const [endISO, setEndISO] = useState(() => todayISO())
  const [funds, setFunds] = useState([])
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchRangeReturns(startISO, endISO, {
      useEtfMarketReturns,
      etfMarketTypes,
      marketPriceField,
    })
      .then((res) => {
        if (cancelled) return
        setFunds(res.funds)
        setStartDate(res.startDate)
        setEndDate(res.endDate)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message || 'خطا در دریافت داده')
        setFunds([])
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [startISO, endISO, useEtfMarketReturns, etfMarketTypesKey, marketPriceField])

  return { funds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO }
}
