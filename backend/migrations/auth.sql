-- Migración: tablas de autenticación (JWT).
-- Ejecutala si ya habías importado schema.sql antes de agregar la autenticación:
--   mysql -u root -p < migrations/auth.sql
-- (Si instalás desde cero, schema.sql ya las incluye.)

USE tienda_db;

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
