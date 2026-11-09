-- Base de datos
CREATE DATABASE IF NOT EXISTS tienda_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_db;

-- Tabla categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    categoria_id INT DEFAULT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============ Autenticación (JWT) ============

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- Solo se guarda el hash SHA-256 del refresh token; fechas en UTC
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expira_en DATETIME NOT NULL,
    revocado TINYINT(1) NOT NULL DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_refresh_token_hash (token_hash),
    CONSTRAINT fk_refresh_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Intentos de login fallidos (límite por email + IP); fechas en UTC
CREATE TABLE IF NOT EXISTS login_intentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    creado_en DATETIME NOT NULL,
    KEY idx_login_email_ip (email, ip)
) ENGINE=InnoDB;

-- Datos de ejemplo (opcional)
INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónica', 'Dispositivos y gadgets'),
('Hogar', 'Artículos para el hogar');

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES
('Mouse inalámbrico', 'Mouse ergonómico 2.4GHz', 15.99, 50, 1),
('Lámpara de mesa', 'Lámpara LED regulable', 22.50, 30, 2);
