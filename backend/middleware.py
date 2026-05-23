import os
import time
from functools import wraps
from flask import request, jsonify, g
import jwt

JWT_SECRET = os.getenv('JWT_SECRET', 'aguilab_secret_2026_itsjr')

# ── Rate-limit de login en memoria ───────────────────────────────────────────
login_attempts = {}          # { "ip:correo": {"count": int, "expires_at": float} }
LOGIN_WINDOW_SEC = 15 * 60   # 15 minutos
MAX_ATTEMPTS     = 5


def _get_client_key(req):
    ip     = req.remote_addr or 'unknown'
    correo = str(req.json.get('correo', '') if req.is_json else '').strip().lower()
    return f'{ip}:{correo}'


def _cleanup():
    now  = time.time()
    keys = [k for k, v in login_attempts.items() if v['expires_at'] <= now]
    for k in keys:
        del login_attempts[k]


def limit_login_attempts(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        _cleanup()
        now = time.time()
        key = _get_client_key(request)
        entry = login_attempts.get(key)
        if entry and entry['count'] >= MAX_ATTEMPTS and entry['expires_at'] > now:
            retry_after = int(entry['expires_at'] - now)
            return jsonify({'error': 'Demasiados intentos de inicio de sesion. Intenta de nuevo en unos minutos.'}), 429, {'Retry-After': str(retry_after)}
        g.login_attempt_key = key
        return f(*args, **kwargs)
    return decorated


def register_failed_login():
    now = time.time()
    key = getattr(g, 'login_attempt_key', None)
    if not key:
        return
    entry = login_attempts.get(key)
    if not entry or entry['expires_at'] <= now:
        login_attempts[key] = {'count': 1, 'expires_at': now + LOGIN_WINDOW_SEC}
    else:
        entry['count'] += 1


def clear_failed_login():
    key = getattr(g, 'login_attempt_key', None)
    if key and key in login_attempts:
        del login_attempts[key]


# ── Verificar JWT ─────────────────────────────────────────────────────────────
def verificar_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        if not header:
            return jsonify({'error': 'Token requerido'}), 401

        parts = header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Token invalido'}), 401

        token = parts[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            g.usuario = payload
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado o invalido'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token expirado o invalido'}), 401

        return f(*args, **kwargs)
    return decorated


def solo_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.usuario.get('rol') != 'administrador':
            return jsonify({'error': 'Acceso denegado: solo administradores'}), 403
        return f(*args, **kwargs)
    return decorated
