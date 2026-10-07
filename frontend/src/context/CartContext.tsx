import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { CartLine, Product } from '../types'

type CartState = { lines: CartLine[] }
type Action = { type: 'add'; product: Product; quantity: number } | { type: 'set'; productId: number; quantity: number } | { type: 'remove'; productId: number } | { type: 'clear' }
const STORAGE_KEY = 'plate-pantry-cart'

export const cartReducer = (state: CartState, action: Action): CartState => {
  if (action.type === 'clear') return { lines: [] }
  if (action.type === 'remove') return { lines: state.lines.filter(line => line.product.id !== action.productId) }
  if (action.type === 'set') return { lines: state.lines.map(line => line.product.id === action.productId ? { ...line, quantity: Math.max(1, Math.min(action.quantity, Math.min(20, line.product.stockQuantity))) } : line) }
  const existing = state.lines.find(line => line.product.id === action.product.id)
  if (existing) return { lines: state.lines.map(line => line.product.id === action.product.id ? { ...line, quantity: Math.min(20, action.product.stockQuantity, line.quantity + action.quantity) } : line) }
  return { lines: [...state.lines, { product: action.product, quantity: Math.min(20, action.product.stockQuantity, Math.max(1, action.quantity)) }] }
}

const readInitial = (): CartState => {
  try { return { lines: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CartLine[] } } catch { return { lines: [] } }
}

type CartContextValue = CartState & { add: (product: Product, quantity?: number) => void; setQuantity: (id: number, quantity: number) => void; remove: (id: number) => void; clear: () => void; itemCount: number; subtotal: number }
const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, readInitial)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines)) }, [state.lines])
  const value = useMemo<CartContextValue>(() => ({
    ...state,
    add: (product, quantity = 1) => dispatch({ type: 'add', product, quantity }),
    setQuantity: (productId, quantity) => dispatch({ type: 'set', productId, quantity }),
    remove: productId => dispatch({ type: 'remove', productId }),
    clear: () => dispatch({ type: 'clear' }),
    itemCount: state.lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: state.lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  }), [state])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used within CartProvider')
  return value
}
