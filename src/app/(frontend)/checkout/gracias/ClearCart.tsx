'use client'
import { useEffect } from 'react'
import { writeCart } from '@/components/cart-store'

export function ClearCart() {
  useEffect(() => writeCart([]), [])
  return null
}
