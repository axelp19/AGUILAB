# 🦅 AguiLab — Sistema de Gestión de Laboratorios

Sistema web para el inventario y control de equipos en laboratorios del **ITSJR**.  
Backend migrado a **Python + Flask + pyodbc**. Frontend en **React + Vite** (sin cambios).

---

## 📁 Estructura del Proyecto

```
aguilab/
├── backend/                  ← API Python (Flask)
│   ├── server.py             ← Punto de entrada, registro de rutas
│   ├── config.py             ← Conexión a base de datos (pyodbc)
│   ├── middleware.py         ← JWT, rate-limit de login, decoradores
│   ├── .env                  ← Variables de entorno
│   ├── requirements.txt      ← Dependencias Python
│   └── routes/
│       ├── auth.py           ← POST /api/auth/login · GET /api/auth/me
│       ├── usuarios.py       ← CRUD de usuarios
│       ├── laboratorios.py   ← CRUD de laboratorios
│       ├── equipos.py        ← CRUD de equipos
│       ├── tickets.py        ← CRUD de tickets de soporte
│       ├── categorias.py     ← CRUD de categorías de equipo
│       ├── dashboard.py      ← KPIs y datos para el dashboard
│       └── log.py            ← Log de actividad (solo admin)
├── db/
│   └── init.sql              ← Script de base de datos MySQL/MariaDB para Docker
└── frontend/                 ← React + Vite
    ├── src/
    └── ...
```

---

## ⚙️ Requisitos

| Herramienta | Versión recomendada |
|---|---|
| Python | 3.10 o superior |
| MySQL / MariaDB | 10.6+ / 8.0+ |
| MariaDB ODBC Driver | 3.2 (para pyodbc) |
| Node.js | 18+ (solo para el frontend) |
| pnpm | 10+ |
| Docker | Docker Compose v2 |

---

## 🚀 Instalación y Ejecución

### 1. Configurar la base de datos

```sql
-- Desde MySQL Workbench, DBeaver o la terminal:
mysql -u root -p < db/init.sql
```

### 2. Instalar el driver ODBC

Descarga e instala el **MariaDB ODBC Connector 3.2** desde:  
https://mariadb.com/downloads/connectors/connectors-data-access/odbc-connector

Verifica que está instalado ejecutando en Python:

```python
import pyodbc
print(pyodbc.drivers())   # debe aparecer "MariaDB ODBC 3.2 Driver"
```

### 3. Configurar variables de entorno

Edita `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=aguilab
JWT_SECRET=aguilab_secret_2026_itsjr
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
```

### 4. Instalar dependencias Python

```bash
cd backend
pip install -r requirements.txt
```

### 5. Ejecutar el backend

```bash
cd backend
python server.py
```

La API quedará disponible en: `http://localhost:4000`

### 6. Ejecutar el frontend

```bash
cd frontend
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

El frontend quedará en: `http://localhost:5173`

---

## 🔑 Autenticación

El sistema usa **JWT (JSON Web Tokens)** con expiración de 8 horas.

- `POST /api/auth/login` → devuelve `token` + datos del usuario
- Todos los demás endpoints requieren el header:
  ```
  Authorization: Bearer <token>
  ```

### Protección de rutas

| Decorador         | Descripción                                     |
|-------------------|-------------------------------------------------|
| `@verificar_token`| Valida el JWT; guarda usuario en `flask.g`      |
| `@solo_admin`     | Requiere `rol == 'administrador'`               |
| `@limit_login_attempts` | Bloquea tras 5 intentos fallidos en 15 min |

---

## 📡 Endpoints de la API

### 🔐 Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |

### 👤 Usuarios *(token requerido)*
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/usuarios` | Admin: todos · Encargado: solo él |
| POST | `/api/usuarios` | Solo admin |
| PUT | `/api/usuarios/<id>` | Admin: cualquiera · Encargado: solo su perfil |
| DELETE | `/api/usuarios/<id>` | Solo admin (desactiva, no borra) |

### 🏛 Laboratorios *(token requerido)*
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/laboratorios` | Admin: todos · Encargado: asignados |
| POST | `/api/laboratorios` | Solo admin |
| PUT | `/api/laboratorios/<id>` | Solo admin |
| DELETE | `/api/laboratorios/<id>` | Solo admin |

### 🖥 Equipos *(token requerido)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/equipos` | Filtros: `laboratorio_id`, `estado`, `categoria`, `incluir_bajas` |
| GET | `/api/equipos/<id>` | Detalle de un equipo |
| POST | `/api/equipos` | Crear equipo |
| PUT | `/api/equipos/<id>` | Editar equipo |
| DELETE | `/api/equipos/<id>` | Dar de baja (estado = `baja`) |

### 🎫 Tickets *(token requerido)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tickets` | Filtros: `estado`, `prioridad` |
| POST | `/api/tickets` | Crear ticket |
| PUT | `/api/tickets/<id>` | Actualizar estado |

### 📂 Categorías *(token requerido)*
| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/categorias` | Todos |
| POST | `/api/categorias` | Solo admin |
| PUT | `/api/categorias/<id>` | Solo admin |
| DELETE | `/api/categorias/<id>` | Solo admin |

### 📊 Dashboard *(token requerido)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | KPIs, tickets abiertos, gráficas |

### 📋 Log de actividad *(solo admin)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/log` | Últimas 100 acciones del sistema |

### 💚 Health check
| Método | Ruta |
|--------|------|
| GET | `/api/health` |

---

## 🗄 Base de Datos

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas del sistema (admin / encargado) |
| `laboratorios` | Espacios físicos de laboratorio |
| `usuario_laboratorio` | Relación N:M usuario ↔ laboratorio |
| `categorias` | Tipos de equipo (PC, Monitor, etc.) |
| `equipos` | Inventario de equipos por laboratorio |
| `tickets` | Reportes de fallas o mantenimientos |
| `log_actividad` | Auditoría de acciones del sistema |

---

## 🔒 Roles y Permisos

| Acción | Administrador | Encargado |
|--------|:---:|:---:|
| Ver todos los laboratorios | ✅ | ❌ (solo asignados) |
| Crear / editar / eliminar labs | ✅ | ❌ |
| Ver todos los equipos | ✅ | ❌ (solo su lab) |
| Crear / editar equipos | ✅ | ✅ (solo su lab) |
| Gestionar usuarios | ✅ | ❌ |
| Ver log de actividad | ✅ | ❌ |
| Crear tickets | ✅ | ✅ |

---

## 🚹 Usuarios y Credenciales
s
| Correo                        | Contraseña      | Rol            | Acceso |
|-------------------------------|-----------------|----------------|--------|
| admin@sjuanrio.tecnm.mx       | Admin2026!      | Administrador  | Total  |
| arojo@sjuanrio.tecnm.mx       | Maestro2026!    | Administrador  | Total  |
| l22590349@sjuanrio.tecnm.mx        | Encargado2026!  | Encargado      | Limitado |

---

## 👨‍💻 Autor

**ITSJR** — Sistema AguiLab  
Desarrollado para la gestión de inventario de laboratorios de cómputo.
