#!/usr/bin/env node
// ===================================================================
// PROSPERPOS - GENERAR PLANTILLA PARA EMPRESAS NUEVAS (archivos)
// Uso: node scripts/build-tenant-template.js [nombre_base_origen]
// Escribe database/tenant-template/schema.sql y seed.sql.
// En producción también se puede usar TEMPLATE_SOURCE_DB (sin archivos).
// ===================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { dbConfig } = require('../src/utils/database');
const { buildTemplate } = require('../src/tenancy/template-builder');

async function main() {
  const source = process.argv[2] || dbConfig.database;
  const conn = await mysql.createConnection({
    host: dbConfig.host, port: dbConfig.port, user: dbConfig.user, password: dbConfig.password,
    database: source, charset: 'utf8mb4', dateStrings: true
  });
  const { schema, seed, tables, views } = await buildTemplate(conn, source);
  const dir = path.join(__dirname, '../database/tenant-template');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'schema.sql'), schema);
  fs.writeFileSync(path.join(dir, 'seed.sql'), seed);
  console.log(`✅ Plantilla generada: ${tables} tablas, ${views} vistas → ${dir}`);
  await conn.end();
}

main().catch(err => {
  console.error('❌ Error generando plantilla:', err.message);
  process.exit(1);
});
