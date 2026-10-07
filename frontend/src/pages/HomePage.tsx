import { ArrowRight, Clock3, Leaf, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { ErrorPanel, LoadingPanel } from '../components/StatePanel'
import { api, errorMessage } from '../lib/api'
import type { Category, Product } from '../types'

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => {
    setLoading(true); setError('')
    try { const [p, c] = await Promise.all([api.get<Product[]>('/menu/products'), api.get<Category[]>('/menu/categories')]); setProducts(p.data); setCategories(c.data) }
    catch (reason) { setError(errorMessage(reason, 'The kitchen menu could not be loaded.')) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  return <>
    <section className="hero-grid overflow-hidden py-12 sm:py-16 lg:py-20">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr]">
        <div><p className="eyebrow">Warm plates. Honest ingredients.</p><h1 className="display-title mt-5">A little island comfort, delivered to your door.</h1><p className="mt-6 max-w-xl text-base leading-8 text-forest-900/65 sm:text-lg">From slow-cooked curries to wok-fired favourites, every Plate & Pantry order is made fresh in our Colombo kitchen.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary" to="/menu">Explore the menu <ArrowRight size={17} /></Link><a className="btn-secondary" href="#story">Meet our kitchen</a></div><div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-bold text-forest-900/60"><span className="flex items-center gap-2"><Clock3 size={16} className="text-orange-500" /> 30-50 min delivery</span><span className="flex items-center gap-2"><MapPin size={16} className="text-orange-500" /> Colombo delivery</span><span className="flex items-center gap-2"><Leaf size={16} className="text-orange-500" /> Cooked fresh</span></div></div>
        <div className="relative mx-auto w-full max-w-xl"><div className="aspect-[5/6] overflow-hidden rounded-[2.5rem] bg-cream-200 shadow-[0_30px_80px_rgba(24,33,26,.18)] sm:aspect-[6/5]"><img className="h-full w-full object-cover" src="https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1400&q=85" alt="Fresh Sri Lankan meal on a table" /></div><div className="absolute -bottom-5 -left-3 rounded-2xl bg-white p-4 shadow-xl sm:-left-8"><p className="text-xs font-bold uppercase tracking-widest text-orange-600">Kitchen favourite</p><p className="mt-1 font-display text-lg font-bold">Ceylon comfort plates</p></div></div>
      </div>
    </section>
    <section className="container-shell py-20"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Find your craving</p><h2 className="section-title mt-3">From our pantry</h2></div><Link className="text-sm font-bold text-orange-600" to="/menu">See the full menu →</Link></div>{loading ? <LoadingPanel /> : error ? <ErrorPanel message={error} retry={() => void load()} /> : <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{categories.map((category, index) => <Link to={`/menu?category=${category.slug}`} key={category.id} className="group rounded-3xl border border-forest-900/8 bg-cream-100 p-6 transition hover:-translate-y-1 hover:border-orange-500"><span className="text-xs font-bold text-orange-600">0{index + 1}</span><h3 className="mt-8 font-display text-xl font-bold">{category.name}</h3><p className="mt-2 text-sm text-forest-900/55">View dishes <span className="transition group-hover:ml-1">→</span></p></Link>)}</div>}</section>
    <section className="bg-cream-100 py-20"><div className="container-shell"><div className="flex items-end justify-between"><div><p className="eyebrow">Most loved</p><h2 className="section-title mt-3">The regulars' table</h2></div></div>{loading ? <LoadingPanel /> : error ? null : <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.filter(product => product.featured).slice(0, 6).map(product => <ProductCard key={product.id} product={product} />)}</div>}</div></section>
    <section id="story" className="container-shell py-24"><div className="grid overflow-hidden rounded-[2.5rem] bg-forest-900 text-white lg:grid-cols-2"><img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=85" className="h-full min-h-80 w-full object-cover" alt="Chef preparing food in a warm kitchen" /><div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16"><p className="eyebrow">Our table, your home</p><h2 className="mt-4 font-display text-4xl leading-tight">Food with a familiar soul and a curious edge.</h2><p className="mt-6 leading-8 text-white/65">We cook the way a generous host would: proper spices, market-fresh produce, careful portions and no shortcuts. The menu is rooted in Sri Lankan comfort, with just enough playfulness to keep dinner interesting.</p><Link to="/menu" className="mt-8 text-sm font-bold text-orange-500">Choose tonight's plate →</Link></div></div></section>
  </>
}
