// ===================================================================
// PROSPERPOS - IDENTIFICAR LA EMPRESA DE CADA PETICIÓN
// La empresa se reconoce por el dominio desde el que se usa el sistema
// (ej. ceramicas.myprosperpos.com). Los frontends envían ese dominio en
// X-Tenant-Host; si no viene, se usa X-Forwarded-Host / Host / Origin.
// ===================================================================

const logger = require('../utils/logger');
const { isMultiTenant, runWithTenant } = require('./context');
const control = require('./control-db');

function cleanHost(value) {
  if (!value) return '';
  let host = String(value).split(',')[0].trim().toLowerCase();
  host = host.replace(/^https?:\/\//, '').split('/')[0];
  return host.replace(/:\d+$/, '');
}

function requestHosts(req) {
  const hosts = [
    req.get('X-Tenant-Host'),
    req.get('X-Forwarded-Host'),
    req.get('Origin'),
    req.get('Referer'),
    req.get('Host')
  ].map(cleanHost).filter(Boolean);
  return [...new Set(hosts)];
}

function todayHonduras() {
  // TZ del proceso = America/Tegucigalpa (ver server.js)
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toDateStr(value) {
  if (!value) return null;
  if (value instanceof Date) {
    // mysql2 usa timezone '+00:00': un DATE llega como medianoche UTC
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  return String(value).slice(0, 10);
}

/**
 * Estado de acceso según la suscripción.
 * @returns {{ allowed: boolean, warning?: string, reason?: string }}
 */
function subscriptionAccess(tenant) {
  const today = todayHonduras();
  const grace = Number(tenant.grace_days ?? 5);

  if (tenant.status === 'suspended') {
    return { allowed: false, reason: 'La suscripción de esta empresa está suspendida. Contacte a ProsperPOS.' };
  }
  if (tenant.status === 'cancelled') {
    return { allowed: false, reason: 'La suscripción de esta empresa fue cancelada.' };
  }

  const limit = tenant.status === 'trial' ? toDateStr(tenant.trial_ends_at) : toDateStr(tenant.paid_until);
  if (!limit) return { allowed: true };

  if (today > addDays(limit, grace)) {
    return {
      allowed: false,
      reason: tenant.status === 'trial'
        ? 'El período de prueba terminó. Contacte a ProsperPOS para activar su suscripción.'
        : 'La suscripción está vencida. Contacte a ProsperPOS para renovarla.'
    };
  }
  if (today > limit) {
    return { allowed: true, warning: `Suscripción vencida el ${limit}. Renueve antes del ${addDays(limit, grace)} para no perder el acceso.` };
  }
  return { allowed: true };
}

async function resolveTenant(req) {
  for (const host of requestHosts(req)) {
    const tenant = await control.findTenantByHost(host);
    if (tenant) return tenant;
  }
  // Desarrollo/pruebas: empresa por defecto (DEFAULT_TENANT=slug)
  if (process.env.DEFAULT_TENANT) {
    return control.findTenantBySlug(process.env.DEFAULT_TENANT);
  }
  return null;
}

/**
 * Middleware: ejecuta el resto de la petición dentro de la empresa.
 * En modo de una sola empresa (MULTI_TENANT != true) no hace nada.
 */
async function tenantMiddleware(req, res, next) {
  if (!isMultiTenant()) return next();

  try {
    const tenant = await resolveTenant(req);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        code: 'TENANT_NOT_FOUND',
        message: 'No se encontró la empresa para este dominio.'
      });
    }

    const access = subscriptionAccess(tenant);
    if (!access.allowed) {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_INACTIVE',
        message: access.reason
      });
    }
    if (access.warning) {
      res.set('X-Subscription-Warning', encodeURIComponent(access.warning));
    }

    req.tenant = tenant;
    res.set('X-Tenant', tenant.slug);
    return runWithTenant(tenant, () => next());
  } catch (error) {
    logger.error('Error resolviendo empresa:', error);
    return res.status(500).json({ success: false, message: 'Error identificando la empresa' });
  }
}

module.exports = {
  tenantMiddleware,
  subscriptionAccess,
  cleanHost,
  todayHonduras,
  addDays,
  toDateStr
};
