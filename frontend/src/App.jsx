import { useState, useEffect } from 'react'
import './styles/global.css'
import { api, clearToken, getToken, setToken } from './api'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Laboratorios from './pages/Laboratorios'
import Equipos from './pages/Inventario'
import Tickets from './pages/Tickets'
import Reportes from './pages/Reportes'
import Admin from './pages/Admin'

const pageTitles = {
  dashboard: { title: 'Dashboard', subtitle: '/ Inicio' },
  laboratorios: { title: 'Laboratorios', subtitle: '' },
  equipos: { title: 'Inventario', subtitle: '' },
  tickets: { title: 'Tickets', subtitle: '' },
  reportes: { title: 'Reportes', subtitle: '' },
  admin: { title: 'Administración', subtitle: '' },
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState({ page: 'dashboard', state: null })

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then(data => setUsuario(data.usuario))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = (token, user) => {
    setToken(token)
    setUsuario(user)
    setRoute({ page: 'dashboard', state: null })
  }

  const handleLogout = () => {
    clearToken()
    setUsuario(null)
    setRoute({ page: 'dashboard', state: null })
  }

  const handleNavigate = (page, state = null) => {
    setRoute({ page, state })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001a5c' }}>
        <div style={{ color: '#fff', fontFamily: 'Nunito,sans-serif', fontSize: '1.1rem' }}>Cargando AguiLab...</div>
      </div>
    )
  }

  if (!usuario) {
    return <Login onLogin={handleLogin} />
  }

  const { page, state } = route
  const { title, subtitle } = pageTitles[page] || pageTitles.dashboard
  const props = {
    activePage: page,
    navigationState: state,
    onNavigate: handleNavigate,
    onLogout: handleLogout,
    title,
    subtitle,
    usuario,
  }

  const paginaAdmin = usuario.rol === 'administrador'

  return (
    <>
      {page === 'dashboard' && <Dashboard {...props} />}
      {page === 'laboratorios' && <Laboratorios {...props} />}
      {page === 'equipos' && <Equipos {...props} />}
      {page === 'tickets' && <Tickets {...props} />}
      {page === 'reportes' && <Reportes {...props} />}
      {page === 'admin' && paginaAdmin && <Admin {...props} />}
      {page === 'admin' && !paginaAdmin && <Dashboard {...props} />}
    </>
  )
}
