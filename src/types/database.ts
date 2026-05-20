export type UserRole = 'admin' | 'salarie'
export type PaymentMode = 'cash' | 'transfer' | 'check'
export type StockType = 'normal' | 'serigraphie'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  location: string
  phone: string
  credit: number
  notes: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
  color: string
  sort_order: number
  product_count?: number
}

export interface Product {
  id: string
  name: string
  category_id: string
  stock: number
  price: number
  cost_price: number
  stock_type: StockType
  low_stock_threshold: number
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Sale {
  id: string
  ref_number: string
  date: string
  client_id: string | null
  total_amount: number
  payment_mode: PaymentMode
  is_credit: boolean
  credit_amount: number
  is_gift: boolean
  notes: string
  created_by: string
  created_at: string
  updated_at: string
  client?: Client
  creator?: Profile
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  is_special: boolean
}

export interface Supplier {
  id: string
  name: string
  phone: string
  location: string
  credit: number
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  ref_number: string
  date: string
  supplier_id: string | null
  total_amount: number
  payment_mode: PaymentMode
  is_credit: boolean
  credit_amount: number
  notes: string
  created_by: string
  created_at: string
  updated_at: string
  supplier?: Supplier
  creator?: Profile
}

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_cost: number
  subtotal: number
}

export interface Expense {
  id: string
  date: string
  description: string
  amount: number
  category: string
  created_by: string
  created_at: string
}

export interface DashboardStats {
  revenue: number
  purchases: number
  expenses: number
  profit: number
  margin: number
  total_receivables: number
  sale_count: number
}

export interface SaleFormArticle {
  id: string
  product_id: string | null
  name: string
  stock: number
  qty: number
  price: number
  is_special: boolean
}
