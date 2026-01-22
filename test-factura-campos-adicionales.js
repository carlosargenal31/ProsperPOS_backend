const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInvoiceFields() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('✓ Conectado a MySQL\n');

    // Obtener la última factura
    const [invoices] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        orden_compra,
        constancia_exonerado,
        registro_sag,
        created_at
      FROM invoices
      ORDER BY id DESC
      LIMIT 5
    `);

    console.log('=== ÚLTIMAS 5 FACTURAS ===\n');

    if (invoices.length === 0) {
      console.log('⚠️ No hay facturas en la base de datos');
      return;
    }

    invoices.forEach((inv, index) => {
      console.log(`${index + 1}. FACTURA #${inv.id}`);
      console.log(`   Número: ${inv.invoice_number}`);
      console.log(`   Cliente: ${inv.customer_name}`);
      console.log(`   Orden Compra: ${inv.orden_compra || 'VACÍO ❌'}`);
      console.log(`   Constancia: ${inv.constancia_exonerado || 'VACÍO ❌'}`);
      console.log(`   Registro SAG: ${inv.registro_sag || 'VACÍO ❌'}`);
      console.log(`   Fecha: ${inv.created_at}`);

      if (inv.orden_compra && inv.constancia_exonerado && inv.registro_sag) {
        console.log('   ✅ TODOS LOS CAMPOS GUARDADOS');
      } else {
        console.log('   ❌ FALTAN CAMPOS');
      }
      console.log('');
    });

    // Verificar estructura de la tabla
    console.log('\n=== VERIFICANDO ESTRUCTURA DE LA TABLA ===\n');

    const [columns] = await connection.query(`
      SHOW COLUMNS FROM invoices
      WHERE Field IN ('orden_compra', 'constancia_exonerado', 'registro_sag')
    `);

    if (columns.length === 3) {
      console.log('✅ Las 3 columnas existen en la tabla invoices:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL permitido' : 'NOT NULL'})`);
      });
    } else {
      console.log('❌ FALTAN COLUMNAS EN LA TABLA invoices');
      console.log('Columnas encontradas:', columns.length);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testInvoiceFields();
