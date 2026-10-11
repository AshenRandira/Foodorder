import { ArrowUpRight, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { money } from '../lib/api'
import type { Product } from '../types'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-forest-900/8 bg-white shadow-[0_18px_55px_rgba(18,50,41,.08)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(18,50,41,.14)]">
      <Link to={`/menu/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-cream-200">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.07]"
          onError={event => { event.currentTarget.src = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900/25 via-transparent to-transparent opacity-60" />
        <span className="absolute left-4 top-4 rounded-full border border-white/40 bg-cream-50/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-forest-900 shadow-sm backdrop-blur-md">{product.category.name}</span>
        {product.featured && <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-saffron-400 text-forest-900 shadow-lg" aria-label="Customer favourite"><Sparkles size={16} /></span>}
        {!product.available && <span className="absolute inset-0 grid place-items-center bg-forest-900/70 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm">Sold out</span>}
      </Link>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to={`/menu/${product.id}`} className="font-display text-[1.35rem] font-bold leading-tight text-forest-900 transition hover:text-orange-600">{product.name}</Link>
            <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-forest-900/55">{product.description}</p>
          </div>
          <ArrowUpRight className="mt-1 shrink-0 text-forest-900/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-500" size={19} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-forest-900/8 pt-5">
          <div><span className="block text-[10px] font-bold uppercase tracking-[.15em] text-forest-900/35">From</span><span className="mt-0.5 block text-lg font-bold text-forest-900">{money(product.price)}</span></div>
          <button aria-label={`Add ${product.name} to cart`} className="flex h-11 items-center gap-2 rounded-full bg-orange-500 px-4 text-xs font-bold text-white shadow-[0_10px_22px_rgba(232,97,42,.24)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-40" disabled={!product.available} onClick={() => add(product)}>
            <Plus size={17} /> <span className="hidden sm:inline">Quick add</span>
          </button>
        </div>
      </div>
    </article>
  )
}
