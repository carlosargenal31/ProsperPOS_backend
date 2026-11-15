// ===================================================================
// PROSPERPOS - ALTA DE EMPRESAS NUEVAS
// Crea la base de datos de la empresa a partir de la plantilla
// (database/tenant-template), corre las migraciones y crea su usuario
// administrador.
// ===================================================================

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const db = require('../utils/database');
const control = require('./control-db');
const { runWithTenant } = require('./context');
const { addDays, todayHonduras } = require('./tenant.middleware');

const TEMPLATE_DIR = path.join(__dirname, '../../database/tenant-template');

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

function dbNameForSlug(slug) {
  const prefix = process.env.TENANT_DB_PREFIX || 'pp_';
  return `${prefix}${slug.replace(/-/g, '_')}`.slice(0, 64);
}

/** Conexión al servidor MySQL (sin base) que permite varias sentencias */
async function serverConnection(database) {
  const cfg = db.dbConfig;
  return mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database,
    charset: 'utf8mb4',
    multipleStatements: true
  });
}

function readTemplate(file) {
  const full = path.join(TEMPLATE_DIR, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

function templateReady() {
  return Boolean(readTemplate('schema.sql').trim());
}

/** Datos que se personalizan con la información de la empresa nueva */
async function personalizeTenant(conn, tenant) {
  const statements = [
    // Empresa / datos fiscales
    ['companies', { company_name: tenant.legal_name || tenant.name, commercial_name: tenant.name, rtn: tenant.rtn, email: tenant.contact_email, phone: tenant.contact_phone }],
    ['stores', { name: tenant.name }],
    ['branches', { nombre: 'Sucursal Principal', name: 'Sucursal Principal' }],
    ['warehouses', { nombre: 'Bodega Principal', name: 'Bodega Principal' }]
  ];
  for (const [table, values] of statements) {
    const [cols] = await conn.query(
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      [table]
    );
    const available = new Set(cols.map(c => c.COLUMN_NAME));
    const sets = Object.entries(values).filter(([col, v]) => available.has(col) && v !== undefined && v !== null && v !== '');
    if (!sets.length) continue;
    await conn.query(
      `UPDATE \`${table}\` SET ${sets.map(([c]) => `\`${c}\` = ?`).join(', ')} ORDER BY id LIMIT 1`,
      sets.map(([, v]) => v)
    );
  }
}

async function createAdminUser(conn, admin) {
  const hash = await bcrypt.hash(admin.password, 10);
  const [cols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
  );
  const available = new Set(cols.map(c => c.COLUMN_NAME));
  const [stores] = await conn.query('SELECT id FROM stores ORDER BY id LIMIT 1').catch(() => [[]]);
  const [roleCols] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles'"
  );
  const adminNames = "('admin','administrador','super_admin','superadmin')";
  const bySlug = roleCols.some(c => c.COLUMN_NAME === 'slug') ? ` OR LOWER(slug) IN ${adminNames}` : '';
  const [roles] = await conn.query(
    `SELECT id FROM roles WHERE LOWER(name) IN ${adminNames}${bySlug} ORDER BY id LIMIT 1`
  );
  const roleId = roles.length ? roles[0].id : null;

  const values = {
    username: admin.username || admin.email.split('@')[0],
    email: admin.email.toLowerCase(),
    password: hash,
    first_name: admin.first_name || 'Administrador',
    last_name: admin.last_name || '',
    phone: admin.phone || null,
    store_id: stores.length ? stores[0].id : null,
    role_id: roleId,
    is_active: 1,
    status: 'active'
  };
  const entries = Object.entries(values).filter(([col]) => available.has(col));
  const [result] = await conn.query(
    `INSERT INTO users (${entries.map(([c]) => `\`${c}\``).join(', ')}${available.has('created_at') ? ', created_at' : ''})
     VALUES (${entries.map(() => '?').join(', ')}${available.has('created_at') ? ', NOW()' : ''})`,
    entries.map(([, v]) => v)
  );
  if (roleId) {
    const [urCols] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles'"
    );
    if (urCols.length) {
      const dateCol = urCols.find(c => ['assigned_at', 'created_at'].includes(c.COLUMN_NAME));
      await conn.query(
        `INSERT INTO user_roles (user_id, role_id${dateCol ? `, ${dateCol.COLUMN_NAME}` : ''}) VALUES (?, ?${dateCol ? ', NOW()' : ''})`,
        [result.insertId, roleId]
      );
    }
  }
  return result.insertId;
}

/**
 * Crea una empresa completa.
 * @param {object} data { slug, name, legal_name, rtn, business_type, contact_*, plan_id, status,
 *                        trial_days, monthly_price, domains:[{host, kind}], admin:{email,password,first_name,last_name} }
 */
async function provisionTenant(data, adminId = null) {
  const slug = String(data.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw Object.assign(new Error('Identificador inválido: use letras minúsculas, números y guiones'), { status: 400 });
  if (!data.name) throw Object.assign(new Error('El nombre de la empresa es requerido'), { status: 400 });
  if (!data.admin || !data.admin.email || !data.admin.password || data.admin.password.length < 8) {
    throw Object.assign(new Error('Se requiere correo y contraseña (mínimo 8 caracteres) del administrador de la empresa'), { status: 400 });
  }
  if (!templateReady()) {
    throw Object.assign(new Error('Falta la plantilla de base de datos (database/tenant-template/schema.sql)'), { status: 500 });
  }

  const exists = await control.query('SELECT id FROM tenants WHERE slug = ?', [slug]);
  if (exists.length) throw Object.assign(new Error('Ya existe una empresa con ese identificador'), { status: 409 });

  const dbName = dbNameForSlug(slug);
  const status = data.status || 'trial';
  const trialDays = Number(data.trial_days ?? 15);

  // 1. Registro en la base de control
  const insert = await control.query(
    `INSERT INTO tenants (slug, name, legal_name, rtn, business_type, contact_name, contact_email, contact_phone,
                          db_name, plan_id, status, trial_ends_at, monthly_price, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [slug, data.name, data.legal_name || null, data.rtn || null, data.business_type || null,
      data.contact_name || null, data.contact_email || null, data.contact_phone || null,
      dbName, data.plan_id || null, status, status === 'trial' ? addDays(todayHonduras(), trialDays) : null,
      data.monthly_price ?? null, data.notes || null]
  );
  const tenantId = insert.insertId;

  let conn;
  try {
    // 2. Base de datos de la empresa con la estructura de la plantilla
    conn = await serverConnection();
    await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.changeUser({ database: dbName });
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query(readTemplate('schema.sql'));
    const seed = readTemplate('seed.sql');
    if (seed.trim()) await conn.query(seed);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const tenant = { id: tenantId, slug, name: data.name, legal_name: data.legal_name, rtn: data.rtn,
      contact_email: data.contact_email, contact_phone: data.contact_phone, db_name: dbName };
    await personalizeTenant(conn, tenant);

    // 3. Migraciones automáticas dentro del contexto de la empresa
    const DatabaseMigrator = require('../utils/database-migrator');
    await runWithTenant(tenant, () => DatabaseMigrator.runMigrations());

    // 4. Usuario administrador de la empresa
    await createAdminUser(conn, data.admin);

    // 5. Dominios
    for (const d of data.domains || []) {
      if (!d.host) continue;
      await control.query('INSERT INTO tenant_domains (tenant_id, host, kind) VALUES (?, ?, ?)', [
        tenantId, String(d.host).trim().toLowerCase(), d.kind || 'pos'
      ]);
    }

    await control.query('INSERT INTO admin_audit (admin_id, tenant_id, action, details) VALUES (?, ?, ?, ?)', [
      adminId, tenantId, 'tenant.create', JSON.stringify({ slug, dbName })
    ]);
    control.clearTenantCache();
    logger.info(`🏢 Empresa creada: ${data.name} (${slug}) → ${dbName}`);
    return { id: tenantId, slug, db_name: dbName };
  } catch (error) {
    logger.error(`Error creando empresa ${slug}:`, error);
    // Revertir: borrar registro (la base queda para revisión si se llegó a crear)
    await control.query('DELETE FROM tenants WHERE id = ?', [tenantId]).catch(() => {});
    throw Object.assign(new Error(`No se pudo crear la empresa: ${error.message}`), { status: 500 });
  } finally {
    if (conn) await conn.end().catch(() => {});
  }
}

/**
 * Registra una base de datos que ya existe como empresa (ej. migrar
 * Cerámicas Universal con todos sus datos).
 */
async function registerExistingTenant(data, adminId = null) {
  const slug = String(data.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw Object.assign(new Error('Identificador inválido'), { status: 400 });
  if (!data.db_name || !/^[a-zA-Z0-9_]+$/.test(data.db_name)) throw Object.assign(new Error('Base de datos inválida'), { status: 400 });
  const dup = await control.query('SELECT id FROM tenants WHERE slug = ? OR db_name = ?', [slug, data.db_name]);
  if (dup.length) throw Object.assign(new Error('Ya existe una empresa con ese identificador o base de datos'), { status: 409 });

  const insert = await control.query(
    `INSERT INTO tenants (slug, name, legal_name, rtn, business_type, contact_name, contact_email, contact_phone,
                          db_name, plan_id, status, paid_until, monthly_price, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [slug, data.name, data.legal_name || null, data.rtn || null, data.business_type || null,
      data.contact_name || null, data.contact_email || null, data.contact_phone || null,
      data.db_name, data.plan_id || null, data.status || 'active', data.paid_until || null,
      data.monthly_price ?? null, data.notes || null]
  );
  for (const d of data.domains || []) {
    await control.query('INSERT INTO tenant_domains (tenant_id, host, kind) VALUES (?, ?, ?)', [
      insert.insertId, String(d.host).trim().toLowerCase(), d.kind || 'pos'
    ]);
  }
  await control.query('INSERT INTO admin_audit (admin_id, tenant_id, action, details) VALUES (?, ?, ?, ?)', [
    adminId, insert.insertId, 'tenant.register_existing', JSON.stringify({ slug, db_name: data.db_name })
  ]);
  control.clearTenantCache();
  return { id: insert.insertId, slug, db_name: data.db_name };
}

module.exports = {
  provisionTenant,
  registerExistingTenant,
  dbNameForSlug,
  templateReady,
  SLUG_RE
};
