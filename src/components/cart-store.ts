'use client'
import type { CartItem } from '@/lib/cart'

export type StoredItem = CartItem & { title: string }
const KEY = 'polilla-cart'

export const readCart = (): StoredItem[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
export const writeCart = (items: StoredItem[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
  window.dispatchEvent(new Event('cart'))
}
export const addToCart = (item: StoredItem) => {
  const items = readCart()
  const found = items.find((i) => i.bookId === item.bookId && i.format === item.format)
  if (found) {
    if (item.format === 'fisico') found.quantity += 1
  } else items.push(item)
  writeCart(items)
}
