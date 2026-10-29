const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { const data = await response.json(); message = data.detail || message } catch {}
    throw new Error(message)
  }
  return response.json()
}
export const api = {
  health: () => request('/api/health'),
  products: (search = '', category = 'All') => request(`/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  recommendations: (userId = 'demo-user') => request(`/api/recommendations/${encodeURIComponent(userId)}`),
  similar: (id) => request(`/api/recommendations/product/${encodeURIComponent(id)}`),
  preferences: (userId, preferences) => request(`/api/users/${encodeURIComponent(userId)}/preferences`, { method: 'PUT', body: JSON.stringify({ preferences }) }),
  purchase: (product_id, quantity = 1, user_id = 'demo-user') => request('/api/purchases', { method: 'POST', body: JSON.stringify({ product_id, quantity, user_id }) }),
  overview: () => request('/api/analytics/overview'),
  categories: () => request('/api/analytics/categories'),
  topProducts: () => request('/api/analytics/top-products')
}
