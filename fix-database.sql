-- Script para corregir base de datos ProsperPOS
USE prosperpos;

-- Agregar columna slug a roles si no existe
ALTER TABLE roles ADD COLUMN IF NOT EXISTS slug VARCHAR(50);
UPDATE roles SET slug = LOWER(name) WHERE slug IS NULL OR slug = '';

-- Agregar columna subcategory_id a products si no existe
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id VARCHAR(36);

-- Crear/verificar tablas de autenticación
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_role (user_id, role_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255),
  ip_address VARCHAR(50),
  user_agent TEXT,
  success TINYINT(1) DEFAULT 0,
  failure_reason VARCHAR(255),
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  module VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_perm (role_id, permission_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100),
  category_id VARCHAR(36),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insertar datos básicos
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT IGNORE INTO warehouses (id, nombre) VALUES (1, 'Bodega Principal');
INSERT IGNORE INTO permissions (name, description, module) VALUES
('pos_access', 'Acceso a POS', 'pos'),
('view_dashboard', 'Ver dashboard', 'dashboard');
INSERT IGNORE INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions;

-- Vendedores
INSERT IGNORE INTO users (id, username, email, password, first_name, last_name, role_id, store_id) VALUES
(2, 'vendedor1', 'vendedor1@prosperpos.com', '$2a$12$CYWanDteDNc5wbDqqyPu4uqscMsXFPwhi8ULdk7BErA43cSekMiGy', 'Juan', 'Pérez', 4, 1),
(3, 'vendedor2', 'vendedor2@prosperpos.com', '$2a$12$CYWanDteDNc5wbDqqyPu4uqscMsXFPwhi8ULdk7BErA43cSekMiGy', 'María', 'López', 4, 1);
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (2, 4), (3, 4);

SELECT 'Base de datos corregida exitosamente' as resultado;
