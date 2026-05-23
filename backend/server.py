import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.auth         import auth_bp
from routes.usuarios     import usuarios_bp
from routes.laboratorios import laboratorios_bp
from routes.equipos      import equipos_bp
from routes.tickets      import tickets_bp
from routes.categorias   import categorias_bp
from routes.dashboard    import dashboard_bp
from routes.log          import log_bp

app = Flask(__name__)
app.url_map.strict_slashes = False

# CORS
default_origins = (
    'http://localhost:5173,'
    'http://127.0.0.1:5173,'
    'http://35.192.67.237,'
    'http://35.192.67.237:5173,'
    'http://35.192.67.237:4000'
)
allowed_origins = [
    o.strip()
    for o in os.getenv('CORS_ORIGIN', default_origins).split(',')
    if o.strip()
]
CORS(
    app,
    origins=allowed_origins,
    supports_credentials=True,
    allow_headers=['Authorization', 'Content-Type'],
    methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
)

# Registrar blueprints
app.register_blueprint(auth_bp,         url_prefix='/api/auth')
app.register_blueprint(usuarios_bp,     url_prefix='/api/usuarios')
app.register_blueprint(laboratorios_bp, url_prefix='/api/laboratorios')
app.register_blueprint(equipos_bp,      url_prefix='/api/equipos')
app.register_blueprint(tickets_bp,      url_prefix='/api/tickets')
app.register_blueprint(categorias_bp,   url_prefix='/api/categorias')
app.register_blueprint(dashboard_bp,    url_prefix='/api/dashboard')
app.register_blueprint(log_bp,          url_prefix='/api/log')


# Health check
@app.route('/api/health')
def health():
    return jsonify({'status': 'OK', 'app': 'AguiLab API'})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 4000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    print(f'🚀 AguiLab API corriendo en http://{host}:{port}')
    app.run(host=host, port=port, debug=debug)
