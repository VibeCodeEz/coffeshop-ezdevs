import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client with timeout configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true, // Enable auth persistence to maintain sessions across page reloads
    autoRefreshToken: true, // Automatically refresh tokens when they expire
    detectSessionInUrl: true, // Handle auth callbacks properly
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
})

// Timeout wrapper for Supabase queries
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
  })
  
  return Promise.race([promise, timeout])
}

// Connection test function - simplified for TypeScript compatibility
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing Supabase connection...')
    // Basic connection test
    const result = supabase.from('menu_items').select('*').limit(1)
    await result
    console.log('✅ Connection OK')
    return true
  } catch (error) {
    console.error('💥 Connection failed:', error)
    return false
  }
}

// Database Types
export interface MenuItemSize {
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large'
  price: number
  available: boolean
}

export interface MenuItemDB {
  id: string
  category_id: string
  name: string
  description: string
  base_price: number
  sizes?: MenuItemSize[] // New: Support for multiple sizes with different prices
  image_url?: string
  is_available: boolean
  is_featured: boolean
  preparation_time?: number
  calories?: number
  allergens?: string[]
  tags?: string[]
  display_order: number
  created_at: string
  updated_at: string
}

export interface OrderDB {
  id: number
  order_number: string
  customer_id?: string
  customer_email?: string
  items: OrderItemDB[]
  total_amount: number
  status: 'pending' | 'completed' | 'cancelled'
  payment_method?: string
  created_at: string
  updated_at: string
}

export interface OrderItemDB {
  menu_item_id: number
  quantity: number
  price: number
  size?: 'Small' | 'Medium' | 'Large' | 'Extra Large'
  size_price?: number // New: The price for the selected size
  menu_item?: MenuItemDB
}

export interface UserProfileDB {
  id: string
  email: string
  role: 'admin' | 'customer'
  full_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

// Helper Functions
export const generateOrderNumber = (): string => {
  return Math.floor(100 + Math.random() * 900).toString()
}

export const isAdmin = (email?: string): boolean => {
  return email === 'coffeeadmin@admin.com'
}

// Size and Pricing Helper Functions
export const getAvailableSizes = (item: MenuItemDB): MenuItemSize[] => {
  return item.sizes?.filter(size => size.available) || []
}

export const getPriceForSize = (item: MenuItemDB, selectedSize?: string): number => {
  if (!selectedSize || !item.sizes) {
    return item.base_price
  }
  
  const sizeOption = item.sizes.find(size => size.size === selectedSize)
  return sizeOption?.price || item.base_price
}

export const getDefaultSize = (item: MenuItemDB): MenuItemSize | null => {
  const availableSizes = getAvailableSizes(item)
  return availableSizes.length > 0 ? availableSizes[0] : null
}

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`
}

export const createDefaultSizes = (basePrice: number): MenuItemSize[] => {
  return [
    { size: 'Small', price: basePrice, available: true },
    { size: 'Medium', price: basePrice + 0.75, available: true },
    { size: 'Large', price: basePrice + 1.50, available: true },
    { size: 'Extra Large', price: basePrice + 2.25, available: true }
  ]
}