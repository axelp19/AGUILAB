import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import styles from './AppLayout.module.css'

export default function AppLayout({ activePage, onNavigate, onLogout, title, subtitle, usuario, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavigate = (page, state) => {
    setSidebarOpen(false)
    onNavigate(page, state)
  }

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className={styles.layout}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        usuario={usuario}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {sidebarOpen && <button className={styles.backdrop} onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" />}
      <div className={styles.main}>
        <Topbar title={title} subtitle={subtitle} usuario={usuario} onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
