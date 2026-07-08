import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronLeft,
  ClipboardCheck,
  Download,
  Gem,
  Landmark,
  LoaderCircle,
  RotateCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react'
import { getDimensions, getRiskProfile, riskQuestions } from '../data/riskAssessment'
import { getRiskRecommendation } from '../data/riskRecommendations'
import RiskSeoContent from '../components/RiskSeoContent'
import { isValidIranianMobile, normalizePhone } from '../lib/exportLeads'
import { enrichFunds, faNum } from '../lib/fipiran'
import { exportRiskReport } from '../lib/riskPdf'
import { useRangeFunds } from '../hooks/useRangeFunds'

const steps = [
  { icon: ClipboardCheck, title: 'شناخت ریسک‌پذیری', text: 'واکنش شما در موقعیت‌های واقعی بازار' },
  { icon: BrainCircuit, title: 'تحلیل رفتاری', text: 'بررسی الگوهای تصمیم‌گیری و سوگیری‌ها' },
  { icon: ShieldCheck, title: 'نیمرخ اختصاصی', text: 'نتیجه‌ای روشن، شخصی و قابل استفاده' },
]

const genderOptions = ['زن', 'مرد', 'ترجیح می‌دهم نگویم']

function Intro({ onStart }) {
  return (
    <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-neon-green/30 bg-neon-green/10 text-neon-green shadow-[0_0_30px_rgba(0,255,157,0.18)]"><Sparkles size={30} /></div>
        <span className="text-xs text-neon-green" style={{ fontWeight: 800 }}>پیشنهاد اختصاصی رصد</span>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl leading-relaxed text-white sm:text-5xl sm:leading-relaxed" style={{ fontWeight: 900 }}>
          تست ریسک پذیری و آزمون ریسک سنجی سرمایه‌گذاری
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-muted sm:text-base">
          با آزمون ریسک پذیری رصد، تیپ سرمایه‌گذاری خود را بشناسید و بر اساس داده‌های روز صندوق‌ها، پیشنهاد متناسب با سطح ریسک خود دریافت کنید.
        </p>
        <div className="mt-9 grid gap-px overflow-hidden rounded-lg border border-neon-cyan/10 bg-neon-cyan/10 text-right sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => <div key={title} className="bg-space/95 p-5"><Icon size={21} className="mb-3 text-neon-cyan" /><h2 className="text-sm text-white" style={{ fontWeight: 900 }}>{title}</h2><p className="mt-2 text-xs leading-6 text-text-muted">{text}</p></div>)}
        </div>
        <button onClick={onStart} className="group mx-auto mt-8 flex h-12 items-center gap-3 rounded-lg bg-neon-green px-6 text-sm text-space shadow-[0_0_28px_rgba(0,255,157,0.25)] transition-all hover:-translate-y-0.5 hover:bg-white" style={{ fontWeight: 900 }}>
          شروع تست ریسک سنجی<ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        </button>
        <p className="mt-4 text-[0.65rem] text-text-muted/70">نتیجه جنبه آموزشی دارد و جایگزین مشاوره مالی دارای مجوز نیست.</p>
      </div>
      <RiskSeoContent onStart={onStart} />
    </motion.div>
  )
}

