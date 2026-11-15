#!/usr/bin/env node
// ===================================================================
// PROSPERPOS - GENERAR PLANTILLA PARA EMPRESAS NUEVAS
// Lee la estructura de una base existente (ej. la de Cerámicas Universal)
// y escribe database/tenant-template/schema.sql y seed.sql.
//
// Uso: node scripts/build-tenant-template.js [nombre_base_origen]
//   (usa DATABASE_URL o DB_* del .env para conectarse)
// ===================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../src/utils/database');

// Catálogos que toda empresa necesita tal cual (permisos, ubicaciones de Honduras, etc.)
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

function esc(conn, value) {
  return conn.escape(value);
}

async function main() {
  const source = process.argv[2] || dbConfig.database;
  const conn = await mysql.createConnection({
    host: dbConfig.host, port: dbConfig.port, user: dbConfig.user, password: dbConfig.password,
    database: source, charset: 'utf8mb4', dateStrings: true
  });

  const [tables] = await conn.query(
    `SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`, [source]
  );
  const names = tables.map(t => t.name);

  // ---------- Estructura ----------
  let schema = `-- Plantilla de estructura ProsperPOS (generada desde ${source} el ${new Date().toISOString()})\n`;
  schema += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';
  for (const name of names) {
    const [[row]] = await conn.query(`SHOW CREATE TABLE \`${name}\``);
    const ddl = row['Create Table'].replace(/ AUTO_INCREMENT=\d+/, '');
    schema += `${ddl};\n\n`;
  }
  const [views] = await conn.query(
    `SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ?`, [source]
  );
  for (const v of views) {
    const [[row]] = await conn.query(`SHOW CREATE VIEW \`${v.name}\``);
    schema += `${row['Create View'].replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '').replace(/SQL SECURITY DEFINER\s*/g, '')};\n\n`;
  }
  schema += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  // ---------- Datos iniciales ----------
  let seed = `-- Datos iniciales ProsperPOS (generados desde ${source})\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;
  const insertRows = (table, rows, scrub) => {
    if (!rows.length) return '';
    const cols = Object.keys(rows[0]);
    const values = rows.map(r => `(${cols.map(c => esc(conn, scrub && SCRUB_COLUMNS.has(c.toLowerCase()) ? null : r[c])).join(', ')})`);
    let out = '';
    for (let i = 0; i < values.length; i += 200) {
      out += `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES\n${values.slice(i, i + 200).join(',\n')};\n`;
    }
    return out + '\n';
  };
  for (const table of FULL_DATA_TABLES) {
    if (!names.includes(table)) continue;
    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    seed += `-- ${table} (${rows.length})\n` + insertRows(table, rows, false);
  }
  for (const table of FIRST_ROW_TABLES) {
    if (!names.includes(table)) continue;
    const [rows] = await conn.query(`SELECT * FROM \`${table}\` ORDER BY id LIMIT 1`);
    seed += `-- ${table} (fila inicial)\n` + insertRows(table, rows, true);
  }
  seed += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  const dir = path.join(__dirname, '../database/tenant-template');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'schema.sql'), schema);
  fs.writeFileSync(path.join(dir, 'seed.sql'), seed);
  console.log(`✅ Plantilla generada: ${names.length} tablas, ${views.length} vistas → ${dir}`);
  await conn.end();
}

main().catch(err => {
  console.error('❌ Error generando plantilla:', err.message);
  process.exit(1);
});
