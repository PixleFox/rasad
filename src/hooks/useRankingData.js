import { useState, useEffect } from 'react'
import { fetchRangeReturns, todayISO, monthsBeforeISO, shiftISO, daysBetween } from '../lib/fipiran'

export function useRankingData() {
  const [startISO, setStartISO] = useState(() => monthsBeforeISO(todayISO(), 1))
  const [endISO, setEndISO]     = useState(() => todayISO())

  const [currentFunds, setCurrentFunds] = useState([])
  const [priorFunds, setPriorFunds]     = useState([])
  const [startDate, setStartDate]       = useState(null)
  const [endDate, setEndDate]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const n = daysBetween(startISO, endISO)
    const priorEndISO   = startISO
    const priorStartISO = shiftISO(startISO, -n)

    Promise.all([
      fetchRangeReturns(startISO, endISO),
      fetchRangeReturns(priorStartISO, priorEndISO),
    ])
      .then(([curr, prior]) => {
        if (cancelled) return
        setCurrentFunds(curr.funds)
        setPriorFunds(prior.funds)
        setStartDate(curr.startDate)
        setEndDate(curr.endDate)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e.message || 'خطا در دریافت داده')
        setCurrentFunds([])
        setPriorFunds([])
      })
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [startISO, endISO])

  return { currentFunds, priorFunds, startDate, endDate, loading, error, startISO, endISO, setStartISO, setEndISO }
}
