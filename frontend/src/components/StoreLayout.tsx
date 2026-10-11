import { Clock3, MapPin, Menu, ShoppingBag, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const navigation = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Our menu' },
]

export function StoreLayout() {
  const [open, setOpen] = useState(false)
  const { itemCount } = useCart()

  return (
    <div className="min-h-screen overflow-hidden bg-cream-50">
      <div className="bg-forest-900 text-cream-50">
        <div className="container-shell flex min-h-9 items-center justify-center gap-2 py-2 text-center text-[10px] font-bold uppercase tracking-[.18em] sm:text-xs">
          <Sparkles size={13} className="text-saffron-400" />
          Freshly cooked in Colombo · Open daily 11 AM–10 PM
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-forest-900/8 bg-cream-50/90 shadow-[0_8px_30px_rgba(18,50,41,.04)] backdrop-blur-xl">
        <div className="container-shell flex h-[76px] items-center justify-between">
          <Link to="/" className="group flex items-center gap-3" aria-label="Plate and Pantry home">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-forest-900 font-display text-xl font-bold text-cream-50 shadow-[0_8px_20px_rgba(18,50,41,.18)] transition group-hover:rotate-[-4deg] group-hover:bg-orange-500">P</span>
            <span>
              <b className="block font-display text-xl leading-none tracking-[-.02em]">Plate & Pantry</b>
              <small className="mt-1.5 block text-[9px] font-bold uppercase tracking-[.25em] text-orange-600">Colombo kitchen</small>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-forest-900/8 bg-white/70 p-1.5 shadow-sm md:flex">
            {navigation.map(item => (
              <NavLink key={item.label} to={item.to} end={item.to === '/'} className={({ isActive }) => `rounded-full px-5 py-2.5 text-sm font-bold transition ${isActive ? 'bg-forest-900 text-white shadow-sm' : 'text-forest-900/65 hover:bg-cream-100 hover:text-orange-600'}`}>
                {item.label}
              </NavLink>
            ))}
            <a href="/#story" className="rounded-full px-5 py-2.5 text-sm font-bold text-forest-900/65 transition hover:bg-cream-100 hover:text-orange-600">Our story</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/cart" className="relative grid h-12 w-12 place-items-center rounded-full border border-forest-900/10 bg-white text-forest-900 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-500 hover:text-orange-600" aria-label={`Cart with ${itemCount} items`}>
              <ShoppingBag size={20} />
              {itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-cream-50">{itemCount}</span>}
            </Link>
            <button className="grid h-12 w-12 place-items-center rounded-full text-forest-900 transition hover:bg-cream-100 md:hidden" aria-label="Toggle menu" onClick={() => setOpen(value => !value)}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="container-shell flex flex-col gap-1 border-t border-forest-900/8 py-4 md:hidden">
            {navigation.map(item => <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold hover:bg-cream-100">{item.label}</Link>)}
            <a href="/#story" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-bold hover:bg-cream-100">Our story</a>
          </nav>
        )}
      </header>
      <main><Outlet /></main>
      <footer className="relative mt-24 overflow-hidden bg-forest-900 text-cream-100">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="container-shell relative grid gap-10 py-16 md:grid-cols-[1.3fr_.8fr_.8fr]">
          <div>
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-cream-50 font-display text-xl font-bold text-forest-900">P</span><h2 className="font-display text-2xl font-bold">Plate & Pantry</h2></div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-cream-100/65">Soulful Sri Lankan comfort food with a modern pantry twist, cooked fresh and delivered across Colombo.</p>
            <Link to="/menu" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-saffron-400 transition hover:text-white">See what’s cooking <span aria-hidden="true">→</span></Link>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[.2em] text-saffron-400">Visit the pantry</h3>
            <p className="mt-5 flex gap-3 text-sm leading-6 text-cream-100/65"><MapPin size={17} className="mt-1 shrink-0 text-orange-400" />42 Flower Road<br />Colombo 07</p>
            <p className="mt-3 flex items-center gap-3 text-sm text-cream-100/65"><Clock3 size={17} className="text-orange-400" />Daily, 11 AM–10 PM</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[.2em] text-saffron-400">Good to know</h3>
            <p className="mt-5 text-sm leading-7 text-cream-100/65">Orders are confirmed after WhatsApp confirmation or verified online payment.</p>
            <Link to="/admin/login" className="mt-5 inline-block text-xs font-bold uppercase tracking-[.16em] text-cream-100/45 transition hover:text-orange-400">Team login</Link>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-cream-100/40">© {new Date().getFullYear()} Plate & Pantry · Crafted with care in Colombo</div>
      </footer>
    </div>
  )
}
