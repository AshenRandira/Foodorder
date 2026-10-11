import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyPanel } from '../components/StatePanel'
import { useCart } from '../context/CartContext'
import { money } from '../lib/api'

export function CartPage() {
  const { lines, subtotal, setQuantity, remove } = useCart()
  const delivery = lines.length ? 350 : 0

  return (
    <section className="hero-grid min-h-[70vh] py-12 sm:py-16">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Your order</p><h1 className="display-title mt-4">Your basket</h1><p className="mt-3 text-sm text-forest-900/55">A good dinner is only a few steps away.</p></div>{lines.length > 0 && <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-forest-900/55 shadow-sm">{lines.reduce((sum, line) => sum + line.quantity, 0)} items selected</span>}</div>
        {lines.length === 0 ? (
          <div className="mt-10"><EmptyPanel title="Your basket is waiting" body="Add a comforting plate, a cool drink, or something sweet from the menu." /><div className="mt-6 text-center"><Link to="/menu" className="btn-primary">Browse the menu</Link></div></div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
            <div className="space-y-4">
              {lines.map(line => (
                <article key={line.product.id} className="card group flex gap-4 p-4 transition hover:border-orange-500/20 sm:gap-6 sm:p-5">
                  <img src={line.product.imageUrl} className="h-24 w-24 rounded-2xl object-cover shadow-sm sm:h-32 sm:w-32" alt={line.product.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-600">{line.product.category.name}</p><h2 className="mt-1.5 font-display text-xl font-bold sm:text-2xl">{line.product.name}</h2><p className="mt-1 text-xs text-forest-900/40">{money(line.product.price)} each</p></div><button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-forest-900/30 transition hover:bg-red-50 hover:text-red-600" onClick={() => remove(line.product.id)} aria-label={`Remove ${line.product.name}`}><Trash2 size={17} /></button></div>
                    <div className="mt-5 flex items-end justify-between"><div className="flex items-center rounded-full border border-forest-900/10 bg-cream-50 p-1"><button className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white" onClick={() => setQuantity(line.product.id, line.quantity - 1)} aria-label={`Decrease ${line.product.name}`}><Minus size={14} /></button><span className="w-9 text-center text-sm font-bold">{line.quantity}</span><button className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white" onClick={() => setQuantity(line.product.id, line.quantity + 1)} aria-label={`Increase ${line.product.name}`}><Plus size={14} /></button></div><span className="text-lg font-bold">{money(line.product.price * line.quantity)}</span></div>
                  </div>
                </article>
              ))}
              <Link to="/menu" className="flex items-center justify-center gap-2 rounded-3xl border border-dashed border-forest-900/15 py-5 text-sm font-bold text-forest-900/50 transition hover:border-orange-500 hover:bg-white hover:text-orange-600"><Plus size={16} /> Add another dish</Link>
            </div>
            <aside className="card h-fit overflow-hidden lg:sticky lg:top-32">
              <div className="bg-forest-900 p-6 text-white"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-saffron-400"><ShoppingBag size={20} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-saffron-400">Almost there</p><h2 className="mt-1 font-display text-2xl font-bold">Order summary</h2></div></div></div>
              <div className="p-6"><dl className="space-y-4 text-sm"><div className="flex justify-between text-forest-900/60"><dt>Subtotal</dt><dd className="font-semibold text-forest-900">{money(subtotal)}</dd></div><div className="flex justify-between text-forest-900/60"><dt className="flex items-center gap-2"><Truck size={15} /> Delivery</dt><dd className="font-semibold text-forest-900">{money(delivery)}</dd></div><div className="flex justify-between border-t border-forest-900/10 pt-5 text-xl font-bold"><dt>Total</dt><dd className="text-orange-600">{money(subtotal + delivery)}</dd></div></dl><Link to="/checkout" className="btn-primary mt-7 w-full">Continue to checkout <ArrowRight size={17} /></Link><div className="mt-5 flex items-start gap-2 rounded-2xl bg-sage-100 p-3 text-xs leading-5 text-forest-900/55"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-forest-700" /> Prices, availability and totals are checked again securely before your order is saved.</div></div>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
