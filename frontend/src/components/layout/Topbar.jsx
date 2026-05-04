import { Menu } from 'lucide-react'
import styles from './Topbar.module.css'

function getInitials(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map(parte => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Topbar({ title, subtitle, usuario, onMenuToggle }) {
  const nombre = usuario?.nombre || 'Usuario'
  const rol = usuario?.rol === 'administrador' ? 'Administrador' : 'Encargado'
  const iniciales = getInitials(nombre) || 'US'

  return (
    <header className={styles.topbar}>
      <button className={styles.menuBtn} onClick={onMenuToggle} aria-label="Abrir menú">
        <Menu size={20} />
      </button>
      <div className={styles.title}>
        {title} <span className={styles.subtitle}>{subtitle}</span>
      </div>
      <div className={styles.actions}>
        <div className={styles.avatar} title={nombre}>{iniciales}</div>
        <div className={styles.userMeta}>
          <span className={styles.userName}>{nombre}</span>
          <span className={styles.userRole}>{rol}</span>
        </div>
      </div>
    </header>
  )
}
