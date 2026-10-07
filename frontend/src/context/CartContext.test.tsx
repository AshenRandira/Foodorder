import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import { cartReducer } from './CartContext'

const product: Product = { id: 1, name: 'Chicken Kottu', slug: 'chicken-kottu', description: 'Fresh', price: 1200, imageUrl: 'https://example.com/kottu.jpg', stockQuantity: 4, available: true, active: true, featured: true, category: { id: 1, name: 'Kottu', slug: 'kottu', active: true, sortOrder: 1 } }

describe('cartReducer', () => {
  it('adds the same product and caps quantity at available stock', () => {
    const first = cartReducer({ lines: [] }, { type: 'add', product, quantity: 3 })
    const second = cartReducer(first, { type: 'add', product, quantity: 3 })
    expect(second.lines).toHaveLength(1)
    expect(second.lines[0].quantity).toBe(4)
  })
  it('removes a product without changing other lines', () => {
    const state = cartReducer({ lines: [{ product, quantity: 2 }] }, { type: 'remove', productId: 1 })
    expect(state.lines).toEqual([])
  })
})
