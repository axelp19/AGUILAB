const router = require('express').Router()
const db = require('../config/db')
const { verificarToken } = require('../middleware/auth')

router.use(verificarToken)

async function puedeGestionarLaboratorio(usuario, laboratorioId) {
  if (usuario.rol === 'administrador') return true

  const [rows] = await db.execute(
    'SELECT 1 FROM usuario_laboratorio WHERE usuario_id = ? AND laboratorio_id = ? LIMIT 1',
    [usuario.id, laboratorioId]
  )

  return rows.length > 0
}

async function puedeGestionarEquipo(usuario, equipoId) {
  if (usuario.rol === 'administrador') return true

  const [rows] = await db.execute(`
    SELECT 1
    FROM equipos e
    INNER JOIN usuario_laboratorio ul
      ON ul.laboratorio_id = e.laboratorio_id
     AND ul.usuario_id = ?
    WHERE e.id = ?
    LIMIT 1
  `, [usuario.id, equipoId])

  return rows.length > 0
}

// GET /api/equipos?laboratorio_id=&estado=&categoria=&incluir_bajas=
router.get('/', async (req, res) => {
  const { laboratorio_id, estado, categoria, incluir_bajas } = req.query

  try {
    const where = ['1=1']
    const params = []

    if (req.usuario.rol !== 'administrador') {
      where.push(`e.laboratorio_id IN (
        SELECT laboratorio_id FROM usuario_laboratorio WHERE usuario_id = ?
      )`)
      params.push(req.usuario.id)
    }

    if (laboratorio_id) {
      where.push('e.laboratorio_id = ?')
      params.push(laboratorio_id)
    }

    if (estado) {
      where.push('e.estado = ?')
      params.push(estado)
    } else if (incluir_bajas !== '1') {
      where.push("e.estado <> 'baja'")
    }

    if (categoria) {
      where.push('e.categoria = ?')
      params.push(categoria)
    }

    const [rows] = await db.execute(`
      SELECT e.*, l.nombre AS laboratorio_nombre
      FROM equipos e
      LEFT JOIN laboratorios l ON l.id = e.laboratorio_id
      WHERE ${where.join(' AND ')}
      ORDER BY e.fecha_registro DESC
    `, params)

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener equipos' })
  }
})

// GET /api/equipos/:id
router.get('/:id', async (req, res) => {
  try {
    if (!(await puedeGestionarEquipo(req.usuario, req.params.id))) {
      return res.status(403).json({ error: 'Sin permiso para ver este equipo' })
    }

    const [rows] = await db.execute(`
      SELECT e.*, l.nombre AS laboratorio_nombre
      FROM equipos e
      LEFT JOIN laboratorios l ON l.id = e.laboratorio_id
      WHERE e.id = ?
    `, [req.params.id])

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener equipo' })
  }
})

// POST /api/equipos
router.post('/', async (req, res) => {
  const { nombre, categoria, laboratorio_id, estado, marca, descripcion } = req.body
  if (!nombre || !categoria || !laboratorio_id) {
    return res.status(400).json({ error: 'Nombre, categoria y laboratorio son requeridos' })
  }

  try {
    if (!(await puedeGestionarLaboratorio(req.usuario, laboratorio_id))) {
      return res.status(403).json({ error: 'Sin permiso para registrar equipos en este laboratorio' })
    }

    const [labs] = await db.execute('SELECT nombre FROM laboratorios WHERE id = ?', [laboratorio_id])
    const [result] = await db.execute(
      'INSERT INTO equipos (nombre, categoria, laboratorio_id, estado, marca, descripcion) VALUES (?,?,?,?,?,?)',
      [nombre, categoria, laboratorio_id, estado || 'disponible', marca || null, descripcion || null]
    )

    await db.execute(
      'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
      ['CREAR', `Equipo "${nombre}" registrado`, labs[0]?.nombre || `Lab ID ${laboratorio_id}`, req.usuario.id]
    )

    res.status(201).json({ id: result.insertId, mensaje: 'Equipo creado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al crear equipo' })
  }
})

// PUT /api/equipos/:id
router.put('/:id', async (req, res) => {
  const { nombre, categoria, laboratorio_id, estado, marca, descripcion } = req.body

  try {
    if (!(await puedeGestionarEquipo(req.usuario, req.params.id))) {
      return res.status(403).json({ error: 'Sin permiso para editar este equipo' })
    }
    if (!(await puedeGestionarLaboratorio(req.usuario, laboratorio_id))) {
      return res.status(403).json({ error: 'Sin permiso para asignar este equipo a ese laboratorio' })
    }

    const [prev] = await db.execute('SELECT * FROM equipos WHERE id = ?', [req.params.id])
    await db.execute(
      'UPDATE equipos SET nombre = ?, categoria = ?, laboratorio_id = ?, estado = ?, marca = ?, descripcion = ? WHERE id = ?',
      [nombre, categoria, laboratorio_id, estado, marca || null, descripcion || null, req.params.id]
    )

    if (prev[0] && prev[0].estado !== estado) {
      await db.execute(
        'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
        ['EDITAR', `Equipo "${nombre}" -> Estado: ${estado}`, `ID ${req.params.id}`, req.usuario.id]
      )
    }

    res.json({ mensaje: 'Equipo actualizado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar equipo' })
  }
})

// DELETE /api/equipos/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!(await puedeGestionarEquipo(req.usuario, req.params.id))) {
      return res.status(403).json({ error: 'Sin permiso para dar de baja este equipo' })
    }

    const [rows] = await db.execute('SELECT nombre FROM equipos WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' })
    }

    await db.execute("UPDATE equipos SET estado = 'baja' WHERE id = ?", [req.params.id])
    await db.execute(
      'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
      ['BAJA', `Equipo "${rows[0].nombre}" dado de baja`, `ID ${req.params.id}`, req.usuario.id]
    )

    res.json({ mensaje: 'Equipo dado de baja' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al dar de baja' })
  }
})

module.exports = router
