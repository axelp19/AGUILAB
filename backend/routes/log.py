from flask import Blueprint, jsonify
from config import get_connection
from middleware import verificar_token, solo_admin

log_bp = Blueprint('log', __name__)


# GET /api/log
@log_bp.route('/', methods=['GET'])
@verificar_token
@solo_admin
def get_log():
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT la.id, la.accion, la.descripcion, la.detalle, la.fecha, u.nombre AS usuario_nombre
            FROM log_actividad la
            LEFT JOIN usuarios u ON u.id = la.usuario_id
            ORDER BY la.fecha DESC
        """)
        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()][:100]
        return jsonify(rows)
    except Exception:
        return jsonify({'error': 'Error al obtener log'}), 500
    finally:
        conn.close()
