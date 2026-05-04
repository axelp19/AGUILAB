import { Search, X } from 'lucide-react'
import styles from './Modal.module.css'

export function Modal({ show, onClose, title, children, size = 'md' }) {
  if (!show) return null

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles[size]}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Badge({ type, children }) {
  const map = {
    disponible: { bg: 'var(--verde-light)', color: 'var(--verde)' },
    mantenimiento: { bg: 'var(--naranja-light)', color: 'var(--naranja)' },
    baja: { bg: 'var(--rojo-light)', color: 'var(--rojo)' },
    en_uso: { bg: 'var(--azul-light)', color: 'var(--azul)' },
    abierto: { bg: 'var(--rojo-light)', color: 'var(--rojo)' },
    proceso: { bg: 'var(--naranja-light)', color: 'var(--naranja)' },
    cerrado: { bg: 'var(--verde-light)', color: 'var(--verde)' },
    administrador: { bg: 'var(--azul-light)', color: 'var(--azul)' },
    encargado: { bg: 'var(--gris-200)', color: 'var(--gris-600)' },
    alta: { bg: 'var(--rojo-light)', color: 'var(--rojo)' },
    media: { bg: 'var(--naranja-light)', color: 'var(--naranja)' },
    baja_p: { bg: 'var(--azul-light)', color: 'var(--azul)' },
  }

  const s = map[type] || { bg: 'var(--gris-200)', color: 'var(--gris-600)' }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: '.72rem',
        fontWeight: 700,
        background: s.bg,
        color: s.color,
      }}
    >
      • {children}
    </span>
  )
}

export function Btn({ variant = 'primary', size = 'md', onClick, children, disabled, style, ...rest }) {
  const variants = {
    primary: { background: 'var(--azul)', color: '#fff', border: 'none' },
    danger: { background: 'var(--rojo)', color: '#fff', border: 'none' },
    success: { background: 'var(--verde)', color: '#fff', border: 'none' },
    warn: { background: 'var(--naranja)', color: '#fff', border: 'none' },
    outline: { background: 'transparent', color: 'var(--azul)', border: '1.5px solid var(--azul)' },
    ghost: { background: 'var(--gris-100)', color: 'var(--gris-600)', border: 'none' },
  }

  const sizes = {
    sm: { padding: '6px 14px', fontSize: '.78rem' },
    md: { padding: '9px 20px', fontSize: '.85rem' },
    lg: { padding: '12px 28px', fontSize: '.95rem' },
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius)',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        transition: 'transform .12s, box-shadow .12s, opacity .12s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}

export function KpiCard({ label, value, sub, accent = 'blue' }) {
  const colors = {
    blue: 'var(--azul)',
    red: 'var(--rojo)',
    green: 'var(--verde)',
    orange: 'var(--naranja)',
  }

  return (
    <div
      style={{
        background: 'var(--blanco)',
        borderRadius: 'var(--radius)',
        padding: 20,
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--gris-200)',
        borderTop: `4px solid ${colors[accent]}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      <div style={{ fontSize: '.73rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2rem', fontWeight: 800, color: colors[accent], lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--gris-400)' }}>{sub}</div>}
    </div>
  )
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: 'var(--blanco)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--gris-200)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ icon, title, actions }) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--gris-200)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--azul)' }}>{icon}</span>}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--azul)', flex: 1 }}>
        {title}
      </div>
      {actions}
    </div>
  )
}

export function CardBody({ children, noPad }) {
  return <div style={{ padding: noPad ? 0 : 20 }}>{children}</div>
}

export function FormGroup({ label, required, children, fullWidth }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <label style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--gris-600)' }}>
        {label} {required && <span style={{ color: 'var(--rojo)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function Input({ placeholder, type = 'text', value, defaultValue, style, ...rest }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      {...rest}
      style={{
        padding: '9px 13px',
        border: '1.5px solid var(--gris-200)',
        borderRadius: 8,
        fontSize: '.85rem',
        color: 'var(--gris-800)',
        outline: 'none',
        transition: 'border-color .15s',
        width: '100%',
        ...style,
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--azul)')}
      onBlur={e => (e.target.style.borderColor = 'var(--gris-200)')}
    />
  )
}

export function Select({ options, defaultValue, value, style, ...rest }) {
  return (
    <select
      value={value}
      defaultValue={defaultValue}
      {...rest}
      style={{
        padding: '9px 13px',
        border: '1.5px solid var(--gris-200)',
        borderRadius: 8,
        fontSize: '.85rem',
        color: 'var(--gris-800)',
        outline: 'none',
        background: 'var(--blanco)',
        width: '100%',
        ...style,
      }}
    >
      {options.map(opt => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  )
}

export function Textarea({ placeholder, defaultValue, value, style, ...rest }) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      rows={4}
      {...rest}
      style={{
        padding: '9px 13px',
        border: '1.5px solid var(--gris-200)',
        borderRadius: 8,
        fontSize: '.85rem',
        color: 'var(--gris-800)',
        outline: 'none',
        resize: 'vertical',
        width: '100%',
        fontFamily: 'Nunito, sans-serif',
        ...style,
      }}
    />
  )
}

export function PageHeader({ title, breadcrumb, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.7rem', fontWeight: 700, color: 'var(--azul)' }}>{title}</h1>
        {breadcrumb && <div style={{ fontSize: '.78rem', color: 'var(--gris-400)', marginTop: 2 }}>{breadcrumb}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

export function Divider() {
  return <div style={{ height: 1, background: 'var(--gris-200)', margin: '18px 0' }} />
}

export function SearchBar({ placeholder, style, ...rest }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200, ...style }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gris-400)', display: 'inline-flex' }}>
        <Search size={16} />
      </span>
      <input
        placeholder={placeholder || 'Buscar...'}
        {...rest}
        style={{
          width: '100%',
          padding: '9px 14px 9px 34px',
          border: '1.5px solid var(--gris-200)',
          borderRadius: 8,
          fontSize: '.85rem',
          outline: 'none',
          fontFamily: 'Nunito, sans-serif',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--azul)')}
        onBlur={e => (e.target.style.borderColor = 'var(--gris-200)')}
      />
    </div>
  )
}
