import { useEffect, useMemo, useState } from 'react'
import { fetchTsetmcQuality } from '../lib/fipiran'

export function useMarketBubbles(rows) {
  const [prices, setPrices] = useState({})
  const codes = useMemo(
    () => rows.filter((row) => row.isETF && row.insCode).map((row) => row.insCode).sort().join(','),
    [rows]
  )

  useEffect(() => {
    if (!codes) return
    let cancelled = false
    const insCodes = codes.split(',')
    Promise.all(insCodes.map(async (code) => {
      try { return [code, await fetchTsetmcQuality(code)] } catch { return [code, null] }
    })).then((entries) => {
      if (!cancelled) setPrices((current) => ({ ...current, ...Object.fromEntries(entries) }))
    })
    return () => { cancelled = true }
  }, [codes])

  return useMemo(() => rows.map((row) => {
    if (!row.isETF || !row.insCode) return { ...row, marketBubble: null, marketBubbleLoading: false }
    const market = prices[row.insCode]
    return {
      ...row,
      marketBubble: market?.bubblePct ?? null,
      marketPrice: market?.pLastTrade ?? null,
      marketRedemptionNav: market?.pRedTran ?? null,
      marketBubbleLoading: !Object.hasOwn(prices, row.insCode),
    }
  }), [rows, prices])
}
