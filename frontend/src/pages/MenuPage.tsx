import { Search, SlidersHorizontal } from 'lucide-react'
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
  const load = async () => { setLoading(true); try { const [p, c] = await Promise.all([api.get<Product[]>('/menu/products'), api.get<Category[]>('/menu/categories')]); setProducts(p.data); setCategories(c.data); setError('') } catch (reason) { setError(errorMessage(reason)) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const filtered = useMemo(() => products.filter(product => (selected === 'all' || product.category.slug === selected) && (`${product.name} ${product.description}`).toLowerCase().includes(search.toLowerCase().trim())), [products, selected, search])
  const selectCategory = (category: string) => { const next = new URLSearchParams(params); category === 'all' ? next.delete('category') : next.set('category', category); setParams(next) }
  return <section className="container-shell py-12 sm:py-16"><div className="max-w-2xl"><p className="eyebrow">Cooked when you order</p><h1 className="display-title mt-4">Our menu</h1><p className="mt-4 leading-7 text-forest-900/60">Bright island flavours, comforting favourites and something sweet for the finish.</p></div><div className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-2 overflow-x-auto pb-2">{[{ slug: 'all', name: 'Everything' }, ...categories].map(category => <button key={category.slug} onClick={() => selectCategory(category.slug)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition ${selected === category.slug ? 'bg-forest-900 text-white' : 'border border-forest-900/10 bg-white text-forest-900/65 hover:border-orange-500'}`}>{category.name}</button>)}</div><label className="relative block w-full lg:max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-900/35" size={18} /><input className="field pl-11" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the menu" aria-label="Search the menu" /></label></div><div className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest-900/45"><SlidersHorizontal size={15} /> {filtered.length} dishes</div>{loading ? <LoadingPanel label="Bringing out the menu..." /> : error ? <ErrorPanel message={error} retry={() => void load()} /> : filtered.length === 0 ? <div className="mt-8"><EmptyPanel title="No dishes found" body="Try a different search or choose another menu category." /></div> : <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div>}</section>
}
