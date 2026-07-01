import DatePickerNS from 'react-multi-date-picker'
import persianNS from 'react-date-object/calendars/persian'
import persianFaNS from 'react-date-object/locales/persian_fa'
import { dateToISO, todayISO } from '../lib/fipiran'

// CJS interop: unwrap `.default` when Vite hands back the namespace object.
const DatePicker = DatePickerNS?.default ?? DatePickerNS
const persian = persianNS?.default ?? persianNS
const persian_fa = persianFaNS?.default ?? persianFaNS

const objToISO = (d) => dateToISO(d.toDate())

const inputClass =
  'bg-surface/70 border border-neon-cyan/20 rounded-lg px-3 py-2 text-sm text-text-primary font-dana cursor-pointer hover:border-neon-cyan/40 focus:border-neon-cyan/60 focus:outline-none transition-colors duration-200 w-32 text-center'

export default function RangePicker({ startISO, endISO, onStart, onEnd }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
          از تاریخ
        </label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={new Date(startISO + 'T00:00:00')}
          maxDate={new Date(endISO + 'T00:00:00')}
          onChange={(d) => d && onStart(objToISO(d))}
          inputClass={inputClass}
          calendarPosition="bottom-right"
          className="rmdp-rasad"
          editable={false}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-text-muted text-xs font-dana" style={{ fontWeight: 600 }}>
          تا تاریخ
        </label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={new Date(endISO + 'T00:00:00')}
          minDate={new Date(startISO + 'T00:00:00')}
          maxDate={new Date(todayISO() + 'T00:00:00')}
          onChange={(d) => d && onEnd(objToISO(d))}
          inputClass={inputClass}
          calendarPosition="bottom-right"
          className="rmdp-rasad"
          editable={false}
        />
      </div>
    </div>
  )
}
