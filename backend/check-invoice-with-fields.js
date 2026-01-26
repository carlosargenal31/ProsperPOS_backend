const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkInvoices() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL\n');

    // Buscar facturas con campos adicionales
    const [invoices] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag,
        issue_date
      FROM invoices
      WHERE deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('=== ÚLTIMAS 10 FACTURAS ===\n');

    invoices.forEach(inv => {
      console.log(`ID: ${inv.id} | Número: ${inv.invoice_number}`);
      console.log(`Cliente: ${inv.customer_name}`);
      console.log(`Orden Compra: "${inv.orden_compra || 'NULL'}"`);
      console.log(`Constancia: "${inv.constancia_exonerado || 'NULL'}"`);
      console.log(`Registro SAG: "${inv.registro_sag || 'NULL'}"`);
      console.log(`Fecha: ${inv.issue_date}`);
      console.log('---');
    });

    // Buscar específicamente facturas con valores
    const [withValues] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag
      FROM invoices
      WHERE (orden_compra IS NOT NULL AND orden_compra != '')
         OR (constancia_exonerado IS NOT NULL AND constancia_exonerado != '')
         OR (registro_sag IS NOT NULL AND registro_sag != '')
      ORDER BY id DESC
      LIMIT 5
    `);

    if (withValues.length > 0) {
      console.log('\n=== FACTURAS CON CAMPOS ADICIONALES ===\n');
      withValues.forEach(inv => {
        console.log(`✅ ID: ${inv.id} | Número: ${inv.invoice_number}`);
        console.log(`   Orden Compra: "${inv.orden_compra}"`);
        console.log(`   Constancia: "${inv.constancia_exonerado}"`);
        console.log(`   Registro SAG: "${inv.registro_sag}"`);
        console.log('');
      });
    } else {
      console.log('\n❌ NO HAY facturas con campos adicionales\n');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

checkInvoices();
