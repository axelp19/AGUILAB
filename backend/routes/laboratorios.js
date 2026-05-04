const router = require('express').Router()
const db     = require('../config/db')
const { verificarToken, soloAdmin } = require('../middleware/auth')

router.use(verificarToken)

// GET /api/laboratorios
router.get('/', async (req, res) => {
  try {
    // Si es encargado, solo devuelve sus laboratorios asignados
    let query, params
    if (req.usuario.rol === 'administrador') {
      query = `
        SELECT l.*,
          COUNT(DISTINCT e.id) AS total_equipos,
          SUM(e.estado = 'disponible')    AS disponibles,
          SUM(e.estado = 'mantenimiento') AS mantenimiento,
          SUM(e.estado = 'baja')          AS bajas
        FROM laboratorios l
        LEFT JOIN equipos e ON e.laboratorio_id = l.id
        GROUP BY l.id
        ORDER BY l.nombre`
      params = []
    } else {
      query = `
        SELECT l.*,
          COUNT(DISTINCT e.id) AS total_equipos,
          SUM(e.estado = 'disponible')    AS disponibles,
          SUM(e.estado = 'mantenimiento') AS mantenimiento,
          SUM(e.estado = 'baja')          AS bajas
        FROM laboratorios l
        INNER JOIN usuario_laboratorio ul ON ul.laboratorio_id = l.id AND ul.usuario_id = ?
        LEFT JOIN equipos e ON e.laboratorio_id = l.id
        GROUP BY l.id
        ORDER BY l.nombre`
      params = [req.usuario.id]
    }
    const [rows] = await db.execute(query, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener laboratorios' })
  }
})

// POST /api/laboratorios — solo admin
router.post('/', soloAdmin, async (req, res) => {
  const { nombre, clave, piso, edificio, responsable } = req.body
  if (!nombre || !clave) return res.status(400).json({ error: 'Nombre y clave requeridos' })
  try {
    const [r] = await db.execute(
      'INSERT INTO laboratorios (nombre, clave, piso, edificio, responsable) VALUES (?,?,?,?,?)',
      [nombre, clave, piso, edificio, responsable]
    )
    res.status(201).json({ id: r.insertId, mensaje: 'Laboratorio creado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear laboratorio' })
  }
})

// PUT /api/laboratorios/:id — solo admin
router.put('/:id', soloAdmin, async (req, res) => {
  const { nombre, clave, piso, edificio, responsable } = req.body
  try {
    await db.execute(
      'UPDATE laboratorios SET nombre=?,clave=?,piso=?,edificio=?,responsable=? WHERE id=?',
      [nombre, clave, piso, edificio, responsable, req.params.id]
    )
    res.json({ mensaje: 'Laboratorio actualizado' })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

// DELETE /api/laboratorios/:id — solo admin
router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM laboratorios WHERE id=?', [req.params.id])
    res.json({ mensaje: 'Laboratorio eliminado' })
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' })
  }
})

module.exports = router
