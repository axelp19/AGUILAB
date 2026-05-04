# AguiLab ITSJR — Sistema de Gestión de Inventarios

## 🗂️ Estructura del proyecto

```text
aguilab/
├── backend/                    ← API Node.js + Express
│   ├── config/db.js            ← Conexión MySQL
│   ├── middleware/auth.js      ← JWT + control de roles
│   ├── routes/                 ← auth, usuarios, laboratorios, equipos, tickets...
│   ├── server.js               ← Servidor principal (puerto 4000)
│   ├── seed.js                 ← Crea usuarios iniciales
│   ├── aguilab_db.sql          ← Esquema + datos iniciales
│   ├── .env.example            ← Variables de entorno
│   └── package.json
├── frontend/                   ← React + Vite (puerto 5173)
│   ├── src/
│   │   ├── api.js              ← Cliente HTTP centralizado
│   │   ├── App.jsx             ← Router + autenticación JWT
│   │   ├── components/         ← Layout, UI compartida
│   │   ├── pages/              ← Dashboard, inventario, tickets, admin...
│   │   └── styles/             ← Estilos globales
│   ├── vite.config.js          ← Proxy dev hacia backend
│   ├── .env.example            ← Variables de entorno del frontend
│   └── package.json
└── README.md
```

---

## 🔐 Roles y permisos

| Función | Administrador | Encargado |
|--------------------------------------|:---:|:---:|
| Ver dashboard y reportes | ✅ | ✅ |
| Ver laboratorios asignados | ✅ | ✅ |
| Ver y filtrar inventario | ✅ | ✅ |
| Crear, editar y dar de baja equipos | ✅ | ✅ |
| Crear y ver tickets | ✅ | ✅ |
| Cambiar estado de tickets | ✅ | ✅ |
| Editar su propio perfil | ✅ | ✅ |
| Panel de Administración | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |
| Gestionar categorías | ✅ | ❌ |
| Ver log de actividad | ✅ | ❌ |
| Crear, editar y eliminar laboratorios | ✅ | ❌ |

---

## 🚹 Usuarios y Credenciales
s
| Correo                        | Contraseña      | Rol            | Acceso |
|-------------------------------|-----------------|----------------|--------|
| admin@sjuanrio.tecnm.mx       | Admin2026!      | Administrador  | Total  |
| arojo@sjuanrio.tecnm.mx       | Maestro2026!    | Administrador  | Total  |
| l22590349@sjuanrio.tecnm.mx        | Encargado2026!  | Encargado      | Limitado |

---

## 🌐 Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Verificar token y devolver usuario |
| GET | `/api/dashboard` | KPIs, gráficas y actividad reciente |
| GET | `/api/laboratorios` | Listar laboratorios |
| POST | `/api/laboratorios` | Crear laboratorio (admin) |
| PUT | `/api/laboratorios/:id` | Editar laboratorio (admin) |
| DELETE | `/api/laboratorios/:id` | Eliminar laboratorio (admin) |
| GET | `/api/equipos` | Listar equipos con filtros |
| GET | `/api/equipos/:id` | Ver detalle de equipo |
| POST | `/api/equipos` | Crear equipo |
| PUT | `/api/equipos/:id` | Editar equipo |
| DELETE | `/api/equipos/:id` | Dar de baja equipo |
| GET | `/api/tickets` | Listar tickets |
| POST | `/api/tickets` | Crear ticket |
| PUT | `/api/tickets/:id` | Cambiar estado del ticket |
| GET | `/api/usuarios` | Listar usuarios |
| POST | `/api/usuarios` | Crear usuario (admin) |
| PUT | `/api/usuarios/:id` | Editar usuario |
| DELETE | `/api/usuarios/:id` | Desactivar usuario (admin) |
| GET | `/api/categorias` | Listar categorías |
| POST | `/api/categorias` | Crear categoría (admin) |
| PUT | `/api/categorias/:id` | Editar categoría (admin) |
| DELETE | `/api/categorias/:id` | Eliminar categoría (admin) |
| GET | `/api/log` | Log de actividad (admin) |
| GET | `/api/health` | Verificar estado de la API |


*AguiLab v2.0 · TecNM Campus San Juan del Río · 2026*
