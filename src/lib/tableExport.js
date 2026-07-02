const CSV_DANGEROUS_START = /^[=+\-@\t\r]/

const cleanFileName = (value) =>
  String(value || 'table')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'table'

const csvCell = (value) => {
  if (value == null) return ''
  const text = String(value).replace(/\r?\n|\r/g, ' ').trim()
  const safeText = CSV_DANGEROUS_START.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportRowsToCsv({ columns, rows, fileName = 'table' }) {
  const header = columns.map((col) => csvCell(col.label))
  const body = rows.map((row, rowIndex) =>
    columns.map((col) => csvCell(col.exportValue(row, rowIndex)))
  )
  const csv = [header, ...body].map((line) => line.join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${cleanFileName(fileName)}.csv`)
}
