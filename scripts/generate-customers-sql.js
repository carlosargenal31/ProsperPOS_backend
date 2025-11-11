const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('Generando script SQL para insertar todos los clientes...');

// Leer Excel
const wb = XLSX.readFile(path.join(__dirname, '..', 'Clientes.xls'));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`Total de clientes encontrados: ${data.length}`);

// Generar SQL
let sql = `-- ===================================================================
-- PROSPERPOS - INSERTAR TODOS LOS CLIENTES
-- ===================================================================
-- Total de clientes: ${data.length}
-- ===================================================================

USE prosperpos;

-- Insertar clientes
INSERT INTO customers (codigo, nombre, nombre_comercial, codigo_tipo_precio, fecha_inicio, doc_identificacion, descuento_prc, tipo_beneficiario, is_active, created_at) VALUES
`;

const values = data.map((row, index) => {
  const codigo = (row.codigo || '').toString().trim();
  const nombre = (row.nombre || '').toString().replace(/'/g, "''").trim();
  const nombre_comercial = (row.nombre_comercial || '').toString().replace(/'/g, "''").trim();
  const codigo_tipo_precio = (row.codigo_tipo_precio || '').toString().trim();
  const fecha_inicio = row.fecha_inicio || null;
  const doc_identificacion = (row.idfiscal1 || '').toString().trim();
  const descuento_prc = parseFloat(row.descuento_prc || 0).toFixed(2);
  const tipo_beneficiario = (row.tipo_beneficiario || '1').toString();
  const is_active = row.estatus === '1' || row.estatus === 1 ? 1 : 0;

  return `('${codigo}', '${nombre}', '${nombre_comercial}', '${codigo_tipo_precio}', ${fecha_inicio ? `'${fecha_inicio}'` : 'NULL'}, '${doc_identificacion}', ${descuento_prc}, '${tipo_beneficiario}', ${is_active}, NOW())`;
});

sql += values.join(',\n');
sql += `;

-- Verificación
SELECT 'CLIENTES INSERTADOS:' as '';
SELECT COUNT(*) as total FROM customers;
SELECT id, codigo, nombre, nombre_comercial, doc_identificacion, is_active
FROM customers
ORDER BY id
LIMIT 10;
`;

// Guardar archivo
const outputPath = path.join(__dirname, '..', 'database', 'migrations', 'insert_all_customers.sql');
fs.writeFileSync(outputPath, sql, 'utf8');

console.log('✅ Script SQL generado exitosamente:');
console.log(`   ${outputPath}`);
console.log(`   Total de registros: ${data.length}`);
