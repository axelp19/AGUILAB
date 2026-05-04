import { Building2, CircleAlert, LockKeyhole, Mail } from 'lucide-react'
import logoImg from '../assets/logo.png'
import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import styles from './Login.module.css'

export default function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      op: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#4488ff' : '#CC0000',
    }))

    const blobs = [
      { x: 0, y: 0, r: 420, color: 'rgba(0,60,180,0.35)', dx: 0.25, dy: 0.15 },
      { x: 0, y: 0, r: 350, color: 'rgba(180,0,0,0.25)', dx: -0.2, dy: 0.22 },
      { x: 0, y: 0, r: 300, color: 'rgba(0,40,140,0.28)', dx: 0.18, dy: -0.2 },
      { x: 0, y: 0, r: 260, color: 'rgba(150,0,0,0.2)', dx: -0.3, dy: -0.15 },
    ]

    blobs[0].x = window.innerWidth * 0.15
    blobs[0].y = window.innerHeight * 0.2
    blobs[1].x = window.innerWidth * 0.8
    blobs[1].y = window.innerHeight * 0.75
    blobs[2].x = window.innerWidth * 0.5
    blobs[2].y = window.innerHeight * 0.5
    blobs[3].x = window.innerWidth * 0.25
    blobs[3].y = window.innerHeight * 0.8

    let t = 0

    const draw = () => {
      const W = canvas.width
      const H = canvas.height

      ctx.clearRect(0, 0, W, H)
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#000d2e')
      bg.addColorStop(0.5, '#001a5c')
      bg.addColorStop(1, '#00082a')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      blobs.forEach(b => {
        b.x += b.dx
        b.y += b.dy
        if (b.x - b.r < 0 || b.x + b.r > W) b.dx *= -1
        if (b.y - b.r < 0 || b.y + b.r > H) b.dy *= -1
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, b.color)
        g.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      })

      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.025)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let y = 0; y < H; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
      ctx.restore()

      particles.forEach(p => {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.op + Math.sin(t + p.x) * 0.15
        ctx.fill()
        ctx.globalAlpha = 1
      })

      t += 0.012
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const correo = e.target.correo.value.trim()
    const password = e.target.password.value

    try {
      const data = await api.login(correo, password)
      onLogin(data.token, data.usuario)
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <img src={logoImg} alt="AguiLab" className={styles.logoImg} />
          <h1 className={styles.appName}>AguiLab</h1>
          <p className={styles.appSub}>Sistema de Gestión de Inventarios</p>
          <div className={styles.institucional}>
            <Building2 size={16} />
            Instituto Tecnológico de San Juan del Río
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Iniciar sesión</h2>
            <p>Ingresa con tu cuenta institucional</p>
          </div>

          {error && (
            <div className={styles.errorMsg}>
              <CircleAlert size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="correo">
                Correo institucional <span>*</span>
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <Mail size={16} />
                </span>
                <input id="correo" name="correo" type="email" placeholder="usuario@sjuanrio.tecnm.mx" required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">
                Contraseña <span>*</span>
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <LockKeyhole size={16} />
                </span>
                <input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" className={styles.btnLogin} disabled={loading}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>

          <hr className={styles.divider} />
          <p className={styles.helpText}>
            Acceso exclusivo para personal autorizado del ITSJR.
            <br />
            ¿Problemas? Contacta al administrador del sistema.
          </p>
          <div className={styles.tecFooter}>
            <span className={styles.tecBadge}>TecNM</span>
            Campus San Juan del Río · Querétaro
          </div>
        </div>
      </div>
    </div>
  )
}
