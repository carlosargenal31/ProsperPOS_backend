// ===================================================================
// PROSPERPOS - API DEL PANEL DEL PROPIETARIO (SUPER ADMINISTRADOR)
// /api/admin/*  — empresas, dominios, planes y pagos de suscripción
// ===================================================================

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const db = require('../utils/database');
const control = require('./control-db');
const { provisionTenant, registerExistingTenant, templateReady } = require('./provisioning');
const { subscriptionAccess, todayHonduras, addDays, toDateStr, cleanHost } = require('./tenant.middleware');

const router = express.Router();

const secret = () => `${process.env.JWT_SECRET || 'prosperpos_secret_key'}:__superadmin__`;

const ok = (res, data, message = 'OK') => res.json({ success: true, message, data });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function wrap(fn) {
  return (req, res) => fn(req, res).catch(error => {
    logger.error(`Panel admin ${req.method} ${req.originalUrl}:`, error);
    fail(res, error.status || 500, error.message || 'Error interno');
  });
}

async function audit(req, action, tenantId, details) {
  await control.query('INSERT INTO admin_audit (admin_id, tenant_id, action, details) VALUES (?, ?, ?, ?)', [
    req.admin?.id || null, tenantId || null, action, details ? JSON.stringify(details) : null
  ]).catch(() => {});
}

// ---------------- Autenticación ----------------

// Intentos de inicio de sesión (protección básica contra fuerza bruta)
const attempts = new Map();
function tooManyAttempts(key) {
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, until: 0 };
  if (entry.until > now) return true;
  return false;
}
function registerFailure(key) {
  const entry = attempts.get(key) || { count: 0, until: 0 };
  entry.count += 1;
  if (entry.count >= 5) { entry.until = Date.now() + 15 * 60 * 1000; entry.count = 0; }
  attempts.set(key, entry);
}

router.post('/auth/login', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const key = `${req.ip}:${email}`;
  if (tooManyAttempts(key)) return fail(res, 429, 'Demasiados intentos. Espere 15 minutos.');

  const rows = await control.query('SELECT * FROM super_admins WHERE email = ? AND is_active = TRUE', [email]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    registerFailure(key);
    return fail(res, 401, 'Correo o contraseña incorrectos');
  }
  attempts.delete(key);
  await control.query('UPDATE super_admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);
  const token = jwt.sign({ sid: admin.id, email: admin.email }, secret(), { expiresIn: '12h' });
  ok(res, { token, admin: { id: admin.id, name: admin.name, email: admin.email } }, 'Bienvenido');
}));

function requireSuperAdmin(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return fail(res, 401, 'Sesión requerida');
  try {
    const payload = jwt.verify(token, secret());
    req.admin = { id: payload.sid, email: payload.email };
    next();
  } catch {
    fail(res, 401, 'Sesión expirada');
  }
}

router.use(requireSuperAdmin);

router.get('/auth/me', wrap(async (req, res) => {
  const rows = await control.query('SELECT id, name, email, last_login_at FROM super_admins WHERE id = ?', [req.admin.id]);
  ok(res, rows[0]);
}));

router.put('/auth/password', wrap(async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!new_password || new_password.length < 10) return fail(res, 400, 'La nueva contraseña debe tener al menos 10 caracteres');
  const [admin] = await control.query('SELECT * FROM super_admins WHERE id = ?', [req.admin.id]);
  if (!(await bcrypt.compare(String(current_password || ''), admin.password_hash))) return fail(res, 400, 'La contraseña actual no es correcta');
  await control.query('UPDATE super_admins SET password_hash = ? WHERE id = ?', [await bcrypt.hash(new_password, 12), admin.id]);
  await audit(req, 'admin.password_change');
  ok(res, null, 'Contraseña actualizada');
}));

// ---------------- Utilidades ----------------

function effectivePrice(t) {
  return Number(t.monthly_price ?? t.plan_price ?? 0);
}

function decorate(t, domains = []) {
  const access = subscriptionAccess(t);
  return {
    ...t,
    trial_ends_at: toDateStr(t.trial_ends_at),
    paid_until: toDateStr(t.paid_until),
    price: effectivePrice(t),
    access: access.allowed ? (access.warning ? 'warning' : 'ok') : 'blocked',
    access_message: access.reason || access.warning || null,
    domains
  };
}

