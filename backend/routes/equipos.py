from flask import Blueprint, request, jsonify, g
from config import get_connection
from middleware import verificar_token

equipos_bp = Blueprint('equipos', __name__)


def _puede_gestionar_laboratorio(usuario, laboratorio_id):
    if usuario.get('rol') == 'administrador':
        return True
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'SELECT 1 FROM usuario_laboratorio WHERE usuario_id=? AND laboratorio_id=?',
            (usuario['id'], laboratorio_id)
        )
        return cursor.fetchone() is not None
    finally:
        conn.close()


def _puede_gestionar_equipo(usuario, equipo_id):
    if usuario.get('rol') == 'administrador':
        return True
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 1
            FROM equipos e
            INNER JOIN usuario_laboratorio ul
              ON ul.laboratorio_id = e.laboratorio_id AND ul.usuario_id = ?
            WHERE e.id = ?
        """, (usuario['id'], equipo_id))
        return cursor.fetchone() is not None
    finally:
        conn.close()


# GET /api/equipos
@equipos_bp.route('/', methods=['GET'])
@verificar_token
def get_equipos():
    laboratorio_id = request.args.get('laboratorio_id')
    estado         = request.args.get('estado')
    categoria      = request.args.get('categoria')
    incluir_bajas  = request.args.get('incluir_bajas', '0')

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        where  = ['1=1']
        params = []

        if g.usuario.get('rol') != 'administrador':
            where.append(
                'e.laboratorio_id IN (SELECT laboratorio_id FROM usuario_laboratorio WHERE usuario_id=?)'
            )
            params.append(g.usuario['id'])

        if laboratorio_id:
            where.append('e.laboratorio_id=?')
            params.append(laboratorio_id)

        if estado:
            where.append('e.estado=?')
            params.append(estado)
        elif incluir_bajas != '1':
            where.append("e.estado <> 'baja'")

        if categoria:
            where.append('e.categoria=?')
            params.append(categoria)

        sql = f"""
            SELECT e.*, l.nombre AS laboratorio_nombre
            FROM equipos e
            LEFT JOIN laboratorios l ON l.id = e.laboratorio_id
            WHERE {' AND '.join(where)}
            ORDER BY e.fecha_registro DESC
        """
        cursor.execute(sql, params)
        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        return jsonify(rows)
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al obtener equipos'}), 500
    finally:
        conn.close()


# GET /api/equipos/<id>
@equipos_bp.route('/<int:equipo_id>', methods=['GET'])
@verificar_token
def get_equipo(equipo_id):
    if not _puede_gestionar_equipo(g.usuario, equipo_id):
        return jsonify({'error': 'Sin permiso para ver este equipo'}), 403

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT e.*, l.nombre AS laboratorio_nombre
            FROM equipos e
            LEFT JOIN laboratorios l ON l.id = e.laboratorio_id
            WHERE e.id = ?
        """, (equipo_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Equipo no encontrado'}), 404
        cols = [d[0] for d in cursor.description]
        return jsonify(dict(zip(cols, row)))
    except Exception:
        return jsonify({'error': 'Error al obtener equipo'}), 500
    finally:
        conn.close()


# POST /api/equipos
@equipos_bp.route('/', methods=['POST'])
@verificar_token
def crear_equipo():
    data           = request.get_json() or {}
    nombre         = data.get('nombre', '').strip()
    categoria      = data.get('categoria', '').strip()
    laboratorio_id = data.get('laboratorio_id')
    estado         = data.get('estado', 'disponible')
    marca          = data.get('marca')
    descripcion    = data.get('descripcion')

    if not nombre or not categoria or not laboratorio_id:
        return jsonify({'error': 'Nombre, categoria y laboratorio son requeridos'}), 400

    if not _puede_gestionar_laboratorio(g.usuario, laboratorio_id):
        return jsonify({'error': 'Sin permiso para registrar equipos en este laboratorio'}), 403

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT nombre FROM laboratorios WHERE id=?', (laboratorio_id,))
        lab_row = cursor.fetchone()
        lab_nombre = lab_row[0] if lab_row else f'Lab ID {laboratorio_id}'

        cursor.execute(
            'INSERT INTO equipos (nombre, categoria, laboratorio_id, estado, marca, descripcion) VALUES (?,?,?,?,?,?)',
            (nombre, categoria, laboratorio_id, estado, marca, descripcion)
        )
        conn.commit()
        cursor.execute('SELECT LAST_INSERT_ID()')
        new_id = cursor.fetchone()[0]

        cursor.execute(
            'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
            ('CREAR', f'Equipo "{nombre}" registrado', lab_nombre, g.usuario['id'])
        )
        conn.commit()
        return jsonify({'id': new_id, 'mensaje': 'Equipo creado'}), 201
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al crear equipo'}), 500
    finally:
        conn.close()


# PUT /api/equipos/<id>
@equipos_bp.route('/<int:equipo_id>', methods=['PUT'])
@verificar_token
def actualizar_equipo(equipo_id):
    data           = request.get_json() or {}
    nombre         = data.get('nombre')
    categoria      = data.get('categoria')
    laboratorio_id = data.get('laboratorio_id')
    estado         = data.get('estado')
    marca          = data.get('marca')
    descripcion    = data.get('descripcion')

    if not _puede_gestionar_equipo(g.usuario, equipo_id):
        return jsonify({'error': 'Sin permiso para editar este equipo'}), 403
    if not _puede_gestionar_laboratorio(g.usuario, laboratorio_id):
        return jsonify({'error': 'Sin permiso para asignar este equipo a ese laboratorio'}), 403

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT * FROM equipos WHERE id=?', (equipo_id,))
        prev_row = cursor.fetchone()

        cursor.execute(
            'UPDATE equipos SET nombre=?, categoria=?, laboratorio_id=?, estado=?, marca=?, descripcion=? WHERE id=?',
            (nombre, categoria, laboratorio_id, estado, marca, descripcion, equipo_id)
        )
        conn.commit()

        if prev_row:
            prev_cols  = [d[0] for d in cursor.description] if cursor.description else []
            prev       = dict(zip(prev_cols, prev_row)) if prev_cols else {}
            prev_estado = prev.get('estado')
            if prev_estado and prev_estado != estado:
                cursor.execute(
                    'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
                    ('EDITAR', f'Equipo "{nombre}" -> Estado: {estado}', f'ID {equipo_id}', g.usuario['id'])
                )
                conn.commit()

        return jsonify({'mensaje': 'Equipo actualizado'})
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al actualizar equipo'}), 500
    finally:
        conn.close()


# DELETE /api/equipos/<id>  — marca como baja
@equipos_bp.route('/<int:equipo_id>', methods=['DELETE'])
@verificar_token
def baja_equipo(equipo_id):
    if not _puede_gestionar_equipo(g.usuario, equipo_id):
        return jsonify({'error': 'Sin permiso para dar de baja este equipo'}), 403

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT nombre FROM equipos WHERE id=?', (equipo_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Equipo no encontrado'}), 404

        cursor.execute("UPDATE equipos SET estado='baja' WHERE id=?", (equipo_id,))
        cursor.execute(
            'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
            ('BAJA', f'Equipo "{row[0]}" dado de baja', f'ID {equipo_id}', g.usuario['id'])
        )
        conn.commit()
        return jsonify({'mensaje': 'Equipo dado de baja'})
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al dar de baja'}), 500
    finally:
        conn.close()
