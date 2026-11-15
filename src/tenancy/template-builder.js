// ===================================================================
// PROSPERPOS - PLANTILLA PARA EMPRESAS NUEVAS
// Genera la estructura (CREATE TABLE) y los catálogos iniciales a partir
// de una base existente (ej. la de Cerámicas Universal). Se usa desde el
// script scripts/build-tenant-template.js y también en tiempo de ejecución
// (TEMPLATE_SOURCE_DB) para crear empresas sin archivos en el repositorio.
// ===================================================================

// Catálogos que toda empresa necesita tal cual (permisos, ubicaciones, etc.)
const FULL_DATA_TABLES = [
  'roles', 'permissions', 'role_permissions',
  'countries', 'states', 'cities', 'locations',
  'currencies', 'units', 'tax_rates', 'payment_methods',
  'beneficiary_types', 'positions', 'departments', 'expense_categories'
];

// Tablas que necesitan UNA fila inicial (se personaliza al crear la empresa)
const FIRST_ROW_TABLES = ['companies', 'stores', 'branches', 'warehouses'];

// Columnas que nunca se copian de la empresa origen (datos fiscales/contacto)
const SCRUB_COLUMNS = new Set([
  'rtn', 'phone', 'telefono', 'email', 'correo', 'whatsapp', 'address', 'direccion', 'ubicacion',
  'logo', 'logo_url', 'website', 'facebook', 'instagram', 'cai', 'company_rtn'
]);

/**
 * @param {import('mysql2/promise').Connection} conn conexión con dateStrings: true
 * @param {string} source base de datos origen
 * @returns {Promise<{schema: string, seed: string, tables: number, views: number}>}
 */
async function buildTemplate(conn, source) {
  const [tables] = await conn.query(
    `SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`, [source]
  );
  const names = tables.map(t => t.name);

  let schema = `-- Plantilla de estructura ProsperPOS (generada desde ${source} el ${new Date().toISOString()})\n`;
  schema += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';
  for (const name of names) {
    const [[row]] = await conn.query(`SHOW CREATE TABLE \`${source}\`.\`${name}\``);
    schema += `${row['Create Table'].replace(/ AUTO_INCREMENT=\d+/, '')};\n\n`;
  }
  const [views] = await conn.query(
    'SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ?', [source]
  );
  for (const v of views) {
    const [[row]] = await conn.query(`SHOW CREATE VIEW \`${source}\`.\`${v.name}\``);
    schema += `${row['Create View']
      .replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '')
      .replace(/SQL SECURITY DEFINER\s*/g, '')
      .split(`\`${source}\`.`).join('')};\n\n`;
  }
  schema += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  let seed = `-- Datos iniciales ProsperPOS (generados desde ${source})\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;
  const insertRows = (table, rows, scrub) => {
    if (!rows.length) return '';
    const cols = Object.keys(rows[0]);
    const values = rows.map(r => `(${cols.map(c => conn.escape(scrub && SCRUB_COLUMNS.has(c.toLowerCase()) ? null : r[c])).join(', ')})`);
    let out = '';
    for (let i = 0; i < values.length; i += 200) {
      out += `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES\n${values.slice(i, i + 200).join(',\n')};\n`;
    }
    return `${out}\n`;
  };
  for (const table of FULL_DATA_TABLES) {
    if (!names.includes(table)) continue;
    const [rows] = await conn.query(`SELECT * FROM \`${source}\`.\`${table}\``);
    seed += `-- ${table} (${rows.length})\n${insertRows(table, rows, false)}`;
  }
  for (const table of FIRST_ROW_TABLES) {
    if (!names.includes(table)) continue;
    const [rows] = await conn.query(`SELECT * FROM \`${source}\`.\`${table}\` ORDER BY id LIMIT 1`);
    seed += `-- ${table} (fila inicial)\n${insertRows(table, rows, true)}`;
  }
  seed += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  return { schema, seed, tables: names.length, views: views.length };
}

module.exports = { buildTemplate, FULL_DATA_TABLES, FIRST_ROW_TABLES };
