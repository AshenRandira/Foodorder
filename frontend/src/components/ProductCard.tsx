import { ArrowUpRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { money } from '../lib/api'
import type { Product } from '../types'

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart()
  return <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_18px_50px_rgba(24,33,26,.08)]">
    <Link to={`/menu/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-cream-200">
      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={event => { event.currentTarget.src = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80' }} />
      <span className="absolute left-4 top-4 rounded-full bg-cream-50/95 px-3 py-1 text-xs font-bold text-forest-900">{product.category.name}</span>
      {!product.available && <span className="absolute inset-0 grid place-items-center bg-forest-900/65 text-sm font-bold uppercase tracking-widest text-white">Sold out</span>}
    </Link>
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div><Link to={`/menu/${product.id}`} className="font-display text-xl font-bold text-forest-900 hover:text-orange-600">{product.name}</Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-forest-900/60">{product.description}</p></div>
        <ArrowUpRight className="mt-1 shrink-0 text-forest-900/30" size={19} />
      </div>
      <div className="mt-5 flex items-center justify-between"><span className="font-bold text-forest-900">{money(product.price)}</span><button aria-label={`Add ${product.name} to cart`} className="grid h-10 w-10 place-items-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-40" disabled={!product.available} onClick={() => add(product)}><Plus size={18} /></button></div>
    </div>
  </article>
}
