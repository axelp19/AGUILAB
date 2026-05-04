const jwt = require('jsonwebtoken')

const loginAttempts = new Map()
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5

function getClientKey(req) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown'
  const correo = String(req.body?.correo || '').trim().toLowerCase()
  return `${ip}:${correo}`
}

function cleanupExpiredAttempts(now) {
  for (const [key, value] of loginAttempts.entries()) {
    if (value.expiresAt <= now) loginAttempts.delete(key)
  }
}

function limitLoginAttempts(req, res, next) {
  const now = Date.now()
  cleanupExpiredAttempts(now)

  const key = getClientKey(req)
  const entry = loginAttempts.get(key)
  if (entry && entry.count >= MAX_LOGIN_ATTEMPTS && entry.expiresAt > now) {
    const retryAfter = Math.ceil((entry.expiresAt - now) / 1000)
    res.setHeader('Retry-After', retryAfter)
    return res.status(429).json({
      error: 'Demasiados intentos de inicio de sesion. Intenta de nuevo en unos minutos.',
    })
  }

  req.loginAttemptKey = key
  next()
}

function registerFailedLogin(req) {
  const now = Date.now()
  const key = req.loginAttemptKey || getClientKey(req)
  const current = loginAttempts.get(key)

  if (!current || current.expiresAt <= now) {
    loginAttempts.set(key, { count: 1, expiresAt: now + LOGIN_WINDOW_MS })
    return
  }

  current.count += 1
  loginAttempts.set(key, current)
}

function clearFailedLogin(req) {
  const key = req.loginAttemptKey || getClientKey(req)
  loginAttempts.delete(key)
}

function verificarToken(req, res, next) {
  const header = req.headers['authorization']
  if (!header) return res.status(401).json({ error: 'Token requerido' })

  const token = header.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token inválido' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aguilab_secret_2026')
    req.usuario = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token expirado o inválido' })
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores' })
  }
  next()
}

module.exports = {
  verificarToken,
  soloAdmin,
  limitLoginAttempts,
  registerFailedLogin,
  clearFailedLogin,
}