async function tenantUsage(t) {
  try {
    const pool = db.getPool(t.db_name);
    const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL');
    const [[month]] = await pool.query(
      `SELECT COUNT(*) AS invoices, COALESCE(SUM(total), 0) AS total, MAX(issue_date) AS last_invoice
       FROM invoices WHERE deleted_at IS NULL AND issue_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
    );
    const [[last]] = await pool.query('SELECT MAX(issue_date) AS last_invoice FROM invoices WHERE deleted_at IS NULL');
    return { users: users.total, invoices_month: month.invoices, sales_month: Number(month.total), last_invoice: last.last_invoice };
  } catch (error) {
    return { error: error.message };
  }
}

const TENANT_SELECT = `
  SELECT t.*, p.name AS plan_name, p.price_monthly AS plan_price
  FROM tenants t LEFT JOIN plans p ON p.id = t.plan_id`;

async function getTenantOr404(id) {
  const rows = await control.query(`${TENANT_SELECT} WHERE t.id = ?`, [id]);
  if (!rows.length) throw Object.assign(new Error('Empresa no encontrada'), { status: 404 });
  return rows[0];
}

// ---------------- Resumen ----------------

router.get('/dashboard', wrap(async (req, res) => {
  const tenants = await control.query(TENANT_SELECT);
  const decorated = tenants.map(t => decorate(t));
  const byStatus = decorated.reduce((acc, t) => ({ ...acc, [t.status]: (acc[t.status] || 0) + 1 }), {});
  const mrr = decorated.filter(t => t.status === 'active').reduce((s, t) => s + t.price, 0);
  const [[month]] = [await control.query(
    `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM payments
     WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
  )];
  const attention = decorated.filter(t => t.access !== 'ok' || (t.status === 'trial' && t.trial_ends_at && t.trial_ends_at <= addDays(todayHonduras(), 3)));
  ok(res, {
    total: tenants.length,
    by_status: byStatus,
    mrr,
    payments_month: { total: Number(month.total), count: month.count },
    attention: attention.map(t => ({ id: t.id, name: t.name, status: t.status, access: t.access, access_message: t.access_message, trial_ends_at: t.trial_ends_at, paid_until: t.paid_until })),
    template_ready: templateReady()
  });
}));

// ---------------- Empresas ----------------

router.get('/tenants', wrap(async (req, res) => {
  const tenants = await control.query(`${TENANT_SELECT} ORDER BY t.created_at DESC`);
  const domains = await control.query('SELECT * FROM tenant_domains ORDER BY id');
  ok(res, tenants.map(t => decorate(t, domains.filter(d => d.tenant_id === t.id))));
}));

router.get('/tenants/:id', wrap(async (req, res) => {
  const t = await getTenantOr404(req.params.id);
  const domains = await control.query('SELECT * FROM tenant_domains WHERE tenant_id = ? ORDER BY id', [t.id]);
  const payments = await control.query('SELECT * FROM payments WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50', [t.id]);
  ok(res, { ...decorate(t, domains), payments, usage: await tenantUsage(t) });
}));

router.post('/tenants', wrap(async (req, res) => {
  const data = req.body || {};
  if (Array.isArray(data.domains)) data.domains = data.domains.map(d => ({ ...d, host: cleanHost(d.host) })).filter(d => d.host);
  const result = data.existing_db
    ? await registerExistingTenant({ ...data, db_name: data.existing_db }, req.admin.id)
    : await provisionTenant(data, req.admin.id);
  ok(res, result, 'Empresa creada');
}));

const EDITABLE = ['name', 'legal_name', 'rtn', 'business_type', 'contact_name', 'contact_email', 'contact_phone',
  'plan_id', 'status', 'trial_ends_at', 'paid_until', 'grace_days', 'monthly_price', 'notes'];

router.put('/tenants/:id', wrap(async (req, res) => {
  const t = await getTenantOr404(req.params.id);
  const fields = EDITABLE.filter(f => Object.prototype.hasOwnProperty.call(req.body || {}, f));
  if (!fields.length) return fail(res, 400, 'Nada que actualizar');
  if (req.body.status && !['trial', 'active', 'suspended', 'cancelled'].includes(req.body.status)) return fail(res, 400, 'Estado inválido');
  const values = fields.map(f => (req.body[f] === '' ? null : req.body[f]));
  await control.query(`UPDATE tenants SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`, [...values, t.id]);
  control.clearTenantCache();
  await audit(req, 'tenant.update', t.id, req.body);
  ok(res, null, 'Empresa actualizada');
}));

router.post('/tenants/:id/domains', wrap(async (req, res) => {
  const t = await getTenantOr404(req.params.id);
  const host = cleanHost(req.body?.host);
  if (!host || !/^[a-z0-9.-]+$/.test(host)) return fail(res, 400, 'Dominio inválido');
  const kind = ['pos', 'store', 'other'].includes(req.body?.kind) ? req.body.kind : 'pos';
  try {
    await control.query('INSERT INTO tenant_domains (tenant_id, host, kind) VALUES (?, ?, ?)', [t.id, host, kind]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return fail(res, 409, 'Ese dominio ya está asignado');
    throw error;
  }
  control.clearTenantCache();
  await audit(req, 'domain.add', t.id, { host, kind });
  ok(res, null, 'Dominio agregado');
}));

router.delete('/tenants/:id/domains/:domainId', wrap(async (req, res) => {
  await control.query('DELETE FROM tenant_domains WHERE id = ? AND tenant_id = ?', [req.params.domainId, req.params.id]);
  control.clearTenantCache();
  await audit(req, 'domain.remove', Number(req.params.id), { domainId: req.params.domainId });
  ok(res, null, 'Dominio eliminado');
}));

// Restablecer la contraseña de un usuario de la empresa (soporte)
router.post('/tenants/:id/reset-user-password', wrap(async (req, res) => {
  const t = await getTenantOr404(req.params.id);
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || password.length < 8) return fail(res, 400, 'Correo y contraseña (mínimo 8 caracteres) requeridos');
  const [result] = await db.getPool(t.db_name).query(
    'UPDATE users SET password = ?, failed_login_attempts = 0, locked_until = NULL WHERE LOWER(email) = ?',
    [await bcrypt.hash(password, 10), email]
  );
  if (!result.affectedRows) return fail(res, 404, 'No existe un usuario con ese correo en la empresa');
  await audit(req, 'tenant.reset_user_password', t.id, { email });
  ok(res, null, 'Contraseña restablecida');
}));

