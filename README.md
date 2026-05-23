# AguiLab

AguiLab es un sistema web para la gestión de inventario de equipos en laboratorios. Permite administrar laboratorios, equipos, categorías, usuarios, tickets de soporte y actividad reciente desde una interfaz web.

## Tecnologías

- Frontend: React + Vite
- Backend: Python + Flask
- Base de datos: MariaDB
- Autenticación: JWT
- Contenedores: Docker + Docker Compose
- Servidor web frontend: Nginx
- Gestor de paquetes frontend: pnpm

## Módulos Principales

- Dashboard con indicadores generales del inventario.
- Gestión de laboratorios.
- Inventario de equipos.
- Tickets de soporte.
- Reportes.
- Panel de administración para usuarios, categorías y log de actividad.

## Estructura General

```text
aguilab/
├── backend/              # API Flask
├── frontend/             # Aplicación React
├── db/                   # Script de inicialización de MariaDB
└── docker-compose.yml    # Orquestación de servicios
```

## Base de Datos

La base se inicializa automáticamente desde:

```text
db/init.sql
```

Ese archivo crea la base `aguilab`, sus tablas principales y datos iniciales.

## Estado del Proyecto

Proyecto académico migrado a backend en Python/Flask y preparado para despliegue mediante Docker en una máquina virtual de Google Cloud.
