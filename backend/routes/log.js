const router = require('express').Router()
const db     = require('../config/db')
const { verificarToken, soloAdmin } = require('../middleware/auth')

router.use(verificarToken, soloAdmin)

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT la.*, u.nombre AS usuario_nombre
      FROM log_actividad la
      LEFT JOIN usuarios u ON u.id = la.usuario_id
      ORDER BY la.fecha DESC LIMIT 100
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener log' })
  }
})

module.exports = router
