import {
  BarChart3,
  Building2,
  Home,
  LogOut,
  Package,
  Settings,
  Ticket,
  X,
} from 'lucide-react'
import logoImg from '../../assets/logo.png'
import styles from './Sidebar.module.css'

const navItems = [
  { id: 'dashboard', icon: Home, label: 'Dashboard' },
  { section: 'Gestión' },
  { id: 'laboratorios', icon: Building2, label: 'Laboratorios' },
  { id: 'equipos', icon: Package, label: 'Inventario' },
  { id: 'tickets', icon: Ticket, label: 'Tickets' },
  { id: 'reportes', icon: BarChart3, label: 'Reportes' },
  { section: 'Administración', adminOnly: true },
  { id: 'admin', icon: Settings, label: 'Administración', adminOnly: true },
]

export default function Sidebar({ activePage, onNavigate, onLogout, usuario, isOpen, onClose }) {
  const esAdmin = usuario?.rol === 'administrador'

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.mobileHeader}>
        <span>Menú</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
          <X size={18} />
        </button>
      </div>

      <div className={styles.brand}>
        <img src={logoImg} alt="AguiLab Logo" className={styles.logoImg} />
        <div>
          <div className={styles.brandTitle}>AguiLab</div>
          <div className={styles.brandSub}>ITSJR · TecNM</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item, i) => {
          if (item.adminOnly && !esAdmin) return null

          if (item.section) {
            return (
              <div key={i} className={styles.navSection}>
                {item.section}
              </div>
            )
          }

          const Icon = item.icon

          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={styles.navIcon}>
                <Icon size={18} strokeWidth={2.1} />
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <button className={styles.logoutBtn} onClick={onLogout}>
        <LogOut size={16} />
        Cerrar sesión
      </button>

      <div className={styles.footer}>
        🦅 AguiLab · v2.2.0
        <br />
        <span>© 2026 TecNM Campus SJR</span>
      </div>
    </aside>
  )
}
