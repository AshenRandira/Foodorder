import { ArrowLeft, Check, CreditCard, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api, errorMessage, money } from '../lib/api'
import type { CheckoutResponse, PaymentMethod, StoreConfig } from '../types'

type FormState = {
  customerName: string
  phone: string
  email: string
  deliveryAddress: string
  notes: string
  paymentMethod: PaymentMethod
}

const initial: FormState = {
  customerName: '',
  phone: '',
  email: '',
  deliveryAddress: '',
  notes: '',
  paymentMethod: 'WHATSAPP',
}

const rememberOrder = (reference: string, token: string) => {
  const saved = JSON.parse(localStorage.getItem('plate-pantry-orders') || '{}') as Record<string, string>
  saved[reference] = token
  localStorage.setItem('plate-pantry-orders', JSON.stringify(saved))
}

export function CheckoutPage() {
  const { lines, subtotal, clear } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    payHereAvailable: false,
    payHereMessage: 'Checking PayHere availability...',
  })
  const key = useRef(crypto.randomUUID())
  const delivery = lines.length ? 350 : 0

  useEffect(() => {
    api.get<StoreConfig>('/config')
      .then(response => setStoreConfig(response.data))
      .catch(() => setStoreConfig({
        payHereAvailable: false,
        payHereMessage: 'PayHere availability could not be confirmed.',
      }))
  }, [])

  const update = (name: keyof FormState, value: string) => {
    setForm(current => ({ ...current, [name]: value }))
  }

  const submitPayHere = (checkout: CheckoutResponse) => {
    if (!checkout.payHere?.configured) {
      throw new Error(checkout.payHere?.configurationMessage || 'PayHere is not configured.')
    }
    const paymentForm = document.createElement('form')
    paymentForm.method = 'POST'
    paymentForm.action = checkout.payHere.actionUrl
    Object.entries(checkout.payHere.fields).forEach(([name, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      paymentForm.appendChild(input)
    })
    document.body.appendChild(paymentForm)
    paymentForm.submit()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!lines.length) return
    setSubmitting(true)
    setError('')
    try {
      const response = await api.post<CheckoutResponse>('/orders', {
        ...form,
        email: form.email || null,
        notes: form.notes || null,
        items: lines.map(line => ({ productId: line.product.id, quantity: line.quantity })),
      }, { headers: { 'Idempotency-Key': key.current } })
      rememberOrder(response.data.order.reference, response.data.accessToken)
      if (form.paymentMethod === 'PAYHERE') {
        clear()
        submitPayHere(response.data)
        return
      }
      clear()
      if (response.data.whatsappUrl) window.open(response.data.whatsappUrl, '_blank', 'noopener,noreferrer')
      navigate(`/order/${response.data.order.reference}?token=${response.data.accessToken}&whatsapp=1`)
    } catch (reason) {
      setError(reason instanceof Error && !('response' in reason)
        ? reason.message
        : errorMessage(reason, 'Your order could not be created. No payment was taken.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!lines.length) {
    return (
      <section className="container-shell py-20 text-center">
        <h1 className="section-title">Your basket is empty</h1>
        <p className="mt-3 text-forest-900/60">Choose a few dishes before checking out.</p>
        <Link to="/menu" className="btn-primary mt-7">Explore the menu</Link>
      </section>
    )
  }

  return (
    <section className="container-shell py-10 sm:py-16">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-forest-900/60">
        <ArrowLeft size={17} /> Back to basket
      </Link>
      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_390px]">
        <form onSubmit={submit} className="card p-6 sm:p-9">
          <p className="eyebrow">Delivery details</p>
          <h1 className="section-title mt-3">Where should we bring dinner?</h1>
          {error && <div role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label>
              <span className="label">Full name</span>
              <input className="field" required maxLength={120} value={form.customerName} onChange={e => update('customerName', e.target.value)} autoComplete="name" />
            </label>
            <label>
              <span className="label">Phone number</span>
              <input className="field" required pattern="[+0-9][0-9\s-]{8,18}" value={form.phone} onChange={e => update('phone', e.target.value)} autoComplete="tel" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Email {form.paymentMethod === 'WHATSAPP' && <em className="font-normal text-forest-900/40">(optional)</em>}</span>
              <input className="field" type="email" required={form.paymentMethod === 'PAYHERE'} maxLength={160} value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Delivery address</span>
              <textarea className="field min-h-28 resize-y" required minLength={8} maxLength={500} value={form.deliveryAddress} onChange={e => update('deliveryAddress', e.target.value)} autoComplete="street-address" />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Order notes <em className="font-normal text-forest-900/40">(optional)</em></span>
              <textarea className="field min-h-24 resize-y" maxLength={800} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Gate code, spice preference, or delivery note" />
            </label>
          </div>
          <fieldset className="mt-9">
            <legend className="label">How would you like to order?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-2xl border p-4 transition ${form.paymentMethod === 'WHATSAPP' ? 'border-orange-500 bg-orange-50' : 'border-forest-900/10 bg-white'}`}>
                <input className="sr-only" type="radio" name="payment" checked={form.paymentMethod === 'WHATSAPP'} onChange={() => update('paymentMethod', 'WHATSAPP')} />
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700"><MessageCircle size={20} /></span>
                  <span><b className="block text-sm">Order via WhatsApp</b><small className="text-forest-900/50">Send an enquiry to confirm</small></span>
                </span>
              </label>
              <label className={`rounded-2xl border p-4 transition ${storeConfig.payHereAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${form.paymentMethod === 'PAYHERE' ? 'border-orange-500 bg-orange-50' : 'border-forest-900/10 bg-white'}`}>
                <input className="sr-only" type="radio" name="payment" disabled={!storeConfig.payHereAvailable} checked={form.paymentMethod === 'PAYHERE'} onChange={() => update('paymentMethod', 'PAYHERE')} />
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-700"><CreditCard size={20} /></span>
                  <span><b className="block text-sm">PayHere Sandbox</b><small className="text-forest-900/50">{storeConfig.payHereAvailable ? 'Secure online checkout' : 'Unavailable in this demo'}</small></span>
                </span>
              </label>
            </div>
            {form.paymentMethod === 'WHATSAPP' && <p className="mt-3 text-xs leading-5 text-forest-900/50">We will open a prepared message. You must press Send in WhatsApp, and the restaurant must confirm your order.</p>}
            {!storeConfig.payHereAvailable && <p className="mt-3 text-xs leading-5 text-forest-900/50">{storeConfig.payHereMessage}</p>}
          </fieldset>
          <button className="btn-primary mt-8 w-full" disabled={submitting}>
            {submitting ? 'Creating secure order...' : form.paymentMethod === 'PAYHERE' ? `Continue to PayHere · ${money(subtotal + delivery)}` : `Prepare WhatsApp order · ${money(subtotal + delivery)}`}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-forest-900/45"><ShieldCheck size={15} /> Prices and stock are rechecked securely before the order is saved.</p>
        </form>
        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-bold">Your table</h2>
          <div className="mt-6 space-y-4">
            {lines.map(line => (
              <div key={line.product.id} className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-100 text-xs font-bold">{line.quantity}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{line.product.name}</p><p className="text-xs text-forest-900/45">{money(line.product.price)} each</p></div>
                <span className="text-sm font-bold">{money(line.product.price * line.quantity)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-6 space-y-3 border-t border-forest-900/10 pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-forest-900/55">Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-forest-900/55">Delivery</dt><dd>{money(delivery)}</dd></div>
            <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total</dt><dd>{money(subtotal + delivery)}</dd></div>
          </dl>
          <div className="mt-6 rounded-2xl bg-sage-100 p-4 text-xs leading-5 text-forest-900/60">
            <div className="flex items-center gap-2 font-bold text-forest-900"><Check size={15} /> Freshness promise</div>
            <p className="mt-1">Your dishes enter the kitchen only after payment or business confirmation.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}