function PersonalInfo({ value, onChange, onContinue }) {
  const [touched, setTouched] = useState(false)
  const valid = value.name.trim().length >= 2 && isValidIranianMobile(value.phone) && Number(value.age) >= 18 && Number(value.age) <= 100 && value.gender && value.consent
  const submit = (event) => { event.preventDefault(); setTouched(true); if (valid) onContinue() }
  const inputClass = 'h-12 w-full rounded-lg border border-neon-cyan/15 bg-space/70 px-3 text-sm text-white outline-none transition-colors placeholder:text-text-muted/50 focus:border-neon-cyan/60'

  return (
    <motion.form key="personal" onSubmit={submit} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mx-auto max-w-xl">
      <div className="mb-7 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-lg bg-neon-cyan/10 text-neon-cyan"><UserRound size={21} /></span><div><span className="text-[0.65rem] text-neon-cyan">مرحله اول</span><h1 className="text-2xl text-white" style={{ fontWeight: 900 }}>اول کمی از شما بدانیم</h1></div></div>
      <div className="grid gap-4 rounded-xl border border-neon-cyan/10 bg-surface/45 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs text-text-muted">نام و نام خانوادگی</span><input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} className={inputClass} placeholder="نام شما" /></label>
        <label><span className="mb-1.5 block text-xs text-text-muted">شماره موبایل</span><input inputMode="numeric" dir="ltr" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} className={`${inputClass} text-left`} placeholder="09121234567" /></label>
        <label><span className="mb-1.5 block text-xs text-text-muted">سن</span><input type="number" inputMode="numeric" min="18" max="100" dir="ltr" value={value.age} onChange={(e) => onChange({ ...value, age: e.target.value })} className={`${inputClass} text-left`} placeholder="مثلاً ۳۲" /></label>
        <fieldset className="sm:col-span-2"><legend className="mb-2 text-xs text-text-muted">جنسیت</legend><div className="grid grid-cols-3 gap-2">{genderOptions.map((gender) => <button key={gender} type="button" onClick={() => onChange({ ...value, gender })} className={`min-h-11 rounded-lg border px-2 text-xs transition-colors ${value.gender === gender ? 'border-neon-cyan bg-neon-cyan/12 text-neon-cyan' : 'border-white/10 bg-space/50 text-text-muted hover:border-neon-cyan/30'}`} style={{ fontWeight: 700 }}>{gender}</button>)}</div></fieldset>
        <label className="flex items-start gap-2 sm:col-span-2"><input type="checkbox" checked={value.consent} onChange={(e) => onChange({ ...value, consent: e.target.checked })} className="mt-1 accent-cyan-400" /><span className="text-[0.68rem] leading-5 text-text-muted">با ذخیره اطلاعات و پاسخ‌ها برای تهیه نتیجه اختصاصی و بهبود خدمات رصد موافقم.</span></label>
      </div>
      {touched && !valid && <p className="mt-3 text-xs text-neon-pink">لطفاً نام، موبایل معتبر، سن، جنسیت و رضایت ذخیره اطلاعات را کامل کنید.</p>}
      <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neon-cyan text-space" style={{ fontWeight: 900 }}>ورود به آزمون<ChevronLeft size={18} /></button>
    </motion.form>
  )
}

