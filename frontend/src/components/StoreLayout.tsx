import { Menu, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export function StoreLayout() {
  const [open, setOpen] = useState(false)
  const { itemCount } = useCart()
  const nav = [{ to: '/', label: 'Home' }, { to: '/menu', label: 'Our menu' }, { to: '/#story', label: 'Our story' }]
  return <div className="min-h-screen bg-cream-50">
    <header className="sticky top-0 z-40 border-b border-forest-900/8 bg-cream-50/95 backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="Plate and Pantry home"><span className="grid h-10 w-10 place-items-center rounded-full bg-forest-900 font-display text-lg font-bold text-cream-50">P</span><span><b className="block font-display text-lg leading-none">Plate & Pantry</b><small className="mt-1 block text-[10px] font-bold uppercase tracking-[.22em] text-orange-600">Colombo kitchen</small></span></Link>
        <nav className="hidden items-center gap-8 md:flex">{nav.map(item => <NavLink key={item.label} to={item.to} className={({ isActive }) => `text-sm font-bold transition hover:text-orange-600 ${isActive ? 'text-orange-600' : 'text-forest-900/70'}`}>{item.label}</NavLink>)}</nav>
        <div className="flex items-center gap-2"><Link to="/cart" className="relative grid h-11 w-11 place-items-center rounded-full border border-forest-900/12 bg-white" aria-label={`Cart with ${itemCount} items`}><ShoppingBag size={19} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{itemCount}</span>}</Link><button className="grid h-11 w-11 place-items-center rounded-full md:hidden" aria-label="Toggle menu" onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}</button></div>
      </div>
      {open && <nav className="container-shell flex flex-col gap-1 border-t border-forest-900/8 py-4 md:hidden">{nav.map(item => <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-bold hover:bg-cream-100">{item.label}</Link>)}</nav>}
    </header>
    <main><Outlet /></main>
    <footer className="mt-24 bg-forest-900 text-cream-100"><div className="container-shell grid gap-10 py-14 md:grid-cols-3"><div><h2 className="font-display text-2xl font-bold">Plate & Pantry</h2><p className="mt-3 max-w-xs text-sm leading-6 text-cream-100/65">Soulful island cooking, thoughtfully packed and delivered across Colombo.</p></div><div><h3 className="text-sm font-bold">Visit the pantry</h3><p className="mt-3 text-sm leading-7 text-cream-100/65">42 Flower Road, Colombo 07<br />Daily, 11:00 AM - 10:00 PM</p></div><div><h3 className="text-sm font-bold">Need help?</h3><p className="mt-3 text-sm leading-7 text-cream-100/65">Orders are confirmed only after payment verification or direct WhatsApp confirmation.</p><Link to="/admin/login" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-orange-500">Team login</Link></div></div><div className="border-t border-white/10 py-5 text-center text-xs text-cream-100/45">© {new Date().getFullYear()} Plate & Pantry. Crafted in Colombo.</div></footer>
  </div>
}
