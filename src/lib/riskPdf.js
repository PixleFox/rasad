import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const waitForFonts = () => document.fonts?.ready || Promise.resolve()

export async function exportRiskReport(reportElement, name) {
  if (!reportElement) throw new Error('report unavailable')
  await waitForFonts()

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  const gap = 4
  let cursorY = margin
  const sections = [...reportElement.querySelectorAll('[data-pdf-section]')]

  for (const section of sections) {
    const canvas = await html2canvas(section, {
      backgroundColor: '#08101d',
      scale: 1.6,
      useCORS: true,
      logging: false,
      windowWidth: Math.max(reportElement.scrollWidth, 900),
    })
    const imageHeight = (canvas.height * contentWidth) / canvas.width
    const maxHeight = pageHeight - margin * 2
    const renderHeight = Math.min(imageHeight, maxHeight)
    const renderWidth = imageHeight > maxHeight ? (canvas.width * renderHeight) / canvas.height : contentWidth
    if (cursorY + renderHeight > pageHeight - margin) {
      pdf.addPage()
      cursorY = margin
    }
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, cursorY, renderWidth, renderHeight, undefined, 'FAST')
    cursorY += renderHeight + gap
  }

  const safeName = name.trim().replace(/[^\u0600-\u06FFa-zA-Z0-9_-]+/g, '-') || 'report'
  pdf.save(`rasad-risk-profile-${safeName}.pdf`)
}