// ---------------- Pagos ----------------

router.post('/tenants/:id/payments', wrap(async (req, res) => {
  const t = await getTenantOr404(req.params.id);
  const months = Math.max(1, parseInt(req.body?.months, 10) || 1);
  const amount = Number(req.body?.amount);
  if (!(amount >= 0)) return fail(res, 400, 'Monto inválido');

  // El período empieza al vencer el anterior (o hoy si ya venció / no tenía)
  const today = todayHonduras();
  const current = toDateStr(t.paid_until);
  const start = current && current >= today ? addDays(current, 1) : today;
  const [y, m, d] = start.split('-').map(Number);
  const endDate = new Date(y, m - 1 + months, d - 1);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const result = await control.query(
    `INSERT INTO payments (tenant_id, amount, currency, months, period_start, period_end, method, reference, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.id, amount, req.body?.currency || 'HNL', months, start, end, req.body?.method || null,
      req.body?.reference || null, req.body?.notes || null, req.admin.id]
  );
  await control.query(`UPDATE tenants SET paid_until = ?, status = 'active' WHERE id = ?`, [end, t.id]);
  control.clearTenantCache();
  await audit(req, 'payment.create', t.id, { amount, months, start, end });
  ok(res, { id: result.insertId, period_start: start, period_end: end }, `Pago registrado. Activa hasta ${end}`);
}));

router.delete('/payments/:paymentId', wrap(async (req, res) => {
  const [p] = await control.query('SELECT * FROM payments WHERE id = ?', [req.params.paymentId]);
  if (!p) return fail(res, 404, 'Pago no encontrado');
  await control.query('DELETE FROM payments WHERE id = ?', [p.id]);
  // Recalcular vigencia con el último pago restante
  const [last] = await control.query('SELECT MAX(period_end) AS until FROM payments WHERE tenant_id = ?', [p.tenant_id]);
  await control.query('UPDATE tenants SET paid_until = ? WHERE id = ?', [last?.until || null, p.tenant_id]);
  control.clearTenantCache();
  await audit(req, 'payment.delete', p.tenant_id, { payment: p });
  ok(res, null, 'Pago anulado');
}));

router.get('/payments', wrap(async (req, res) => {
  const rows = await control.query(
    `SELECT p.*, t.name AS tenant_name FROM payments p JOIN tenants t ON t.id = p.tenant_id
     ORDER BY p.created_at DESC LIMIT 200`
  );
  ok(res, rows);
}));

// ---------------- Planes ----------------

router.get('/plans', wrap(async (req, res) => {
  ok(res, await control.query(`SELECT p.*, (SELECT COUNT(*) FROM tenants t WHERE t.plan_id = p.id) AS tenants FROM plans p ORDER BY p.price_monthly`));
}));

const PLAN_FIELDS = ['name', 'description', 'price_monthly', 'currency', 'max_users', 'max_branches', 'includes_ecommerce', 'is_active'];

router.post('/plans', wrap(async (req, res) => {
  if (!req.body?.name) return fail(res, 400, 'Nombre requerido');
  const fields = PLAN_FIELDS.filter(f => req.body[f] !== undefined);
  const r = await control.query(
    `INSERT INTO plans (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
    fields.map(f => (req.body[f] === '' ? null : req.body[f]))
  );
  await audit(req, 'plan.create', null, req.body);
  ok(res, { id: r.insertId }, 'Plan creado');
}));

router.put('/plans/:id', wrap(async (req, res) => {
  const fields = PLAN_FIELDS.filter(f => req.body?.[f] !== undefined);
  if (!fields.length) return fail(res, 400, 'Nada que actualizar');
  await control.query(`UPDATE plans SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
    [...fields.map(f => (req.body[f] === '' ? null : req.body[f])), req.params.id]);
  control.clearTenantCache();
  await audit(req, 'plan.update', null, { id: req.params.id, ...req.body });
  ok(res, null, 'Plan actualizado');
}));

router.get('/audit', wrap(async (req, res) => {
  ok(res, await control.query(
    `SELECT a.*, t.name AS tenant_name, s.email AS admin_email FROM admin_audit a
     LEFT JOIN tenants t ON t.id = a.tenant_id LEFT JOIN super_admins s ON s.id = a.admin_id
     ORDER BY a.created_at DESC LIMIT 200`
  ));
}));

module.exports = router;
