import os
import jwt
import time
import bcrypt
from flask import Blueprint, request, jsonify, g
from config import get_connection
from middleware import verificar_token, limit_login_attempts, register_failed_login, clear_failed_login

auth_bp = Blueprint('auth', __name__)

JWT_SECRET = os.getenv('JWT_SECRET', 'aguilab_secret_2026_itsjr')


# POST /api/auth/login
@auth_bp.route('/login', methods=['POST'])
@limit_login_attempts
def login():
    data     = request.get_json() or {}
    correo   = str(data.get('correo', '')).strip().lower()
    password = str(data.get('password', ''))

    if not correo or not password:
        return jsonify({'error': 'Correo y contrasena requeridos'}), 400

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            'SELECT id, nombre, correo, rol, password_hash FROM usuarios WHERE correo = ? AND activo = 1',
            (correo,)
        )
        row = cursor.fetchone()

        if not row:
            register_failed_login()
            return jsonify({'error': 'Credenciales incorrectas'}), 401

        usuario_id, nombre, correo_db, rol, password_hash = row

        if not bcrypt.checkpw(password.encode(), password_hash.encode()):
            register_failed_login()
            return jsonify({'error': 'Credenciales incorrectas'}), 401

        cursor.execute('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', (usuario_id,))
        conn.commit()
        clear_failed_login()

        payload = {
            'id':     usuario_id,
            'nombre': nombre,
            'correo': correo_db,
            'rol':    rol,
            'exp':    int(time.time()) + 8 * 3600,  # 8 horas
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')

        return jsonify({
            'token': token,
            'usuario': {
                'id':     usuario_id,
                'nombre': nombre,
                'correo': correo_db,
                'rol':    rol,
            }
        })
    finally:
        conn.close()


# GET /api/auth/me
@auth_bp.route('/me', methods=['GET'])
@verificar_token
def me():
    return jsonify({'usuario': g.usuario})
