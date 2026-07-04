import { useEffect, useState } from 'react'

let cachedRate = null
let inflight = null

const loadRate = () => {
  if (cachedRate) return Promise.resolve(cachedRate)
  if (!inflight) {
    inflight = fetch('/api/exchange-rate')
      .then((response) => {
        if (!response.ok) throw new Error('exchange rate unavailable')
        return response.json()
      })
      .then((data) => { cachedRate = data; return data })
      .finally(() => { inflight = null })
  }
  return inflight
}

export function useExchangeRate() {
  const [rate, setRate] = useState(cachedRate)
  useEffect(() => {
    let active = true
    loadRate().then((data) => active && setRate(data)).catch(() => {})
    return () => { active = false }
  }, [])
  return rate
}
