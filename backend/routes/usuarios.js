const router = require('express').Router()
const bcrypt = require('bcryptjs')
const db     = require('../config/db')
const { verificarToken, soloAdmin } = require('../middleware/auth')

// Todos los endpoints requieren token
router.use(verificarToken)

// GET /api/usuarios — listar (admin ve todos, encargado solo se ve a sí mismo)
router.get('/', async (req, res) => {
  try {
    let query, params
    if (req.usuario.rol === 'administrador') {
      // Admin ve todos los usuarios con sus laboratorios asignados
      query = `
        SELECT u.id, u.nombre, u.correo, u.rol, u.activo, u.ultimo_acceso,
              GROUP_CONCAT(l.nombre SEPARATOR ', ') AS laboratorios
        FROM usuarios u
        LEFT JOIN usuario_laboratorio ul ON u.id = ul.usuario_id
        LEFT JOIN laboratorios l ON ul.laboratorio_id = l.id
        GROUP BY u.id
        ORDER BY u.nombre`
      params = []
    } else {
      query  = 'SELECT id, nombre, correo, rol, activo, ultimo_acceso FROM usuarios WHERE id = ?'
      params = [req.usuario.id]
    }
    const [rows] = await db.execute(query, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// POST /api/usuarios — crear (solo admin)
router.post('/', soloAdmin, async (req, res) => {
  const { nombre, correo, password, rol, laboratorios } = req.body
  if (!nombre || !correo || !password || !rol)
    return res.status(400).json({ error: 'Faltan campos obligatorios' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const [result] = await db.execute(
      'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)',
      [nombre, correo, hash, rol]
    )
    const userId = result.insertId

    // Asignar laboratorios si viene el arreglo
    if (laboratorios && laboratorios.length > 0) {
      const values = laboratorios.map(labId => [userId, labId])
      await db.query('INSERT INTO usuario_laboratorio (usuario_id, laboratorio_id) VALUES ?', [values])
    }

    res.status(201).json({ id: userId, mensaje: 'Usuario creado correctamente' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'El correo ya está registrado' })
    console.error(err)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

// PUT /api/usuarios/:id — editar (admin edita cualquiera, encargado solo su perfil)
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  if (req.usuario.rol !== 'administrador' && req.usuario.id !== id)
    return res.status(403).json({ error: 'Sin permiso' })

  const { nombre, correo, password, rol, activo, laboratorios } = req.body
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await db.execute(
        'UPDATE usuarios SET nombre=?, correo=?, password_hash=?, rol=?, activo=? WHERE id=?',
        [nombre, correo, hash, rol, activo ?? 1, id]
      )
    } else {
      await db.execute(
        'UPDATE usuarios SET nombre=?, correo=?, rol=?, activo=? WHERE id=?',
        [nombre, correo, rol, activo ?? 1, id]
      )
    }

    // Reasignar laboratorios si se envían (solo admin)
    if (req.usuario.rol === 'administrador' && laboratorios !== undefined) {
      await db.execute('DELETE FROM usuario_laboratorio WHERE usuario_id = ?', [id])
      if (laboratorios.length > 0) {
        const values = laboratorios.map(labId => [id, labId])
        await db.query('INSERT INTO usuario_laboratorio (usuario_id, laboratorio_id) VALUES ?', [values])
      }
    }

    res.json({ mensaje: 'Usuario actualizado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// DELETE /api/usuarios/:id — desactivar (solo admin)
router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    await db.execute('UPDATE usuarios SET activo = 0 WHERE id = ?', [req.params.id])
    res.json({ mensaje: 'Usuario desactivado' })
  } catch (err) {
    res.status(500).json({ error: 'Error al desactivar usuario' })
  }
})

module.exports = router