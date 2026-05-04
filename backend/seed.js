require('dotenv').config()
const bcrypt = require('bcryptjs')
const db     = require('./config/db')

async function seed() {
  try {
    const usuarios = [
      {
        nombre:   'Administrador General',
        correo:   'admin@sjuanrio.tecnm.mx',
        password: 'Admin2026!',
        rol:      'administrador',
        labs:     []          // vacío = acceso a todos
      },
      {
        nombre:   'Ariopajita Rojo López',
        correo:   'arojo@sjuanrio.tecnm.mx',
        password: 'Maestro2026!',
        rol:      'administrador',
        labs:     []
      },
      {
        nombre:   'Axel Ponce',
        correo:   'l22590349@sjuanrio.tecnm.mx',
        password: 'Encargado2026!',
        rol:      'encargado',
        labs:     [1, 2]      // Lab LRS y Lab LSO
      },
    ]

    for (const u of usuarios) {
      const hash = await bcrypt.hash(u.password, 10)
      const [existing] = await db.execute('SELECT id FROM usuarios WHERE correo=?', [u.correo])

      let userId
      if (existing.length > 0) {
        userId = existing[0].id
        await db.execute(
          'UPDATE usuarios SET nombre=?,password_hash=?,rol=? WHERE id=?',
          [u.nombre, hash, u.rol, userId]
        )
        console.log(`✏️  Actualizado: ${u.correo}`)
      } else {
        const [r] = await db.execute(
          'INSERT INTO usuarios (nombre,correo,password_hash,rol) VALUES (?,?,?,?)',
          [u.nombre, u.correo, hash, u.rol]
        )
        userId = r.insertId
        console.log(`✅ Creado: ${u.correo}`)
      }

      // Asignar laboratorios
      await db.execute('DELETE FROM usuario_laboratorio WHERE usuario_id=?', [userId])
      if (u.labs.length > 0) {
        const vals = u.labs.map(l => [userId, l])
        await db.query('INSERT INTO usuario_laboratorio (usuario_id,laboratorio_id) VALUES ?', [vals])
      }
    }

    console.log('\n🎉 Seed completado.')
    console.log('─────────────────────────────────────────')
    console.log('  admin@sjuanrio.tecnm.mx   → Admin2026!')
    console.log('  arojo@sjuanrio.tecnm.mx   → Maestro2026!')
    console.log('  l22590349@sjuanrio.tecnm.mx    → Encargado2026!')
    console.log('─────────────────────────────────────────')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error en seed:', err.message)
    process.exit(1)
  }
}

seed()
