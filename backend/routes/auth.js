const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../config/db')
const {
  verificarToken,
  limitLoginAttempts,
  registerFailedLogin,
  clearFailedLogin,
} = require('../middleware/auth')

// POST /api/auth/login
router.post('/login', limitLoginAttempts, async (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contrasena requeridos' })
  }

  try {
    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE correo = ? AND activo = 1',
      [correo]
    )

    if (rows.length === 0) {
      registerFailedLogin(req)
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const usuario = rows[0]
    const valido = await bcrypt.compare(password, usuario.password_hash)
    if (!valido) {
      registerFailedLogin(req)
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    await db.execute(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [usuario.id]
    )
    clearFailedLogin(req)

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET || 'aguilab_secret_2026',
      { expiresIn: '8h' }
    )

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

// GET /api/auth/me
router.get('/me', verificarToken, (req, res) => {
  res.json({ usuario: req.usuario })
})

module.exports = router
