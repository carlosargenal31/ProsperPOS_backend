// ===================================================================
// PROSPERPOS - BASE DE DATOS DE CONTROL (PANEL DEL PROPIETARIO)
// Guarda las empresas suscritas, sus dominios, planes y pagos.
// Cada empresa tiene su propia base de datos con los datos del negocio.
// ===================================================================

const logger = require('../utils/logger');
const db = require('../utils/database');

const CONTROL_DB = () => process.env.CONTROL_DB_NAME || 'prosperpos_control';

function pool() {
  return db.getPool(CONTROL_DB());
}

async function query(sql, params = []) {
  const [rows] = await pool().query(sql, params);
  return rows;
}

/** Crea la base de control y sus tablas si no existen */
async function initControlDatabase() {
  // La base se crea con el pool por defecto (que sí existe)
  const name = CONTROL_DB();
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('CONTROL_DB_NAME inválido');
  await db.getPool(db.dbConfig.database).query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await query(`
    CREATE TABLE IF NOT EXISTS plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
      currency VARCHAR(3) NOT NULL DEFAULT 'HNL',
      max_users INT NULL,
      max_branches INT NULL,
      includes_ecommerce BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      legal_name VARCHAR(200) NULL,
      rtn VARCHAR(20) NULL,
      business_type VARCHAR(100) NULL,
      contact_name VARCHAR(150) NULL,
      contact_email VARCHAR(150) NULL,
      contact_phone VARCHAR(30) NULL,
      db_name VARCHAR(64) NOT NULL UNIQUE,
      plan_id INT NULL,
      status ENUM('trial','active','suspended','cancelled') NOT NULL DEFAULT 'trial',
      trial_ends_at DATE NULL,
      paid_until DATE NULL,
      grace_days INT NOT NULL DEFAULT 5,
      monthly_price DECIMAL(10,2) NULL COMMENT 'Precio especial; si es NULL se usa el del plan',
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tenants_status (status),
      CONSTRAINT fk_tenants_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tenant_domains (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      host VARCHAR(190) NOT NULL UNIQUE,
      kind ENUM('pos','store','other') NOT NULL DEFAULT 'pos',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_domains_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'HNL',
      months INT NOT NULL DEFAULT 1,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      method VARCHAR(50) NULL COMMENT 'transferencia, efectivo, tarjeta, etc.',
      reference VARCHAR(100) NULL,
      notes TEXT NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payments_tenant (tenant_id),
      CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS super_admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_audit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NULL,
      tenant_id INT NULL,
      action VARCHAR(100) NOT NULL,
      details JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_tenant (tenant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Plan inicial si no hay ninguno
  const [{ total }] = await query('SELECT COUNT(*) AS total FROM plans');
  if (total === 0) {
    await query(
      `INSERT INTO plans (name, description, price_monthly, max_users, max_branches, includes_ecommerce)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Estándar', 'POS, facturación SAR, inventario, compras, reportes y tienda en línea', 0, null, null, true]
    );
  }

  // Super administrador inicial desde variables de entorno
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (email && password) {
    const existing = await query('SELECT id FROM super_admins LIMIT 1');
    if (existing.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(password, 12);
      await query('INSERT INTO super_admins (name, email, password_hash) VALUES (?, ?, ?)', [
        process.env.SUPERADMIN_NAME || 'Administrador', email.toLowerCase(), hash
      ]);
      logger.info(`👑 Super administrador creado: ${email}`);
    }
  }

  logger.info(`🏢 Base de control lista (${name})`);
}

// ------------------------------------------------------------------
// Caché de empresas por dominio (evita consultar en cada petición)
// ------------------------------------------------------------------
const cache = new Map();
const CACHE_MS = 30 * 1000;

function clearTenantCache() {
  cache.clear();
}

async function findTenantByHost(host) {
  const key = `host:${host}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const rows = await query(
    `SELECT t.* FROM tenant_domains d JOIN tenants t ON t.id = d.tenant_id WHERE d.host = ? LIMIT 1`,
    [host]
  );
  const value = rows[0] || null;
  cache.set(key, { value, expires: Date.now() + CACHE_MS });
  return value;
}

async function findTenantBySlug(slug) {
  const key = `slug:${slug}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const rows = await query('SELECT * FROM tenants WHERE slug = ? LIMIT 1', [slug]);
  const value = rows[0] || null;
  cache.set(key, { value, expires: Date.now() + CACHE_MS });
  return value;
}

async function listActiveTenants() {
  return query(`SELECT * FROM tenants WHERE status IN ('trial','active') ORDER BY id`);
}

module.exports = {
  CONTROL_DB,
  query,
  pool,
  initControlDatabase,
  findTenantByHost,
  findTenantBySlug,
  listActiveTenants,
  clearTenantCache
};
