from flask import Blueprint, request, jsonify, g
from config import get_connection
from middleware import verificar_token

tickets_bp = Blueprint('tickets', __name__)


# GET /api/tickets
@tickets_bp.route('/', methods=['GET'])
@verificar_token
def get_tickets():
    estado    = request.args.get('estado')
    prioridad = request.args.get('prioridad')

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

        if estado:
            where.append('t.estado=?')
            params.append(estado)

        if prioridad:
            where.append('t.prioridad=?')
            params.append(prioridad)

        cursor.execute(f"""
            SELECT t.*, e.nombre AS equipo_nombre, l.nombre AS lab_nombre,
                   u.nombre AS reporto_nombre
            FROM tickets t
            LEFT JOIN equipos e ON e.id = t.equipo_id
            LEFT JOIN laboratorios l ON l.id = e.laboratorio_id
            LEFT JOIN usuarios u ON u.id = t.usuario_id
            WHERE {' AND '.join(where)}
            ORDER BY t.fecha_creacion DESC
        """, params)
        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        return jsonify(rows)
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al obtener tickets'}), 500
    finally:
        conn.close()


# POST /api/tickets
@tickets_bp.route('/', methods=['POST'])
@verificar_token
def crear_ticket():
    data        = request.get_json() or {}
    equipo_id   = data.get('equipo_id')
    tipo        = data.get('tipo', '').strip()
    prioridad   = data.get('prioridad', 'media')
    descripcion = data.get('descripcion', '').strip()

    if not equipo_id or not tipo or not descripcion:
        return jsonify({'error': 'Equipo, tipo y descripcion son requeridos'}), 400

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO tickets (equipo_id, tipo, prioridad, descripcion, usuario_id) VALUES (?,?,?,?,?)',
            (equipo_id, tipo, prioridad, descripcion, g.usuario['id'])
        )
        conn.commit()
        cursor.execute('SELECT LAST_INSERT_ID()')
        new_id = cursor.fetchone()[0]

        cursor.execute(
            'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
            ('CREAR', f'Ticket #{new_id} abierto', f'Equipo ID {equipo_id} · {tipo}', g.usuario['id'])
        )
        conn.commit()
        return jsonify({'id': new_id, 'mensaje': 'Ticket creado'}), 201
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al crear ticket'}), 500
    finally:
        conn.close()


# PUT /api/tickets/<id>
@tickets_bp.route('/<int:ticket_id>', methods=['PUT'])
@verificar_token
def actualizar_ticket(ticket_id):
    data   = request.get_json() or {}
    estado = data.get('estado', '').strip()

    if not estado:
        return jsonify({'error': 'Estado requerido'}), 400

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE tickets SET estado=? WHERE id=?', (estado, ticket_id))
        cursor.execute(
            'INSERT INTO log_actividad (accion, descripcion, detalle, usuario_id) VALUES (?,?,?,?)',
            ('EDITAR', f'Ticket #{ticket_id} → {estado}', '', g.usuario['id'])
        )
        conn.commit()
        return jsonify({'mensaje': 'Ticket actualizado'})
    except Exception:
        return jsonify({'error': 'Error al actualizar ticket'}), 500
    finally:
        conn.close()
