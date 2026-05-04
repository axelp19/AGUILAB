const router = require('express').Router()
const db     = require('../config/db')
const { verificarToken } = require('../middleware/auth')

router.use(verificarToken)

// GET /api/tickets?estado=&prioridad=
router.get('/', async (req, res) => {
  const { estado, prioridad } = req.query
  try {
    let where = ['1=1']
    const params = []

    if (req.usuario.rol !== 'administrador') {
      where.push(`e.laboratorio_id IN (
        SELECT laboratorio_id FROM usuario_laboratorio WHERE usuario_id = ?
      )`)
      params.push(req.usuario.id)
    }
    if (estado)    { where.push('t.estado = ?');    params.push(estado)    }
    if (prioridad) { where.push('t.prioridad = ?'); params.push(prioridad) }

    const [rows] = await db.execute(`
      SELECT t.*, e.nombre AS equipo_nombre, l.nombre AS lab_nombre,
             u.nombre AS reporto_nombre
      FROM tickets t
      LEFT JOIN equipos e ON e.id = t.equipo_id
      LEFT JOIN laboratorios l ON l.id = e.laboratorio_id
      LEFT JOIN usuarios u ON u.id = t.usuario_id
      WHERE ${where.join(' AND ')}
      ORDER BY t.fecha_creacion DESC
    `, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener tickets' })
  }
})

// POST /api/tickets
router.post('/', async (req, res) => {
  const { equipo_id, tipo, prioridad, descripcion } = req.body
  if (!equipo_id || !tipo || !descripcion)
    return res.status(400).json({ error: 'Equipo, tipo y descripción son requeridos' })
  try {
    const [r] = await db.execute(
      'INSERT INTO tickets (equipo_id, tipo, prioridad, descripcion, usuario_id) VALUES (?,?,?,?,?)',
      [equipo_id, tipo, prioridad || 'media', descripcion, req.usuario.id]
    )
    await db.execute(
      'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
      ['CREAR', `Ticket #${r.insertId} abierto`, `Equipo ID ${equipo_id} · ${tipo}`, req.usuario.id]
    )
    res.status(201).json({ id: r.insertId, mensaje: 'Ticket creado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear ticket' })
  }
})

// PUT /api/tickets/:id — actualizar estado
router.put('/:id', async (req, res) => {
  const { estado } = req.body
  if (!estado) return res.status(400).json({ error: 'Estado requerido' })
  try {
    await db.execute('UPDATE tickets SET estado=? WHERE id=?', [estado, req.params.id])
    await db.execute(
      'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
      ['EDITAR', `Ticket #${req.params.id} → ${estado}`, '', req.usuario.id]
    )
    res.json({ mensaje: 'Ticket actualizado' })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar ticket' })
  }
})

module.exports = router
