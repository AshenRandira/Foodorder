import { ArrowLeft, Check, Clock3, Leaf, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorPanel, LoadingPanel } from '../components/StatePanel'
import { useCart } from '../context/CartContext'
import { api, errorMessage, money } from '../lib/api'
import type { Product } from '../types'

export function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { add } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Product>(`/menu/products/${id}`)
      .then(response => setProduct(response.data))
      .catch(reason => setError(errorMessage(reason, 'This dish could not be found.')))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="container-shell py-16"><LoadingPanel /></div>
  if (error || !product) return <div className="container-shell py-16"><ErrorPanel message={error || 'Dish not found.'} /></div>

  const addToCart = () => {
    add(product, quantity)
    navigate('/cart')
  }

  return (
    <section className="hero-grid py-10 sm:py-16">
      <div className="container-shell">
        <Link to="/menu" className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-forest-900/60 shadow-sm backdrop-blur transition hover:text-orange-600"><ArrowLeft size={17} /> Back to menu</Link>
        <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-[2.75rem] bg-cream-200 shadow-[0_30px_80px_rgba(18,50,41,.16)]"><img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} /></div>
            <span className="absolute left-5 top-5 rounded-full border border-white/40 bg-cream-50/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-forest-900 shadow-sm backdrop-blur">{product.category.name}</span>
            {product.featured && <span className="absolute bottom-5 right-5 rounded-2xl bg-saffron-400 px-4 py-3 text-xs font-bold text-forest-900 shadow-lg">Customer favourite</span>}
          </div>
          <div className="flex flex-col justify-center">
            <span className="eyebrow">Fresh from our Colombo kitchen</span>
            <h1 className="display-title mt-4">{product.name}</h1>
            <p className="mt-6 text-lg leading-8 text-forest-900/60">{product.description}</p>
            <div className="mt-7 grid gap-3 rounded-3xl border border-forest-900/8 bg-white/65 p-5 text-sm text-forest-900/65 shadow-sm backdrop-blur sm:grid-cols-2">
              <span className="flex items-center gap-2"><Leaf size={16} className="text-orange-500" /> Fresh ingredients</span>
              <span className="flex items-center gap-2"><Clock3 size={16} className="text-orange-500" /> Cooked to order</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-orange-500" /> Carefully packed</span>
              <span className="flex items-center gap-2"><Check size={16} className="text-orange-500" /> Backend-verified price</span>
            </div>
            <div className="mt-8 flex items-center justify-between border-y border-forest-900/10 py-5"><div><span className="text-[10px] font-bold uppercase tracking-[.16em] text-forest-900/35">Price</span><span className="mt-1 block text-3xl font-bold">{money(product.price)}</span></div><span className={`rounded-full px-4 py-2 text-xs font-bold ${product.available ? 'bg-sage-100 text-forest-800' : 'bg-red-100 text-red-800'}`}>{product.available ? `${product.stockQuantity} available today` : 'Sold out'}</span></div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row"><div className="flex h-12 items-center justify-between rounded-full border border-forest-900/12 bg-white px-2 shadow-sm"><button className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-cream-100" onClick={() => setQuantity(value => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={16} /></button><span className="w-12 text-center font-bold">{quantity}</span><button className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-cream-100" onClick={() => setQuantity(value => Math.min(20, product.stockQuantity, value + 1))} aria-label="Increase quantity"><Plus size={16} /></button></div><button className="btn-primary flex-1" disabled={!product.available} onClick={addToCart}><ShoppingBag size={18} /> Add to basket · {money(product.price * quantity)}</button></div>
            <p className="mt-5 text-xs leading-5 text-forest-900/45">Our kitchen handles nuts, dairy, gluten and seafood. Contact us before ordering if you have a severe allergy.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
