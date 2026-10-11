import { ChefHat, Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/StatePanel'
import { api, errorMessage } from '../lib/api'
import type { Category, Product } from '../types'

export function MenuPage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(params.get('q') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const selected = params.get('category') || 'all'

  const load = async () => {
    setLoading(true)
    try {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get<Product[]>('/menu/products'),
        api.get<Category[]>('/menu/categories'),
      ])
      setProducts(productResponse.data)
      setCategories(categoryResponse.data)
      setError('')
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => products.filter(product => (
    selected === 'all' || product.category.slug === selected
  ) && (`${product.name} ${product.description}`).toLowerCase().includes(search.toLowerCase().trim())), [products, selected, search])

  const selectCategory = (category: string) => {
    const next = new URLSearchParams(params)
    category === 'all' ? next.delete('category') : next.set('category', category)
    setParams(next)
  }

  return (
    <>
      <section className="menu-hero noise-overlay relative overflow-hidden py-14 text-white sm:py-20">
        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[50px] border-white/5" />
        <div className="container-shell relative grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.2em] text-saffron-400 backdrop-blur"><ChefHat size={14} /> Cooked when you order</div>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-none tracking-[-.04em] sm:text-7xl">Tonight’s menu</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/65">Bright island flavours, comforting favourites and something sweet for the finish.</p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/8 px-5 py-4 backdrop-blur"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-saffron-400 text-forest-900"><Sparkles size={19} /></span><div><b className="block font-display text-2xl">{products.length || '12'} dishes</b><span className="text-xs text-white/50">Fresh from the kitchen</span></div></div>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="rounded-[1.75rem] border border-forest-900/8 bg-white p-3 shadow-[0_18px_55px_rgba(18,50,41,.07)] sm:p-4 lg:flex lg:items-center lg:justify-between lg:gap-5">
          <div className="flex gap-2 overflow-x-auto pb-3 lg:pb-0">
            {[{ slug: 'all', name: 'Everything' }, ...categories].map(category => (
              <button key={category.slug} onClick={() => selectCategory(category.slug)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition ${selected === category.slug ? 'bg-forest-900 text-white shadow-sm' : 'bg-cream-100/70 text-forest-900/60 hover:bg-sage-100 hover:text-forest-900'}`}>
                {category.name}
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/35" size={18} />
            <input className="field border-0 bg-cream-100/70 pl-11 shadow-none" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search for a dish..." aria-label="Search the menu" />
          </label>
        </div>
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-forest-900/40"><SlidersHorizontal size={15} className="text-orange-500" /> {filtered.length} dishes found</div>
          <div className="hidden text-xs text-forest-900/40 sm:block">Tap <b className="text-forest-900/60">Quick add</b> to start your basket</div>
        </div>
        {loading ? <LoadingPanel label="Bringing out the menu..." /> : error ? <ErrorPanel message={error} retry={() => void load()} /> : filtered.length === 0 ? (
          <div className="mt-8"><EmptyPanel title="No dishes found" body="Try a different search or choose another menu category." /></div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div>
        )}
      </section>
    </>
  )
}
