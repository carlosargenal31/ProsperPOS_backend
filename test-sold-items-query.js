// Script para probar la consulta de productos vendidos
require('dotenv').config();
const db = require('./src/utils/database');

async function testQuery() {
  try {
    console.log('=== Probando consulta de productos vendidos ===\n');

    // Consulta simplificada
    const query = `
      SELECT
        COALESCE(p.code, '') AS codigo,
        p.name AS producto,
        SUM(COALESCE(ii.quantity, 0)) AS cantidad,
        AVG(COALESCE(ii.unit_price, 0)) AS precio,
        SUM(COALESCE(ii.subtotal, 0)) AS total_neto,
        SUM(COALESCE(ii.tax_amount, 0)) AS impuesto,
        SUM(COALESCE(ii.line_total, 0)) AS total_final
      FROM invoice_items ii
      INNER JOIN invoices i ON ii.invoice_id = i.id
      INNER JOIN products p ON ii.product_id = p.id
      WHERE i.invoice_type = 'factura'
        AND i.deleted_at IS NULL
      GROUP BY p.id, p.code, p.name
      ORDER BY cantidad DESC
      LIMIT 10
    `;

    console.log('Ejecutando consulta...\n');
    const result = await db.query(query);
    const rows = Array.isArray(result) ? result[0] : result;

    console.log(`Registros encontrados: ${rows ? rows.length : 0}\n`);

    if (rows.length > 0) {
      console.log('Top 10 productos vendidos:');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('Código'.padEnd(15), 'Producto'.padEnd(30), 'Cantidad'.padStart(10), 'Total Final'.padStart(15));
      console.log('───────────────────────────────────────────────────────────────────');

      rows.forEach(row => {
        console.log(
          String(row.codigo || '').padEnd(15),
          String(row.producto || '').substring(0, 30).padEnd(30),
          String(row.cantidad || 0).padStart(10),
          `L ${parseFloat(row.total_final || 0).toFixed(2)}`.padStart(15)
        );
      });

      console.log('═══════════════════════════════════════════════════════════════════');

      // Calcular totales
      const totales = rows.reduce((acc, row) => ({
        cantidad: acc.cantidad + parseFloat(row.cantidad || 0),
        total_neto: acc.total_neto + parseFloat(row.total_neto || 0),
        impuesto: acc.impuesto + parseFloat(row.impuesto || 0),
        total_final: acc.total_final + parseFloat(row.total_final || 0)
      }), { cantidad: 0, total_neto: 0, impuesto: 0, total_final: 0 });

      console.log('\nTotales (Top 10):');
      console.log(`  Cantidad Total: ${totales.cantidad.toFixed(2)}`);
      console.log(`  Total Neto: L ${totales.total_neto.toFixed(2)}`);
      console.log(`  Impuesto: L ${totales.impuesto.toFixed(2)}`);
      console.log(`  Total Final: L ${totales.total_final.toFixed(2)}`);
    } else {
      console.log('No se encontraron productos vendidos.');
      console.log('\nVerificando datos en las tablas...');

      const [invoiceCount] = await db.query(`
        SELECT COUNT(*) as count FROM invoices WHERE invoice_type = 'factura' AND deleted_at IS NULL
      `);
      console.log(`  - Facturas en el sistema: ${invoiceCount[0].count}`);

      const [itemCount] = await db.query(`
        SELECT COUNT(*) as count FROM invoice_items
      `);
      console.log(`  - Items de factura: ${itemCount[0].count}`);

      const [productCount] = await db.query(`
        SELECT COUNT(*) as count FROM products
      `);
      console.log(`  - Productos: ${productCount[0].count}`);
    }

    console.log('\n=== Prueba completada exitosamente ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en la consulta:');
    console.error('Mensaje:', error.message);
    console.error('SQL Error:', error.sqlMessage || 'N/A');
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testQuery();
