from flask import Blueprint, request, jsonify
from config import get_connection
from middleware import verificar_token, solo_admin

categorias_bp = Blueprint('categorias', __name__)


# GET /api/categorias
@categorias_bp.route('/', methods=['GET'])
@verificar_token
def get_categorias():
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT c.id, c.nombre, c.emoji, c.descripcion, COUNT(e.id) AS total_equipos
            FROM categorias c
            LEFT JOIN equipos e ON e.categoria = c.nombre
            GROUP BY c.id, c.nombre, c.emoji, c.descripcion
            ORDER BY c.nombre
        """)
        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        return jsonify(rows)
    except Exception as err:
        return jsonify({'error': 'Error al obtener categorias'}), 500
    finally:
        conn.close()


# POST /api/categorias
@categorias_bp.route('/', methods=['POST'])
@verificar_token
@solo_admin
def crear_categoria():
    data        = request.get_json() or {}
    nombre      = data.get('nombre', '').strip()
    emoji       = data.get('emoji', '📦')
    descripcion = data.get('descripcion')

    if not nombre:
        return jsonify({'error': 'Nombre requerido'}), 400

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO categorias (nombre, emoji, descripcion) VALUES (?, ?, ?)',
            (nombre, emoji, descripcion)
        )
        conn.commit()
        cursor.execute('SELECT LAST_INSERT_ID()')
        new_id = cursor.fetchone()[0]
        return jsonify({'id': new_id}), 201
    except Exception:
        return jsonify({'error': 'Error al crear categoria'}), 500
    finally:
        conn.close()


# PUT /api/categorias/<id>
@categorias_bp.route('/<int:cat_id>', methods=['PUT'])
@verificar_token
@solo_admin
def actualizar_categoria(cat_id):
    data        = request.get_json() or {}
    nombre      = data.get('nombre')
    emoji       = data.get('emoji')
    descripcion = data.get('descripcion')

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE categorias SET nombre=?, emoji=?, descripcion=? WHERE id=?',
            (nombre, emoji, descripcion, cat_id)
        )
        conn.commit()
        return jsonify({'mensaje': 'Categoria actualizada'})
    except Exception:
        return jsonify({'error': 'Error al actualizar'}), 500
    finally:
        conn.close()


# DELETE /api/categorias/<id>
@categorias_bp.route('/<int:cat_id>', methods=['DELETE'])
@verificar_token
@solo_admin
def eliminar_categoria(cat_id):
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM categorias WHERE id=?', (cat_id,))
        conn.commit()
        return jsonify({'mensaje': 'Categoria eliminada'})
    except Exception:
        return jsonify({'error': 'Error al eliminar'}), 500
    finally:
        conn.close()
