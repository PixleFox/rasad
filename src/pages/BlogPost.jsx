import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarDays, Clock, Sparkles } from 'lucide-react'
import { blogPosts, getBlogPost } from '../data/blogPosts'

function formatDate(date) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date))
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPost(slug)
  if (!post) return <Navigate to="/blog" replace />

  const relatedPosts = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3)

  return (
    <main className="relative min-h-screen overflow-hidden bg-space pt-24 pb-20 font-dana" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-8 right-1/5 h-96 w-96 rounded-full bg-neon-cyan/10 blur-3xl" />
        <div className="absolute bottom-32 left-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <article className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-neon-cyan" style={{ fontWeight: 700 }}>
          <ArrowRight size={17} />
          بازگشت به وبلاگ
        </Link>

        <header className="rounded-3xl border border-neon-cyan/15 bg-surface/40 p-6 backdrop-blur-sm sm:p-9">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-neon-cyan/10 px-3 py-1 text-neon-cyan" style={{ fontWeight: 800 }}>{post.category}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-text-muted"><Clock size={14} />{post.readTime}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-text-muted"><CalendarDays size={14} />{formatDate(post.updatedAt)}</span>
          </div>
          <h1 className="text-3xl leading-tight text-white sm:text-5xl" style={{ fontWeight: 900 }}>{post.title}</h1>
          <p className="mt-5 text-base leading-8 text-text-muted" style={{ fontWeight: 600 }}>{post.hero}</p>
        </header>

        <div className="mt-8 rounded-3xl border border-neon-cyan/10 bg-surface/30 p-6 sm:p-9">
          <div className="prose prose-invert max-w-none">
            {post.sections.map((section) => (
              <section key={section.heading} className="mb-10 last:mb-0">
                <h2 className="mb-4 text-xl text-white sm:text-2xl" style={{ fontWeight: 900 }}>{section.heading}</h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph} className="mb-4 text-sm leading-8 text-text-muted sm:text-base" style={{ fontWeight: 600 }}>{paragraph}</p>
                ))}
                {section.list && (
                  <ul className="space-y-3">
                    {section.list.map((item) => (
                      <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-text-muted" style={{ fontWeight: 600 }}>
                        <Sparkles size={16} className="mt-1 shrink-0 text-neon-cyan" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-10 rounded-2xl border border-neon-green/15 bg-neon-green/5 p-5">
            <h2 className="mb-4 text-lg text-white" style={{ fontWeight: 900 }}>پرسش‌های پرتکرار</h2>
            <div className="space-y-4">
              {post.faq.map((item) => (
                <div key={item.question} className="rounded-xl bg-space/45 p-4">
                  <h3 className="text-sm text-neon-green" style={{ fontWeight: 900 }}>{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-text-muted" style={{ fontWeight: 600 }}>{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-neon-cyan/15 bg-neon-cyan/5 p-5">
            <h2 className="mb-4 text-lg text-white" style={{ fontWeight: 900 }}>بعد از خواندن این مطلب، داده‌ها را ببینید</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {post.relatedLinks.map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center justify-between rounded-xl border border-neon-cyan/10 bg-space/45 px-4 py-3 text-sm text-text-primary transition-colors hover:border-neon-cyan/35 hover:text-neon-cyan" style={{ fontWeight: 800 }}>
                  {link.label}
                  <BookOpen size={16} />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-xl text-white" style={{ fontWeight: 900 }}>مطالب پیشنهادی</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedPosts.map((item) => (
              <Link key={item.slug} to={`/blog/${item.slug}`} className="rounded-2xl border border-neon-cyan/10 bg-surface/30 p-4 transition-all hover:-translate-y-1 hover:border-neon-cyan/35">
                <span className="text-[0.65rem] text-neon-cyan" style={{ fontWeight: 800 }}>{item.category}</span>
                <h3 className="mt-2 text-sm leading-7 text-white" style={{ fontWeight: 900 }}>{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  )
}
