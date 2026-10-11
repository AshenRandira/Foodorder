import { ArrowRight, CakeSlice, Check, Clock3, GlassWater, Leaf, MapPin, Salad, Sandwich, Sparkles, UtensilsCrossed } from 'lucide-react'
import { useEffect, useState, type ElementType } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { ErrorPanel, LoadingPanel } from '../components/StatePanel'
import { api, errorMessage } from '../lib/api'
import type { Category, Product } from '../types'

const categoryIcons: ElementType[] = [UtensilsCrossed, Salad, Sandwich, GlassWater, CakeSlice]

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get<Product[]>('/menu/products'),
        api.get<Category[]>('/menu/categories'),
      ])
      setProducts(productResponse.data)
      setCategories(categoryResponse.data)
    } catch (reason) {
      setError(errorMessage(reason, 'The kitchen menu could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <>
      <section className="hero-grid relative overflow-hidden py-12 sm:py-16 lg:py-20">
        <div className="absolute -left-20 top-24 h-52 w-52 rounded-full border-[42px] border-white/35" />
        <div className="container-shell relative grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/15 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-orange-600 shadow-sm backdrop-blur">
              <Sparkles size={14} className="text-saffron-400" /> Warm plates · Honest ingredients
            </div>
            <h1 className="display-title mt-6 max-w-2xl">Island comfort,<br /><span className="text-orange-500">made memorable.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-forest-900/65 sm:text-lg">Slow-cooked curries, vibrant pantry bowls and wok-fired favourites—made fresh in our Colombo kitchen and packed for a beautiful meal at home.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/menu">Explore the menu <ArrowRight size={17} /></Link>
              <a className="btn-secondary" href="#story">Our kitchen story</a>
            </div>
            <div className="mt-9 grid max-w-xl grid-cols-3 divide-x divide-forest-900/10 rounded-3xl border border-white/70 bg-white/55 px-2 py-4 shadow-sm backdrop-blur sm:px-5">
              <div className="px-2 sm:px-4"><b className="block font-display text-xl sm:text-2xl">{products.length || '12'}+</b><span className="text-[10px] font-bold uppercase tracking-wider text-forest-900/45">Fresh dishes</span></div>
              <div className="px-2 sm:px-4"><b className="block font-display text-xl sm:text-2xl">30–50</b><span className="text-[10px] font-bold uppercase tracking-wider text-forest-900/45">Minutes</span></div>
              <div className="px-2 sm:px-4"><b className="block font-display text-xl sm:text-2xl">Daily</b><span className="text-[10px] font-bold uppercase tracking-wider text-forest-900/45">Cooked fresh</span></div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl pb-8 pl-5 sm:pl-10">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-saffron-400/35 blur-2xl" />
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2.75rem] bg-cream-200 shadow-[0_35px_90px_rgba(18,50,41,.22)] sm:aspect-[6/5]">
              <img className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1400&q=88" alt="Fresh Sri Lankan meal on a table" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-900/65 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-saffron-400">Made to order</p><p className="mt-1 font-display text-2xl font-bold">Comfort in every bite</p></div>
            </div>
            <div className="absolute -bottom-1 left-0 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(18,50,41,.15)] backdrop-blur sm:p-5">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-sage-100 text-forest-800"><Leaf size={18} /></span><div><p className="text-xs font-bold">Market-fresh cooking</p><p className="mt-0.5 text-[11px] text-forest-900/50">Prepared only when you order</p></div></div>
            </div>
            <div className="absolute right-[-.5rem] top-8 hidden rounded-2xl bg-forest-900 px-4 py-3 text-cream-50 shadow-xl sm:block"><p className="text-[10px] font-bold uppercase tracking-widest text-saffron-400">Delivering</p><p className="mt-1 flex items-center gap-1.5 text-xs font-bold"><MapPin size={13} /> Across Colombo</p></div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Find your craving</p><h2 className="section-title mt-3">From our pantry</h2><p className="mt-3 max-w-lg text-sm leading-7 text-forest-900/55">Pick a corner of the kitchen and discover a plate that feels right for tonight.</p></div>
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 transition hover:gap-3" to="/menu">See the full menu <ArrowRight size={16} /></Link>
        </div>
        {loading ? <LoadingPanel /> : error ? <ErrorPanel message={error} retry={() => void load()} /> : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length]
              return (
                <Link to={`/menu?category=${category.slug}`} key={category.id} className="group relative overflow-hidden rounded-[1.75rem] border border-forest-900/8 bg-white p-6 shadow-[0_14px_38px_rgba(18,50,41,.06)] transition duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-[0_20px_45px_rgba(18,50,41,.11)]">
                  <span className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-saffron-400/15 transition group-hover:scale-125" />
                  <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-sage-100 text-forest-800 transition group-hover:bg-orange-500 group-hover:text-white"><Icon size={20} /></span>
                  <span className="mt-8 block text-[10px] font-bold uppercase tracking-[.16em] text-orange-600">Collection 0{index + 1}</span>
                  <h3 className="mt-2 font-display text-xl font-bold leading-tight">{category.name}</h3>
                  <p className="mt-3 flex items-center gap-1 text-xs font-bold text-forest-900/45 transition group-hover:text-orange-600">Explore dishes <ArrowRight size={13} /></p>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="relative overflow-hidden bg-sage-100 py-20 sm:py-24">
        <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-saffron-400/15 blur-3xl" />
        <div className="container-shell relative">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Most loved</p><h2 className="section-title mt-3">The regulars’ table</h2><p className="mt-3 text-sm text-forest-900/55">The plates our customers return to again and again.</p></div><span className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-forest-900/55 shadow-sm sm:flex"><Sparkles size={14} className="text-orange-500" /> Kitchen favourites</span></div>
          {loading ? <LoadingPanel /> : error ? null : <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.filter(product => product.featured).slice(0, 6).map(product => <ProductCard key={product.id} product={product} />)}</div>}
        </div>
      </section>

      <section id="story" className="container-shell py-24 sm:py-28">
        <div className="grid overflow-hidden rounded-[2.75rem] bg-forest-900 text-white shadow-[0_35px_90px_rgba(18,50,41,.18)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative min-h-96 overflow-hidden"><img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1400&q=88" className="absolute inset-0 h-full w-full object-cover" alt="Chef preparing food in a warm kitchen" /><div className="absolute inset-0 bg-gradient-to-r from-transparent to-forest-900/20" /><span className="absolute bottom-6 left-6 rounded-full border border-white/25 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] backdrop-blur">Made in Colombo</span></div>
          <div className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-16"><div className="absolute right-8 top-8 text-8xl font-display text-white/5">P</div><p className="eyebrow">Our table, your home</p><h2 className="mt-4 max-w-lg font-display text-4xl font-semibold leading-tight sm:text-5xl">Familiar soul.<br />A curious edge.</h2><p className="mt-6 max-w-lg leading-8 text-white/65">We cook the way a generous host would: proper spices, market-fresh produce, careful portions and no shortcuts. Sri Lankan comfort sits at the heart of every plate.</p><div className="mt-7 grid gap-3 text-sm text-white/75 sm:grid-cols-2"><span className="flex items-center gap-2"><Check size={16} className="text-saffron-400" /> Cooked to order</span><span className="flex items-center gap-2"><Check size={16} className="text-saffron-400" /> Thoughtful portions</span><span className="flex items-center gap-2"><Clock3 size={16} className="text-saffron-400" /> Fast local delivery</span><span className="flex items-center gap-2"><Leaf size={16} className="text-saffron-400" /> Fresh ingredients</span></div><Link to="/menu" className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-saffron-400 transition hover:gap-3 hover:text-white">Choose tonight’s plate <ArrowRight size={16} /></Link></div>
        </div>
      </section>
    </>
  )
}
