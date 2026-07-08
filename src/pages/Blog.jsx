import { Link } from 'react-router-dom'
import { BookOpen, Clock, SearchCheck, Sparkles } from 'lucide-react'
import { blogCategories, blogPosts } from '../data/blogPosts'

export default function Blog() {
  const featured = blogPosts[0]
  const rest = blogPosts.slice(1)

  return (
    <main className="relative min-h-screen overflow-hidden bg-space pt-24 pb-20 font-dana" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-12 right-1/4 h-96 w-96 rounded-full bg-neon-cyan/10 blur-3xl" />
        <div className="absolute bottom-24 left-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-1 text-xs text-neon-cyan" style={{ fontWeight: 800 }}>
            <Sparkles size={14} />
            راهنمای سرمایه‌گذاری با داده‌های رصد
          </div>
          <h1 className="text-3xl leading-tight text-white sm:text-5xl" style={{ fontWeight: 900 }}>
            وبلاگ رصد؛ راهنمای انتخاب و مقایسه صندوق‌های سرمایه‌گذاری
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-text-muted sm:text-base" style={{ fontWeight: 600 }}>
            رصد یک ابزار مقایسه صندوق‌های سرمایه‌گذاری در ایران است. در وبلاگ رصد، مفاهیم مهم صندوق‌ها را ساده، کاربردی و همراه با مسیر بررسی داده‌ها توضیح می‌دهیم.
          </p>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {blogCategories.map((category) => (
            <span key={category} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-text-muted" style={{ fontWeight: 700 }}>
              {category}
            </span>
          ))}
        </div>

        <Link to={`/blog/${featured.slug}`} className="group mt-12 grid overflow-hidden rounded-3xl border border-neon-cyan/15 bg-surface/45 shadow-[0_20px_80px_rgba(0,0,0,0.26)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-neon-cyan/35 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <span className="mb-4 inline-flex rounded-full bg-neon-green/15 px-3 py-1 text-xs text-neon-green" style={{ fontWeight: 800 }}>مقاله پیشنهادی</span>
            <h2 className="text-2xl leading-tight text-white sm:text-3xl" style={{ fontWeight: 900 }}>{featured.title}</h2>
            <p className="mt-4 text-sm leading-7 text-text-muted" style={{ fontWeight: 600 }}>{featured.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1"><BookOpen size={15} />{featured.category}</span>
              <span className="inline-flex items-center gap-1"><Clock size={15} />{featured.readTime}</span>
            </div>
          </div>
          <div className="relative min-h-64 overflow-hidden border-t border-neon-cyan/10 bg-gradient-to-br from-neon-cyan/20 via-purple-500/10 to-neon-green/10 p-6 lg:border-r lg:border-t-0">
            <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-neon-cyan/25 blur-2xl transition-transform group-hover:scale-125" />
            <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="relative flex h-full min-h-52 flex-col justify-end">
              <SearchCheck className="mb-5 text-neon-cyan" size={44} />
              <p className="max-w-md text-lg leading-9 text-white" style={{ fontWeight: 900 }}>{featured.hero}</p>
            </div>
          </div>
        </Link>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {rest.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="group rounded-2xl border border-neon-cyan/10 bg-surface/35 p-5 transition-all hover:-translate-y-1 hover:border-neon-cyan/35 hover:bg-surface/55">
              <span className="mb-4 inline-block rounded-full bg-white/5 px-2.5 py-1 text-[0.65rem] text-neon-cyan" style={{ fontWeight: 800 }}>{post.category}</span>
              <h2 className="min-h-16 text-base leading-7 text-white group-hover:text-neon-cyan" style={{ fontWeight: 900 }}>{post.title}</h2>
              <p className="mt-3 line-clamp-3 text-xs leading-6 text-text-muted" style={{ fontWeight: 600 }}>{post.description}</p>
              <div className="mt-5 flex items-center justify-between text-[0.68rem] text-text-muted">
                <span>{post.readTime}</span>
                <span className="text-neon-cyan">خواندن مقاله</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
