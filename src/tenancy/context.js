// ===================================================================
// PROSPERPOS - CONTEXTO DE EMPRESA (MULTI-EMPRESA)
// Cada petición corre "dentro" de una empresa. La base de datos y el
// secreto de JWT se eligen según la empresa del contexto.
// ===================================================================

const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function isMultiTenant() {
  return String(process.env.MULTI_TENANT || '').toLowerCase() === 'true';
}

/** Empresa actual: { id, slug, name, db_name, status, ... } o null */
function getTenant() {
  const store = storage.getStore();
  return store ? store.tenant : null;
}

/** Ejecuta fn dentro del contexto de una empresa */
function runWithTenant(tenant, fn) {
  return storage.run({ tenant }, fn);
}

/** Nombre de la base de datos que deben usar las consultas actuales */
function getCurrentDatabase(defaultDatabase) {
  const tenant = getTenant();
  return (tenant && tenant.db_name) || defaultDatabase;
}

/**
 * Secreto para firmar/verificar JWT. En modo multi-empresa se deriva por
 * empresa, así un token de una empresa nunca sirve en otra.
 */
function getJwtSecret() {
  const base = process.env.JWT_SECRET || 'prosperpos_secret_key';
  const tenant = getTenant();
  if (!isMultiTenant() || !tenant) return base;
  return `${base}:${tenant.slug}`;
}

module.exports = {
  isMultiTenant,
  getTenant,
  runWithTenant,
  getCurrentDatabase,
  getJwtSecret
};
