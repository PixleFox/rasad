import { useCallback, useMemo } from 'react'
import DatePickerNS from 'react-multi-date-picker'
import persianNS from 'react-date-object/calendars/persian'
import persianFaNS from 'react-date-object/locales/persian_fa'
import { dateToISO, todayISO } from '../lib/fipiran'

// CJS interop: unwrap `.default` when Vite hands back the namespace object.
const DatePicker = DatePickerNS?.default ?? DatePickerNS
const persian = persianNS?.default ?? persianNS
const persian_fa = persianFaNS?.default ?? persianFaNS

const objToISO = (d) => {
  if (!d?.isValid) return null
  return dateToISO(d.toDate())
}

const inputClass =
  'bg-surface/70 border border-neon-cyan/20 rounded-lg px-2 py-2 text-xs sm:text-sm text-text-primary font-dana cursor-pointer hover:border-neon-cyan/40 focus:border-neon-cyan/60 focus:outline-none transition-colors duration-200 w-full text-center'

export default function RangePicker({ startISO, endISO, onStart, onEnd }) {
  const startDate = useMemo(() => new Date(startISO + 'T00:00:00'), [startISO])
  const endDate = useMemo(() => new Date(endISO + 'T00:00:00'), [endISO])
  const todayDate = useMemo(() => new Date(todayISO() + 'T00:00:00'), [])

  const handleStart = useCallback((d) => {
    const iso = objToISO(d)
    if (iso && iso !== startISO) onStart(iso)
  }, [onStart, startISO])
  const handleEnd = useCallback((d) => {
    const iso = objToISO(d)
    if (iso && iso !== endISO) onEnd(iso)
  }, [onEnd, endISO])

  return (
    <div className="grid w-full grid-cols-2 items-end gap-2 sm:flex sm:w-auto sm:gap-3">
      <div className="flex min-w-0 flex-col gap-1 sm:w-32">
        <label className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
          از تاریخ
        </label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={startDate}
          maxDate={endDate}
          onChange={handleStart}
          format="YYYY/MM/DD"
          inputClass={inputClass}
          calendarPosition="bottom-right"
          className="rmdp-rasad"
          editable
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1 sm:w-32">
        <label className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
          تا تاریخ
        </label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={endDate}
          minDate={startDate}
          maxDate={todayDate}
          onChange={handleEnd}
          format="YYYY/MM/DD"
          inputClass={inputClass}
          calendarPosition="bottom-right"
          className="rmdp-rasad"
          editable
        />
      </div>
    </div>
  )
}
