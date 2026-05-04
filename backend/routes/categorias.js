const router = require('express').Router()
const db     = require('../config/db')
const { verificarToken, soloAdmin } = require('../middleware/auth')

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, COUNT(e.id) AS total_equipos
      FROM categorias c
      LEFT JOIN equipos e ON e.categoria = c.nombre
      GROUP BY c.id ORDER BY c.nombre
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

router.post('/', soloAdmin, async (req, res) => {
  const { nombre, emoji, descripcion } = req.body
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })
  try {
    const [r] = await db.execute(
      'INSERT INTO categorias (nombre, emoji, descripcion) VALUES (?,?,?)',
      [nombre, emoji || '📦', descripcion]
    )
    res.status(201).json({ id: r.insertId })
  } catch (err) {
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

router.put('/:id', soloAdmin, async (req, res) => {
  const { nombre, emoji, descripcion } = req.body
  try {
    await db.execute(
      'UPDATE categorias SET nombre=?,emoji=?,descripcion=? WHERE id=?',
      [nombre, emoji, descripcion, req.params.id]
    )
    res.json({ mensaje: 'Categoría actualizada' })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM categorias WHERE id=?', [req.params.id])
    res.json({ mensaje: 'Categoría eliminada' })
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' })
  }
})

module.exports = router
