const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'aguilab_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(method, path, body) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const opts = {
    method,
    headers,
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401) clearToken()
    throw new Error(data?.error || 'Error en la solicitud')
  }
  return data
}

export const api = {
  // Auth
  login:  (correo, password) => request('POST', '/auth/login', { correo, password }),
  me:     ()                 => request('GET',  '/auth/me'),

  // Dashboard
  dashboard: () => request('GET', '/dashboard/'),

  // Laboratorios
  getLabs:    ()       => request('GET',    '/laboratorios/'),
  createLab:  (data)   => request('POST',   '/laboratorios/', data),
  updateLab:  (id, d)  => request('PUT',    `/laboratorios/${id}`, d),
  deleteLab:  (id)     => request('DELETE', `/laboratorios/${id}`),

  // Equipos
  getEquipos:   (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/equipos/${q ? '?' + q : ''}`)
  },
  getEquipo:    (id)       => request('GET',    `/equipos/${id}`),
  createEquipo: (data)     => request('POST',   '/equipos/', data),
  updateEquipo: (id, data) => request('PUT',    `/equipos/${id}`, data),
  deleteEquipo: (id)       => request('DELETE', `/equipos/${id}`),

  // Tickets
  getTickets:   (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/tickets/${q ? '?' + q : ''}`)
  },
  createTicket: (data)     => request('POST', '/tickets/', data),
  updateTicket: (id, data) => request('PUT',  `/tickets/${id}`, data),

  // Categorías
  getCategorias:   ()           => request('GET',    '/categorias/'),
  createCategoria: (data)       => request('POST',   '/categorias/', data),
  updateCategoria: (id, data)   => request('PUT',    `/categorias/${id}`, data),
  deleteCategoria: (id)         => request('DELETE', `/categorias/${id}`),

  // Usuarios
  getUsuarios:   ()           => request('GET',    '/usuarios/'),
  createUsuario: (data)       => request('POST',   '/usuarios/', data),
  updateUsuario: (id, data)   => request('PUT',    `/usuarios/${id}`, data),
  deleteUsuario: (id)         => request('DELETE', `/usuarios/${id}`),

  // Log
  getLog: () => request('GET', '/log/'),
}
