-- ============================================================
--  AguiLab ITSJR — Base de Datos MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS aguilab
  CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE aguilab;

-- ── LABORATORIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS laboratorios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  clave       VARCHAR(20)  NOT NULL UNIQUE,
  piso        VARCHAR(50),
  edificio    VARCHAR(100),
  responsable VARCHAR(150),
  creado_en   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── USUARIOS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL,
  correo         VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  rol            ENUM('administrador','encargado') NOT NULL DEFAULT 'encargado',
  activo         TINYINT(1) DEFAULT 1,
  ultimo_acceso  DATETIME,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── USUARIO ↔ LABORATORIO (encargado puede tener varios) ─────
CREATE TABLE IF NOT EXISTS usuario_laboratorio (
  usuario_id     INT NOT NULL,
  laboratorio_id INT NOT NULL,
  PRIMARY KEY (usuario_id, laboratorio_id),
  FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)     ON DELETE CASCADE,
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE
);

-- ── CATEGORÍAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE,
  emoji       VARCHAR(10)  DEFAULT '📦',
  descripcion VARCHAR(255)
);

-- ── EQUIPOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150) NOT NULL,
  categoria       VARCHAR(100) NOT NULL,
  laboratorio_id  INT NOT NULL,
  estado          ENUM('disponible','mantenimiento','en_uso','baja') DEFAULT 'disponible',
  marca           VARCHAR(100),
  descripcion     TEXT,
  fecha_registro  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id)
);

-- ── TICKETS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id      INT NOT NULL,
  tipo           VARCHAR(100) NOT NULL,
  prioridad      ENUM('alta','media','baja') DEFAULT 'media',
  descripcion    TEXT NOT NULL,
  estado         ENUM('abierto','proceso','cerrado') DEFAULT 'abierto',
  usuario_id     INT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipo_id)  REFERENCES equipos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ── LOG DE ACTIVIDAD ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS log_actividad (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  accion      ENUM('CREAR','EDITAR','BAJA','EXPORTAR') NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  detalle     VARCHAR(255),
  usuario_id  INT,
  fecha       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);