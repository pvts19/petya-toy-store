export type Product = {
  id: number
  category_id: number
  name: string
  description: string
  price: string
  stock: number
  age_from: number
  image_url?: string | null
}

const API_URL = 'http://localhost:8000/api'

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const detail = body.detail
    if (typeof detail === 'string') throw new Error(detail)
    if (Array.isArray(detail)) {
      throw new Error(detail.map((item) => item?.msg || 'Проверьте введённые данные').join('; '))
    }
    throw new Error(detail ? JSON.stringify(detail) : 'Не удалось выполнить запрос')
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export async function getProducts(search = '', category = '', age = '', ordering = 'newest'): Promise<Product[]> {
  const categoryParam = category ? `&category=${category}` : ''
  const ageParam = age ? `&age=${age}` : ''
  return request<Product[]>(`/products?search=${encodeURIComponent(search)}${categoryParam}${ageParam}&ordering=${ordering}`)
}

export type CartItem = { product_id: number; product_name: string; unit_price: string; quantity: number; subtotal: string }
export type Order = { id: number; total_amount: string; status: string; customer_name: string; phone: string; address: string }
export type User = { id: number; email: string; name: string; role: string }
export type Category = { id: number; name: string; description?: string }

export async function register(email: string, name: string, password: string) {
  return request<{ id: number; name: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) })
}
export async function login(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password })
  const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', body })
  if (!response.ok) throw new Error('Неверный email или пароль')
  return response.json() as Promise<{ access_token: string }>
}
export function getCart(token: string) { return request<CartItem[]>('/cart', {}, token) }
export function addToCart(token: string, product_id: number) { return request<CartItem>('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity: 1 }) }, token) }
export function removeFromCart(token: string, product_id: number) { return request<void>(`/cart/${product_id}`, { method: 'DELETE' }, token) }
export function createOrder(token: string, data: { customer_name: string; phone: string; address: string }) { return request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }, token) }
export function getOrders(token: string) { return request<Order[]>('/orders', {}, token) }
export function getMe(token: string) { return request<User>('/auth/me', {}, token) }
export function getCategories() { return request<Category[]>('/categories') }
export function createProduct(token: string, data: object) { return request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, token) }
export function deleteProduct(token: string, id: number) { return request<void>(`/products/${id}`, { method: 'DELETE' }, token) }
export function getAllOrders(token: string) { return request<Order[]>('/admin/orders', {}, token) }
export function updateOrderStatus(token: string, id: number, status: string) { return request<Order>(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }, token) }
