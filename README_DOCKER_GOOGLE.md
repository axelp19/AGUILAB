# Despliegue Docker en Google Cloud

Este proyecto usa tres servicios:

- `db-server`: MariaDB con la base `aguilab`.
- `mi-api-flask`: backend Flask en el puerto `4000`.
- `mi-sitio-web`: frontend React servido por Nginx en el puerto `80`. Dentro de Docker, las llamadas `/api` se redirigen al backend.

## 1. Archivos importantes

- `db/init.sql`: crea tablas y carga datos iniciales.
- `backend/Dockerfile`: instala Python, `unixodbc` y `odbc-mariadb`.
- `frontend/Dockerfile`: construye React con pnpm y sirve `dist` con Nginx.
- `docker-compose.yml`: levanta los tres servicios.

## 2. Subir cambios a GitHub

```bash
git add .
git commit -m "Preparar despliegue Docker en Google Cloud"
git push
```

## 3. En la VM de Google Cloud

Clona o actualiza el proyecto:

```bash
git clone TU_REPOSITORIO
cd aguilab
```

Si ya existe:

```bash
git pull
```

Levanta todo:

```bash
docker compose up -d --build
```

Verifica contenedores:

```bash
docker compose ps
```

Ver logs del backend:

```bash
docker compose logs -f mi-api-flask
```

Ver logs del sitio:

```bash
docker compose logs -f mi-sitio-web
```

## 4. URLs

- Frontend: `http://35.192.67.237`
- Backend healthcheck: `http://35.192.67.237:4000/api/health`

## 5. Puertos que debes abrir en Google Cloud

Abre estos puertos en las reglas de firewall:

- `80/tcp` para el sitio web.
- `4000/tcp` para el backend.

No abras `3306/tcp` al público salvo que sea estrictamente necesario.

## 6. Comandos útiles

Reiniciar servicios:

```bash
docker compose restart
```

Reconstruir después de cambios:

```bash
docker compose up -d --build
```

Apagar:

```bash
docker compose down
```

Apagar y borrar la base de datos persistida:

```bash
docker compose down -v
```

Usa `down -v` solo si quieres reinicializar la base desde `db/init.sql`.

## 7. Nota sobre npm y pnpm

Para Docker se usa `pnpm install --frozen-lockfile`, no `npm install`.
Esto evita que el build actualice dependencias de forma silenciosa y obliga a usar lo definido en `pnpm-lock.yaml`.

`npm ci` también es una opción válida para builds reproducibles con `package-lock.json`, pero este proyecto quedó preparado con pnpm.
