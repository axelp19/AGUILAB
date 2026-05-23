from flask import Blueprint, request, jsonify, g
from config import get_connection
from middleware import verificar_token, solo_admin

laboratorios_bp = Blueprint('laboratorios', __name__)


def _row_to_dict(cursor, row):
    return dict(zip([d[0] for d in cursor.description], row))


# GET /api/laboratorios
@laboratorios_bp.route('/', methods=['GET'])
@verificar_token
def get_laboratorios():
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        if g.usuario.get('rol') == 'administrador':
            cursor.execute("""
                SELECT l.*,
                  COUNT(DISTINCT e.id)            AS total_equipos,
                  SUM(CASE WHEN e.estado='disponible'    THEN 1 ELSE 0 END) AS disponibles,
                  SUM(CASE WHEN e.estado='mantenimiento' THEN 1 ELSE 0 END) AS mantenimiento,
                  SUM(CASE WHEN e.estado='baja'          THEN 1 ELSE 0 END) AS bajas
                FROM laboratorios l
                LEFT JOIN equipos e ON e.laboratorio_id = l.id
                GROUP BY l.id, l.nombre, l.clave, l.piso, l.edificio, l.responsable, l.creado_en
                ORDER BY l.nombre
            """)
        else:
            cursor.execute("""
                SELECT l.*,
                  COUNT(DISTINCT e.id)            AS total_equipos,
                  SUM(CASE WHEN e.estado='disponible'    THEN 1 ELSE 0 END) AS disponibles,
                  SUM(CASE WHEN e.estado='mantenimiento' THEN 1 ELSE 0 END) AS mantenimiento,
                  SUM(CASE WHEN e.estado='baja'          THEN 1 ELSE 0 END) AS bajas
                FROM laboratorios l
                INNER JOIN usuario_laboratorio ul ON ul.laboratorio_id = l.id AND ul.usuario_id = ?
                LEFT JOIN equipos e ON e.laboratorio_id = l.id
                GROUP BY l.id, l.nombre, l.clave, l.piso, l.edificio, l.responsable, l.creado_en
                ORDER BY l.nombre
            """, (g.usuario['id'],))

        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        return jsonify(rows)
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al obtener laboratorios'}), 500
    finally:
        conn.close()


# POST /api/laboratorios
@laboratorios_bp.route('/', methods=['POST'])
@verificar_token
@solo_admin
def crear_laboratorio():
    data        = request.get_json() or {}
    nombre      = data.get('nombre', '').strip()
    clave       = data.get('clave', '').strip()
    piso        = data.get('piso')
    edificio    = data.get('edificio')
    responsable = data.get('responsable')

    if not nombre or not clave:
        return jsonify({'error': 'Nombre y clave requeridos'}), 400

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO laboratorios (nombre, clave, piso, edificio, responsable) VALUES (?,?,?,?,?)',
            (nombre, clave, piso, edificio, responsable)
        )
        conn.commit()
        cursor.execute('SELECT LAST_INSERT_ID()')
        new_id = cursor.fetchone()[0]
        return jsonify({'id': new_id, 'mensaje': 'Laboratorio creado'}), 201
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al crear laboratorio'}), 500
    finally:
        conn.close()


# PUT /api/laboratorios/<id>
@laboratorios_bp.route('/<int:lab_id>', methods=['PUT'])
@verificar_token
@solo_admin
def actualizar_laboratorio(lab_id):
    data        = request.get_json() or {}
    nombre      = data.get('nombre')
    clave       = data.get('clave')
    piso        = data.get('piso')
    edificio    = data.get('edificio')
    responsable = data.get('responsable')

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE laboratorios SET nombre=?,clave=?,piso=?,edificio=?,responsable=? WHERE id=?',
            (nombre, clave, piso, edificio, responsable, lab_id)
        )
        conn.commit()
        return jsonify({'mensaje': 'Laboratorio actualizado'})
    except Exception:
        return jsonify({'error': 'Error al actualizar'}), 500
    finally:
        conn.close()


# DELETE /api/laboratorios/<id>
@laboratorios_bp.route('/<int:lab_id>', methods=['DELETE'])
@verificar_token
@solo_admin
def eliminar_laboratorio(lab_id):
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM laboratorios WHERE id=?', (lab_id,))
        conn.commit()
        return jsonify({'mensaje': 'Laboratorio eliminado'})
    except Exception:
        return jsonify({'error': 'Error al eliminar'}), 500
    finally:
        conn.close()