function Quiz({ index, answers, onAnswer, onNext, onBack }) {
  const question = riskQuestions[index]
  const selected = answers[index]
  return (
    <motion.div key={`question-${index}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="mx-auto max-w-3xl">
      <div className="mb-7">
        <div className="mb-3 flex items-center justify-between text-xs"><span className="text-neon-cyan">سؤال {index + 1} از {riskQuestions.length}</span><span className="text-text-muted">{Math.round(((index + (selected ? 1 : 0)) / riskQuestions.length) * 100)}٪</span></div>
        <div className="h-1 overflow-hidden rounded-full bg-white/5"><motion.div className="h-full rounded-full bg-neon-cyan" animate={{ width: `${((index + (selected ? 1 : 0)) / riskQuestions.length) * 100}%` }} /></div>
      </div>
      <span className="text-[0.65rem] text-neon-green" style={{ fontWeight: 800 }}>موقعیت {String(index + 1).padStart(2, '0')}</span>
      <h1 className="mt-2 text-2xl text-white sm:text-3xl" style={{ fontWeight: 900 }}>{question.title}</h1>
      <p className="mt-3 text-sm leading-7 text-text-muted sm:text-base">{question.scenario}</p>
      <div className="mt-6 grid gap-2.5">
        {question.options.map((option, optionIndex) => {
          const score = optionIndex + 1
          const active = selected === score
          return <button key={option} type="button" onClick={() => onAnswer(score)} className={`group flex min-h-16 items-center gap-3 rounded-lg border px-4 py-3 text-right transition-all ${active ? 'border-neon-green bg-neon-green/10 shadow-[0_0_18px_rgba(0,255,157,0.1)]' : 'border-white/8 bg-surface/45 hover:border-neon-cyan/35 hover:bg-neon-cyan/5'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs ${active ? 'border-neon-green bg-neon-green text-space' : 'border-white/15 text-text-muted group-hover:border-neon-cyan/50'}`}>{active ? <Check size={16} /> : ['الف', 'ب', 'ج', 'د'][optionIndex]}</span><span className={`text-xs leading-6 sm:text-sm ${active ? 'text-white' : 'text-text-muted'}`} style={{ fontWeight: active ? 700 : 600 }}>{option}</span></button>
        })}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3"><button type="button" onClick={onBack} className="flex h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-xs text-text-muted"><ArrowRight size={16} />قبلی</button><button type="button" disabled={!selected} onClick={onNext} className="flex h-11 items-center gap-2 rounded-lg bg-neon-green px-5 text-xs text-space disabled:cursor-not-allowed disabled:opacity-30" style={{ fontWeight: 900 }}>{index === riskQuestions.length - 1 ? 'دیدن نتیجه من' : 'سؤال بعد'}<ArrowLeft size={16} /></button></div>
    </motion.div>
  )
}

function DimensionBar({ label, value, color }) {
  return <div><div className="mb-2 flex items-center justify-between text-xs"><span className="text-text-muted">{label}</span><span style={{ color, fontWeight: 900 }}>{value}٪</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: color }} /></div></div>
}

const allocationMeta = {
  fixedIncome: { title: 'درآمد ثابت', icon: Landmark, color: '#00D4FF' },
  commodity: { title: 'کالایی', icon: Gem, color: '#FACC15' },
  leveraged: { title: 'اهرمی', icon: Rocket, color: '#FF3B6B' },
}

function FundPick({ type, fund, loading }) {
  const meta = allocationMeta[type]
  const Icon = meta.icon
  return <div className="relative overflow-hidden rounded-lg border border-white/10 bg-space/80 p-5">
    <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: meta.color }} />
    <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs" style={{ color: meta.color }}><Icon size={17} />{meta.title}</span>{fund && <span className="rounded-full bg-white/5 px-2 py-1 text-[0.62rem] text-text-muted">شاخص رصد {faNum(fund.rasadScore)}</span>}</div>
    {loading ? <div className="mt-6 flex items-center gap-2 text-xs text-text-muted"><LoaderCircle size={16} className="animate-spin" />در حال انتخاب از داده امروز</div> : fund ? <><h4 className="mt-5 text-base leading-7 text-white" style={{ fontWeight: 900 }}>{fund.name}</h4><p className="mt-1 text-xs text-text-muted">{fund.symbol ? `نماد ${fund.symbol}` : fund.manager}</p></> : <p className="mt-5 text-xs leading-6 text-text-muted">در داده امروز گزینه واجد شرایطی پیدا نشد.</p>}
  </div>
}

function Result({ personal, score, profile, dimensions, saveState, onRestart, picks, picksLoading }) {
  const reportRef = useRef(null)
  const [pdfState, setPdfState] = useState('idle')
  const recommendation = getRiskRecommendation(profile.code)
  const salutation = personal.gender === 'زن' ? `سرکار خانم ${personal.name}` : personal.gender === 'مرد' ? `جناب آقای ${personal.name}` : `${personal.name} عزیز`

  const downloadPdf = async () => {
    setPdfState('working')
    try { await exportRiskReport(reportRef.current, personal.name); setPdfState('done') }
    catch { setPdfState('error') }
  }

  return <motion.div key="result" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
    <div className="mb-7 flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div><span className="text-xs text-neon-green">گزارش اختصاصی رصد</span><h1 className="mt-2 text-3xl text-white sm:text-4xl" style={{ fontWeight: 900 }}>{personal.name}، این نقشه سرمایه گذاری توست</h1></div>
      <button onClick={downloadPdf} disabled={pdfState === 'working'} className="flex h-12 items-center gap-2 rounded-lg bg-white px-5 text-xs text-space shadow-[0_0_28px_rgba(255,255,255,.16)] transition-transform hover:-translate-y-0.5 disabled:opacity-60" style={{ fontWeight: 900 }}>{pdfState === 'working' ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}{pdfState === 'working' ? 'در حال ساخت PDF' : 'دریافت PDF اختصاصی'}</button>
    </div>

    <div ref={reportRef} className="space-y-4">
      <section data-pdf-section className="overflow-hidden rounded-xl border border-white/10 bg-[#08101d] p-5 sm:p-8">
        <div className="flex flex-col items-center gap-7 sm:flex-row sm:text-right">
          <div className="grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${profile.color} ${((score - 12) / 36) * 100}%, rgba(255,255,255,.06) 0)` }}><div className="grid h-28 w-28 place-items-center rounded-full bg-[#08101d] text-center"><div><strong className="block text-4xl" style={{ color: profile.color }}>{faNum(score)}</strong><span className="text-[0.65rem] text-text-muted">از ۴۸</span></div></div></div>
          <div className="flex-1 text-center sm:text-right"><p className="text-xs" style={{ color: profile.color }}>{profile.code} · {profile.short}</p><h2 className="mt-2 text-3xl text-white sm:text-4xl" style={{ fontWeight: 900 }}>{profile.title}</h2><p className="mt-4 text-sm leading-8 text-text-primary">{profile.description}</p></div>
        </div>
        <div className="mt-6 grid gap-4 border-t border-white/8 pt-6 sm:grid-cols-3"><DimensionBar label="کنترل هیجان" value={dimensions.volatility} color="#00D4FF" /><DimensionBar label="استقلال تصمیم" value={dimensions.independence} color="#A78BFA" /><DimensionBar label="انضباط شناختی" value={dimensions.discipline} color="#00FF9D" /></div>
      </section>

      <section data-pdf-section className="rounded-xl border border-white/10 bg-[#08101d] p-5 sm:p-8"><p className="text-sm text-neon-cyan" style={{ fontWeight: 900 }}>{salutation}، با سلام و احترام</p>{recommendation.intro.map((paragraph) => <p key={paragraph.slice(0, 30)} className="mt-4 text-sm leading-8 text-text-primary">{paragraph}</p>)}</section>

      <section data-pdf-section className="rounded-xl border border-white/10 bg-[#08101d] p-5 sm:p-8"><div className="mb-5 flex items-center gap-3"><BarChart3 className="text-neon-green" /><div><p className="text-xs text-neon-green">ترکیب پیشنهادی</p><h3 className="mt-1 text-xl text-white" style={{ fontWeight: 900 }}>تخصیص دارایی متناسب با تیپ شما</h3></div></div><div className="grid gap-3 sm:grid-cols-3">{Object.entries(recommendation.allocations).map(([key, item]) => { const meta = allocationMeta[key]; const Icon = meta.icon; return <div key={key} className="rounded-lg border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between"><Icon size={19} style={{ color: meta.color }} /><strong className="text-2xl" style={{ color: meta.color }}>{faNum(item.percent)}٪</strong></div><p className="mt-3 text-xs text-white">{meta.title}</p></div> })}</div></section>

      {Object.entries(recommendation.allocations).map(([key, item]) => <section key={key} data-pdf-section className="rounded-xl border border-white/10 bg-[#08101d] p-5 sm:p-7"><div className="mb-3 flex items-center gap-2" style={{ color: allocationMeta[key].color }}>{(() => { const Icon = allocationMeta[key].icon; return <Icon size={18} /> })()}<h3 className="text-sm" style={{ fontWeight: 900 }}>{allocationMeta[key].title} · {faNum(item.percent)}٪</h3></div><p className="text-sm leading-8 text-text-primary">{item.text}</p></section>)}

      <section data-pdf-section className="rounded-xl border border-neon-cyan/15 bg-[#08101d] p-5 sm:p-8"><div className="flex items-center gap-2 text-neon-cyan"><Sparkles size={19} /><h3 className="text-lg text-white" style={{ fontWeight: 900 }}>سه انتخاب برتر امروز بر اساس شاخص رصد</h3></div><p className="mt-2 text-xs leading-6 text-text-muted">در هر دسته، صندوقی نمایش داده می شود که در تازه ترین داده موجود بالاترین شاخص رصد را دارد.</p><div className="mt-5 grid gap-3 md:grid-cols-3"><FundPick type="fixedIncome" fund={picks.fixedIncome} loading={picksLoading} /><FundPick type="commodity" fund={picks.commodity} loading={picksLoading} /><FundPick type="leveraged" fund={picks.leveraged} loading={picksLoading} /></div></section>

      <section data-pdf-section className="rounded-xl border border-amber-300/15 bg-[#08101d] p-5 sm:p-8"><div className="flex items-center gap-2 text-amber-300"><ShieldCheck size={19} /><h3 className="text-base text-white" style={{ fontWeight: 900 }}>بایدها و نبایدهای اختصاصی شما</h3></div><p className="mt-4 text-sm leading-8 text-text-primary">{recommendation.rules}</p><div className="mt-7 border-t border-white/8 pt-5 text-sm text-white"><p>با آرزوی بهترین ها</p><p className="mt-1 text-neon-green" style={{ fontWeight: 900 }}>تیم رصد</p></div></section>
    </div>

    <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.025] p-4 sm:flex-row"><div><div className="text-xs text-text-primary" style={{ fontWeight: 800 }}>{saveState === 'saved' ? 'اطلاعات و نتیجه شما با موفقیت ذخیره شد.' : saveState === 'error' ? 'نتیجه آماده است؛ ثبت سرور موقتا انجام نشد.' : 'در حال ذخیره نتیجه...'}</div><p className="mt-1 text-[0.65rem] text-text-muted">این گزارش آموزشی است و به تنهایی دستور خرید یا فروش محسوب نمی شود.</p>{pdfState === 'error' && <p className="mt-1 text-[0.65rem] text-neon-pink">ساخت PDF انجام نشد؛ دوباره امتحان کنید.</p>}</div><button onClick={onRestart} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-text-muted hover:text-white"><RotateCcw size={15} />شروع دوباره</button></div>
  </motion.div>
}

