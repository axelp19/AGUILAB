CREATE DATABASE IF NOT EXISTS aguilab
  CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE aguilab;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS laboratorios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  clave VARCHAR(20) NOT NULL UNIQUE,
  piso VARCHAR(50),
  edificio VARCHAR(100),
  responsable VARCHAR(150),
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('administrador','encargado') NOT NULL DEFAULT 'encargado',
  activo TINYINT(1) DEFAULT 1,
  ultimo_acceso DATETIME,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS usuario_laboratorio (
  usuario_id INT NOT NULL,
  laboratorio_id INT NOT NULL,
  PRIMARY KEY (usuario_id, laboratorio_id),
  KEY laboratorio_id (laboratorio_id),
  CONSTRAINT usuario_laboratorio_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT usuario_laboratorio_ibfk_2 FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  emoji VARCHAR(10) DEFAULT '?',
  descripcion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  laboratorio_id INT NOT NULL,
  estado ENUM('disponible','mantenimiento','en_uso','baja') DEFAULT 'disponible',
  marca VARCHAR(100),
  descripcion TEXT,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY laboratorio_id (laboratorio_id),
  CONSTRAINT equipos_ibfk_1 FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  prioridad ENUM('alta','media','baja') DEFAULT 'media',
  descripcion TEXT NOT NULL,
  estado ENUM('abierto','proceso','cerrado') DEFAULT 'abierto',
  usuario_id INT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY equipo_id (equipo_id),
  KEY usuario_id (usuario_id),
  CONSTRAINT tickets_ibfk_1 FOREIGN KEY (equipo_id) REFERENCES equipos(id),
  CONSTRAINT tickets_ibfk_2 FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE IF NOT EXISTS log_actividad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accion ENUM('CREAR','EDITAR','BAJA','EXPORTAR') NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  detalle VARCHAR(255),
  usuario_id INT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY usuario_id (usuario_id),
  CONSTRAINT log_actividad_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

INSERT IGNORE INTO categorias (id, nombre, emoji, descripcion) VALUES
(1, 'Computadora', '💻', 'PCs de escritorio, laptops, All-in-One'),
(2, 'Monitor', '🖥️', 'Monitores LCD, LED, pantallas'),
(3, 'Periférico', '⌨️', 'Teclados, ratones, webcams'),
(4, 'Mobiliario', '🪑', 'Sillas, mesas, estantes'),
(6, 'Equipo de Red', '📡', 'Switches, routers, patch panels');

INSERT IGNORE INTO laboratorios (id, nombre, clave, piso, edificio, responsable, creado_en) VALUES
(3, 'LAB LRS', 'LRS', 'Piso 2', 'Edificio P', 'Ariopajita Rojo López', '2026-04-03 16:28:14'),
(4, 'LAB LSO', 'LSO', 'Piso 2', 'Edificio P', 'Ariopajita Rojo López', '2026-04-03 16:29:08');

INSERT IGNORE INTO usuarios (id, nombre, correo, password_hash, rol, activo, ultimo_acceso, creado_en) VALUES
(1, 'Administrador General', 'admin@sjuanrio.tecnm.mx', '$2a$10$p13ySpvUW6VxzHVgOKnIfu55wsOdYLpdMUPVOXJtK/3vEvJeTat1K', 'administrador', 1, '2026-05-18 13:49:43', '2026-04-02 18:30:20'),
(2, 'Ariopajita Rojo López', 'arojo@sjuanrio.tecnm.mx', '$2a$10$zNdPugoHZLOrf3MBMJ/Zy.JcFRGU5XWYyu/22At3yGF35Blviqv.K', 'administrador', 1, '2026-04-07 15:11:49', '2026-04-02 18:30:20'),
(3, 'Axel Ponce', 'l22590349@sjuanrio.tecnm.mx', '$2a$10$PWwV9ZYgblrh6U.OWPzRc.fJirT6.f3XOJ/8LjFHEZMX3Wsq7K47K', 'encargado', 1, '2026-04-08 14:27:43', '2026-04-02 18:30:20'),
(7, 'Fernando', 'fer@mail.com', '$2a$10$b8zIfaQ6i3gRBG9Z4QHGCuzq0IH.oAONvLYIQCHYO9yW2xzRIaaKK', 'encargado', 0, NULL, '2026-05-05 13:07:16');

INSERT IGNORE INTO usuario_laboratorio (usuario_id, laboratorio_id) VALUES
(3, 3),
(3, 4),
(7, 3);

INSERT IGNORE INTO equipos (id, nombre, categoria, laboratorio_id, estado, marca, descripcion, fecha_registro) VALUES
(1, 'Silla-001', 'Mobiliario', 3, 'en_uso', 'S/M', 'Silla de oficina, color negro', '2026-04-03 16:30:34');

INSERT IGNORE INTO log_actividad (id, accion, descripcion, detalle, usuario_id, fecha) VALUES
(15, 'CREAR', 'Equipo "Silla 1" registrado', 'LAB LRS', 1, '2026-04-03 16:28:44'),
(16, 'BAJA', 'Equipo "Silla 1" dado de baja', 'ID 14', 1, '2026-04-03 16:29:23'),
(17, 'CREAR', 'Equipo "Silla-001" registrado', 'LAB LRS', 1, '2026-04-03 16:30:34'),
(18, 'CREAR', 'Equipo "PC-01" registrado', 'LAB LSO', 1, '2026-05-05 12:54:47'),
(19, 'EDITAR', 'Equipo "PC-01 EDITADA" -> Estado: mantenimiento', 'ID 18', 1, '2026-05-05 12:55:36'),
(20, 'BAJA', 'Equipo "PC-01 EDITADA" dado de baja', 'ID 18', 1, '2026-05-05 12:58:01'),
(21, 'CREAR', 'Ticket #3 abierto', 'Equipo ID 1 - mantenimiento', 1, '2026-05-05 13:01:48'),
(22, 'EDITAR', 'Ticket #3 -> cerrado', '', 1, '2026-05-05 13:02:38');

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE categorias AUTO_INCREMENT = 8;
ALTER TABLE equipos AUTO_INCREMENT = 19;
ALTER TABLE laboratorios AUTO_INCREMENT = 6;
ALTER TABLE log_actividad AUTO_INCREMENT = 23;
ALTER TABLE tickets AUTO_INCREMENT = 4;
ALTER TABLE usuarios AUTO_INCREMENT = 8;
