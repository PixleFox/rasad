const PHONE_KEY = 'rasad_export_phone'
const PENDING_KEY = 'rasad_pending_exports'

const faToEn = (value) => String(value || '')
  .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
  .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))

export const normalizePhone = (value) => {
  let phone = faToEn(value).replace(/\D/g, '')
  if (phone.startsWith('98')) phone = `0${phone.slice(2)}`
  if (phone.startsWith('9') && phone.length === 10) phone = `0${phone}`
  return phone
}

export const isValidIranianMobile = (value) => /^09\d{9}$/.test(normalizePhone(value))

export const getSavedExportPhone = () => localStorage.getItem(PHONE_KEY) || ''

export const saveExportPhone = (value) => {
  const phone = normalizePhone(value)
  localStorage.setItem(PHONE_KEY, phone)
  return phone
}

const queueLocally = (payload) => {
  const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
  localStorage.setItem(PENDING_KEY, JSON.stringify([...pending.slice(-49), payload]))
}

export async function recordExportLead({ phone, page, fileName }) {
  const payload = {
    p_phone: normalizePhone(phone),
    p_page: page,
    p_file_name: fileName,
  }
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    queueLocally({ ...payload, created_at: new Date().toISOString() })
    return { queued: true }
  }

  const response = await fetch(`${url}/rest/v1/rpc/register_export`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('ثبت شماره انجام نشد')
  return { queued: false }
}
