from flask import Blueprint, jsonify, g
from config import get_connection
from middleware import verificar_token

dashboard_bp = Blueprint('dashboard', __name__)


# GET /api/dashboard
@dashboard_bp.route('/', methods=['GET'])
@verificar_token
def get_dashboard():
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        es_admin   = g.usuario.get('rol') == 'administrador'
        usuario_id = g.usuario['id']

        lab_filter = (
            ""
            if es_admin
            else "AND e.laboratorio_id IN (SELECT laboratorio_id FROM usuario_laboratorio WHERE usuario_id=?)"
        )

        # ── KPIs ──────────────────────────────────────────────────────────────
        params_kpi = [] if es_admin else [usuario_id]
        cursor.execute(f"""
            SELECT
              COUNT(*)                                             AS total,
              SUM(CASE WHEN estado='disponible'    THEN 1 ELSE 0 END) AS disponibles,
              SUM(CASE WHEN estado='mantenimiento' THEN 1 ELSE 0 END) AS mantenimiento,
              SUM(CASE WHEN estado='baja'          THEN 1 ELSE 0 END) AS bajas
            FROM equipos e WHERE 1=1 {lab_filter}
        """, params_kpi)
        kpis_row  = cursor.fetchone()
        kpis = {
            'total':         kpis_row[0],
            'disponibles':   kpis_row[1],
            'mantenimiento': kpis_row[2],
            'bajas':         kpis_row[3],
        }

        # ── Tickets abiertos ──────────────────────────────────────────────────
        params_tk = [] if es_admin else [usuario_id]
        cursor.execute(f"""
            SELECT COUNT(*) AS abiertos FROM tickets t
            LEFT JOIN equipos e ON e.id = t.equipo_id
            WHERE t.estado='abierto' {lab_filter}
        """, params_tk)
        tickets_abiertos = cursor.fetchone()[0]

        # ── Equipos por laboratorio (gráfica barras) ──────────────────────────
        if es_admin:
            cursor.execute("""
                SELECT l.nombre, COUNT(e.id) AS equipos
                FROM laboratorios l
                LEFT JOIN equipos e ON e.laboratorio_id = l.id
                GROUP BY l.id, l.nombre ORDER BY l.nombre
            """)
        else:
            cursor.execute("""
                SELECT l.nombre, COUNT(e.id) AS equipos
                FROM laboratorios l
                INNER JOIN usuario_laboratorio ul ON ul.laboratorio_id = l.id AND ul.usuario_id = ?
                LEFT JOIN equipos e ON e.laboratorio_id = l.id
                GROUP BY l.id, l.nombre ORDER BY l.nombre
            """, (usuario_id,))
        por_lab = [{'nombre': r[0], 'equipos': r[1]} for r in cursor.fetchall()]

        # ── Estado para pastel ────────────────────────────────────────────────
        params_est = [] if es_admin else [usuario_id]
        cursor.execute(f"""
            SELECT estado, COUNT(*) AS total FROM equipos e WHERE 1=1 {lab_filter}
            GROUP BY estado
        """, params_est)
        por_estado = [{'estado': r[0], 'total': r[1]} for r in cursor.fetchall()]

        # ── Actividad reciente ────────────────────────────────────────────────
        cursor.execute("""
            SELECT la.id, la.accion, la.descripcion, la.detalle, la.fecha, u.nombre AS usuario_nombre
            FROM log_actividad la
            LEFT JOIN usuarios u ON u.id = la.usuario_id
            ORDER BY la.fecha DESC
        """)
        cols      = [d[0] for d in cursor.description]
        actividad = [dict(zip(cols, r)) for r in cursor.fetchall()][:5]

        # ── Resumen por laboratorio ───────────────────────────────────────────
        if es_admin:
            cursor.execute("""
                SELECT l.nombre, l.id,
                  COUNT(e.id) AS total,
                  SUM(CASE WHEN e.estado='disponible' THEN 1 ELSE 0 END) AS disponibles
                FROM laboratorios l
                LEFT JOIN equipos e ON e.laboratorio_id = l.id
                GROUP BY l.id, l.nombre ORDER BY l.nombre
            """)
        else:
            cursor.execute("""
                SELECT l.nombre, l.id,
                  COUNT(e.id) AS total,
                  SUM(CASE WHEN e.estado='disponible' THEN 1 ELSE 0 END) AS disponibles
                FROM laboratorios l
                INNER JOIN usuario_laboratorio ul ON ul.laboratorio_id = l.id AND ul.usuario_id = ?
                LEFT JOIN equipos e ON e.laboratorio_id = l.id
                GROUP BY l.id, l.nombre ORDER BY l.nombre
            """, (usuario_id,))
        labs = [{'nombre': r[0], 'id': r[1], 'total': r[2], 'disponibles': r[3]} for r in cursor.fetchall()]

        return jsonify({
            'kpis':             kpis,
            'ticketsAbiertos':  tickets_abiertos,
            'porLab':           por_lab,
            'porEstado':        por_estado,
            'actividad':        actividad,
            'labs':             labs,
        })

    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al obtener datos del dashboard'}), 500
    finally:
        conn.close()
