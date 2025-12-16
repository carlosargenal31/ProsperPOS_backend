// Script simple para probar la consulta de productos vendidos
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testQuery() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('=== Probando consulta de productos vendidos ===\n');

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

    const [rows] = await conn.query(query);

    console.log(`✓ Consulta ejecutada exitosamente!`);
    console.log(`✓ Registros encontrados: ${rows.length}\n`);

    if (rows.length > 0) {
      console.log('Top 10 productos vendidos:');
      console.log('═══════════════════════════════════════════════════════════════════════════════');
      console.log('Código'.padEnd(15), 'Producto'.padEnd(35), 'Cant.'.padStart(8), 'Total'.padStart(12));
      console.log('───────────────────────────────────────────────────────────────────────────────');

      rows.forEach((row, index) => {
        const codigo = String(row.codigo || '').substring(0, 14);
        const producto = String(row.producto || '').substring(0, 34);
        const cantidad = parseFloat(row.cantidad || 0).toFixed(1);
        const total = parseFloat(row.total_final || 0).toFixed(2);

        console.log(
          `${index + 1}.`.padStart(3),
          codigo.padEnd(12),
          producto.padEnd(35),
          cantidad.padStart(8),
          `L ${total}`.padStart(12)
        );
      });

      console.log('═══════════════════════════════════════════════════════════════════════════════');

      const totales = rows.reduce((acc, row) => ({
        cantidad: acc.cantidad + parseFloat(row.cantidad || 0),
        total_neto: acc.total_neto + parseFloat(row.total_neto || 0),
        impuesto: acc.impuesto + parseFloat(row.impuesto || 0),
        total_final: acc.total_final + parseFloat(row.total_final || 0)
      }), { cantidad: 0, total_neto: 0, impuesto: 0, total_final: 0 });

      console.log('\n📊 TOTALES (Top 10):');
      console.log(`   Cantidad Total: ${totales.cantidad.toFixed(2)} unidades`);
      console.log(`   Total Neto:     L ${totales.total_neto.toFixed(2)}`);
      console.log(`   Impuesto:       L ${totales.impuesto.toFixed(2)}`);
      console.log(`   Total Final:    L ${totales.total_final.toFixed(2)}`);
    } else {
      console.log('⚠️  No se encontraron productos vendidos.');
    }

    console.log('\n✅ Prueba completada exitosamente!');
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en la consulta:');
    console.error('Mensaje:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
    if (conn) await conn.end();
    process.exit(1);
  }
}

testQuery();
