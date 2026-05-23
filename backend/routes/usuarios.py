import bcrypt
from flask import Blueprint, request, jsonify, g
from config import get_connection
from middleware import verificar_token, solo_admin

usuarios_bp = Blueprint('usuarios', __name__)


# GET /api/usuarios
@usuarios_bp.route('/', methods=['GET'])
@verificar_token
def get_usuarios():
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        if g.usuario.get('rol') == 'administrador':
            cursor.execute("""
                SELECT u.id, u.nombre, u.correo, u.rol, u.activo, u.ultimo_acceso,
                       GROUP_CONCAT(l.nombre ORDER BY l.nombre SEPARATOR ', ') AS laboratorios
                FROM usuarios u
                LEFT JOIN usuario_laboratorio ul ON u.id = ul.usuario_id
                LEFT JOIN laboratorios l ON ul.laboratorio_id = l.id
                GROUP BY u.id, u.nombre, u.correo, u.rol, u.activo, u.ultimo_acceso
                ORDER BY u.nombre
            """)
        else:
            cursor.execute(
                'SELECT id, nombre, correo, rol, activo, ultimo_acceso FROM usuarios WHERE id=?',
                (g.usuario['id'],)
            )
        cols = [d[0] for d in cursor.description]
        rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
        return jsonify(rows)
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al obtener usuarios'}), 500
    finally:
        conn.close()


# POST /api/usuarios
@usuarios_bp.route('/', methods=['POST'])
@verificar_token
@solo_admin
def crear_usuario():
    data         = request.get_json() or {}
    nombre       = data.get('nombre', '').strip()
    correo       = data.get('correo', '').strip().lower()
    password     = data.get('password', '')
    rol          = data.get('rol', '')
    laboratorios = data.get('laboratorios', [])

    if not nombre or not correo or not password or not rol:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?,?,?,?)',
            (nombre, correo, password_hash, rol)
        )
        conn.commit()
        cursor.execute('SELECT LAST_INSERT_ID()')
        user_id = int(cursor.fetchone()[0])

        if laboratorios:
            for lab_id in laboratorios:
                cursor.execute(
                    'INSERT INTO usuario_laboratorio (usuario_id, laboratorio_id) VALUES (?,?)',
                    (user_id, lab_id)
                )
            conn.commit()

        return jsonify({'id': user_id, 'mensaje': 'Usuario creado correctamente'}), 201
    except Exception as err:
        err_str = str(err)
        if 'Duplicate' in err_str or 'duplicate' in err_str or '1062' in err_str:
            return jsonify({'error': 'El correo ya esta registrado'}), 409
        print(err)
        return jsonify({'error': 'Error al crear usuario'}), 500
    finally:
        conn.close()


# PUT /api/usuarios/<id>
@usuarios_bp.route('/<int:user_id>', methods=['PUT'])
@verificar_token
def actualizar_usuario(user_id):
    if g.usuario.get('rol') != 'administrador' and g.usuario['id'] != user_id:
        return jsonify({'error': 'Sin permiso'}), 403

    data         = request.get_json() or {}
    nombre       = data.get('nombre')
    correo       = data.get('correo')
    password     = data.get('password')
    rol          = data.get('rol')
    activo       = data.get('activo', 1)
    laboratorios = data.get('laboratorios')

    conn   = get_connection()
    cursor = conn.cursor()
    try:
        if password:
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            cursor.execute(
                'UPDATE usuarios SET nombre=?, correo=?, password_hash=?, rol=?, activo=? WHERE id=?',
                (nombre, correo, password_hash, rol, activo, user_id)
            )
        else:
            cursor.execute(
                'UPDATE usuarios SET nombre=?, correo=?, rol=?, activo=? WHERE id=?',
                (nombre, correo, rol, activo, user_id)
            )
        conn.commit()

        if g.usuario.get('rol') == 'administrador' and laboratorios is not None:
            cursor.execute('DELETE FROM usuario_laboratorio WHERE usuario_id=?', (user_id,))
            for lab_id in laboratorios:
                cursor.execute(
                    'INSERT INTO usuario_laboratorio (usuario_id, laboratorio_id) VALUES (?,?)',
                    (user_id, lab_id)
                )
            conn.commit()

        return jsonify({'mensaje': 'Usuario actualizado'})
    except Exception as err:
        print(err)
        return jsonify({'error': 'Error al actualizar usuario'}), 500
    finally:
        conn.close()


# DELETE /api/usuarios/<id>  — desactiva (no borra)
@usuarios_bp.route('/<int:user_id>', methods=['DELETE'])
@verificar_token
@solo_admin
def desactivar_usuario(user_id):
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('UPDATE usuarios SET activo=0 WHERE id=?', (user_id,))
        conn.commit()
        return jsonify({'mensaje': 'Usuario desactivado'})
    except Exception:
        return jsonify({'error': 'Error al desactivar usuario'}), 500
    finally:
        conn.close()
