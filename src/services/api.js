// API client for Kraftly "Mina sidor" – campaign version
// Calls the API directly (no proxy yet, the widget on kraftly.se does the same). /M
const BASE_URL = 'http://localhost:4000'

const request = async (path, options = {}) => {
  const token = localStorage.getItem('kraftly_token')
  const res = await fetch(BASE_URL + path, {
    ...options,
    credentials: 'include', // send the session cookie too, same as the widget
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers
    }
  })
  if (!res.ok) {
    console.log('API error', res.status)
    throw new Error('API error ' + res.status)
  }
  return res.json()
}

export const login = (email, password) =>
  request('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })

export const fetchUser = () => request('/api/user')

export const fetchConsumption = () => request('/api/consumption')

export const fetchInvoices = () => request('/api/invoices')

export const fetchMessages = () => request('/api/messages')

export const submitMove = (data) =>
  request('/api/move', { method: 'POST', body: JSON.stringify(data) })

export const saveUser = (data) =>
  request('/api/user', { method: 'PUT', body: JSON.stringify(data) })
