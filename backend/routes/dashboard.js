const router = require('express').Router()
const db     = require('../config/db')
const { verificarToken } = require('../middleware/auth')

router.use(verificarToken)

// GET /api/dashboard — KPIs y datos del dashboard
router.get('/', async (req, res) => {
  try {
    let labFilter = ''
    const params = []
    if (req.usuario.rol !== 'administrador') {
      labFilter = `AND e.laboratorio_id IN (
        SELECT laboratorio_id FROM usuario_laboratorio WHERE usuario_id = ?
      )`
      params.push(req.usuario.id)
    }

    // KPIs
    const [[kpis]] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(estado = 'disponible')    AS disponibles,
        SUM(estado = 'mantenimiento') AS mantenimiento,
        SUM(estado = 'baja')          AS bajas
      FROM equipos e WHERE 1=1 ${labFilter}
    `, params)

    // Tickets abiertos
    const [[tkAbiertos]] = await db.execute(`
      SELECT COUNT(*) AS abiertos FROM tickets t
      LEFT JOIN equipos e ON e.id = t.equipo_id
      WHERE t.estado = 'abierto' ${labFilter}
    `, params)

    // Equipos por laboratorio (para gráfica de barras)
    const [porLab] = await db.execute(`
      SELECT l.nombre, COUNT(e.id) AS equipos
      FROM laboratorios l
      LEFT JOIN equipos e ON e.laboratorio_id = l.id
      ${req.usuario.rol !== 'administrador'
        ? 'INNER JOIN usuario_laboratorio ul ON ul.laboratorio_id = l.id AND ul.usuario_id = ' + req.usuario.id
        : ''}
      GROUP BY l.id ORDER BY l.nombre
    `)

    // Estado para pastel
    const [porEstado] = await db.execute(`
      SELECT estado, COUNT(*) AS total FROM equipos e WHERE 1=1 ${labFilter}
      GROUP BY estado
    `, params)

    // Actividad reciente
    const [actividad] = await db.execute(`
      SELECT la.*, u.nombre AS usuario_nombre
      FROM log_actividad la
      LEFT JOIN usuarios u ON u.id = la.usuario_id
      ORDER BY la.fecha DESC LIMIT 5
    `)

    // Resumen por laboratorio
    const [labs] = await db.execute(`
      SELECT l.nombre, l.id,
        COUNT(e.id) AS total,
        SUM(e.estado='disponible') AS disponibles
      FROM laboratorios l
      LEFT JOIN equipos e ON e.laboratorio_id = l.id
      ${req.usuario.rol !== 'administrador'
        ? 'INNER JOIN usuario_laboratorio ul ON ul.laboratorio_id = l.id AND ul.usuario_id = ' + req.usuario.id
        : ''}
      GROUP BY l.id ORDER BY l.nombre
    `)

    res.json({ kpis, ticketsAbiertos: tkAbiertos.abiertos, porLab, porEstado, actividad, labs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener datos del dashboard' })
  }
})

module.exports = router