export default function Recommendation() {
  const { funds, endDate, loading: fundsLoading } = useRangeFunds()
  const [stage, setStage] = useState('intro')
  const [personal, setPersonal] = useState({ name: '', phone: '', age: '', gender: '', consent: false })
  const [answers, setAnswers] = useState({})
  const [questionIndex, setQuestionIndex] = useState(0)
  const [saveState, setSaveState] = useState('idle')
  const score = useMemo(() => Object.values(answers).reduce((sum, value) => sum + value, 0), [answers])
  const profile = getRiskProfile(score)
  const dimensions = useMemo(() => getDimensions(answers), [answers])
  const picks = useMemo(() => {
    if (!funds.length || !endDate) return {}
    const ranked = enrichFunds(funds.filter((fund) => [4, 5, 22].includes(fund.type) && !fund.isCharity), endDate)
    const best = (type) => ranked.filter((fund) => fund.type === type).sort((a, b) => b.rasadScore - a.rasadScore)[0]
    return { fixedIncome: best(4), commodity: best(5), leveraged: best(22) }
  }, [funds, endDate])

  const finish = async () => {
    const finalScore = Object.values(answers).reduce((sum, value) => sum + value, 0)
    const finalProfile = getRiskProfile(finalScore)
    setStage('result'); setSaveState('saving'); window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const response = await fetch('/api/risk-assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: personal.name.trim(), phone: normalizePhone(personal.phone), age: Number(personal.age), gender: personal.gender, consent: personal.consent, answers: riskQuestions.map((_, index) => answers[index]), score: finalScore, profileCode: finalProfile.code, profileTitle: finalProfile.title, dimensions: getDimensions(answers) }) })
      if (!response.ok) throw new Error('save failed')
      setSaveState('saved')
    } catch { setSaveState('error') }
  }

  const nextQuestion = () => questionIndex === riskQuestions.length - 1 ? finish() : setQuestionIndex((index) => index + 1)
  const previous = () => questionIndex === 0 ? setStage('personal') : setQuestionIndex((index) => index - 1)
  const restart = () => { setStage('intro'); setAnswers({}); setQuestionIndex(0); setSaveState('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-24 pt-24 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)', backgroundSize: '54px 54px' }} />
      <motion.img src="/assets/Purple-planet.png" alt="" className="pointer-events-none absolute -left-10 top-28 hidden w-40 opacity-20 sm:block" animate={{ y: [0, -12, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <div className="relative mx-auto max-w-5xl"><AnimatePresence mode="wait">
        {stage === 'intro' && <Intro onStart={() => setStage('personal')} />}
        {stage === 'personal' && <PersonalInfo value={personal} onChange={setPersonal} onContinue={() => { setStage('quiz'); setQuestionIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
        {stage === 'quiz' && <Quiz index={questionIndex} answers={answers} onAnswer={(value) => setAnswers((current) => ({ ...current, [questionIndex]: value }))} onNext={nextQuestion} onBack={previous} />}
        {stage === 'result' && <Result personal={personal} score={score} profile={profile} dimensions={dimensions} saveState={saveState} onRestart={restart} picks={picks} picksLoading={fundsLoading} />}
      </AnimatePresence></div>
    </main>
  )
}
