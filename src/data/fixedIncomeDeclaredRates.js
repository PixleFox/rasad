import csvText from './fixed-income-declared-rates.csv?raw'

const HEADERS = {
  investmentMethod: 'شیوه سرمایه‌گذاری',
  updatedAt: 'تاریخ به‌روز رسانی',
  declaredRate: 'نرخ اعلامی',
  oneYearReturn: 'بازده یک ساله',
  netAsset: 'کل ارزش خالص دارایی‌ها',
  symbol: 'نماد',
  name: 'نام صندوق',
  website: 'آدرس سایت',
  contactStatus: 'وضعیت تماس',
}

const parseCsv = (text) => {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    const next = text[i + 1]

    if (ch === '"' && quoted && next === '"') {
      value += '"'
      i += 1
    } else if (ch === '"') {
      quoted = !quoted
    } else if (ch === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else {
      value += ch
    }
  }

  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }

  return rows
}

const normalizeHeader = (value) => String(value || '').replace(/^\uFEFF/, '').trim()
const parseNumber = (value) => {
  const clean = String(value || '').replace(/,/g, '').replace(/%/g, '').trim()
  if (!clean || clean === '----') return null
  const num = Number(clean)
  return Number.isFinite(num) ? num : null
}

const [headerRow = [], ...dataRows] = parseCsv(csvText)
const headerIndex = new Map(headerRow.map((header, index) => [normalizeHeader(header), index]))
const get = (row, header) => row[headerIndex.get(header)]?.trim() || ''

export const fixedIncomeDeclaredRates = dataRows
  .filter((row) => get(row, HEADERS.name))
  .map((row, index) => {
    const symbol = get(row, HEADERS.symbol)
    return {
      id: `${get(row, HEADERS.name)}-${index}`,
      investmentMethod: get(row, HEADERS.investmentMethod),
      updatedAt: get(row, HEADERS.updatedAt),
      declaredRate: parseNumber(get(row, HEADERS.declaredRate)),
      oneYearReturn: parseNumber(get(row, HEADERS.oneYearReturn)),
      netAssetRial: parseNumber(get(row, HEADERS.netAsset)),
      symbol: symbol && symbol !== '----' ? symbol : null,
      name: get(row, HEADERS.name),
      website: get(row, HEADERS.website),
      contactStatus: get(row, HEADERS.contactStatus),
    }
  })
