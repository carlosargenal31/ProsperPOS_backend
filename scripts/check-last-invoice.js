// Verificar última factura
const mysql = require('mysql2/promise');

async function checkLastInvoice() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('🔍 VERIFICANDO ÚLTIMA FACTURA\n');

    // Obtener últimas facturas
    const [invoices] = await connection.query(`
      SELECT id, invoice_number, created_at
      FROM invoices
      ORDER BY id DESC
      LIMIT 10
    `);

    if (invoices.length === 0) {
      console.log('⚠️  No hay facturas en la base de datos\n');
    } else {
      console.log('📋 Últimas 10 facturas:\n');
      console.table(invoices.map(inv => ({
        ID: inv.id,
        'Número de Factura': inv.invoice_number,
        'Fecha': new Date(inv.created_at).toLocaleString('es-HN')
      })));

      const lastInvoice = invoices[0];
      console.log('\n📌 ÚLTIMA FACTURA:');
      console.log(`   - ID: ${lastInvoice.id}`);
      console.log(`   - Número: ${lastInvoice.invoice_number}`);

      // Extraer el número del consecutivo (últimos 8 dígitos)
      const match = lastInvoice.invoice_number.match(/(\d{8})$/);
      if (match) {
        const lastConsecutive = parseInt(match[1]);
        const nextConsecutive = lastConsecutive + 1;

        console.log(`   - Consecutivo actual: ${lastConsecutive}`);
        console.log(`   - PRÓXIMO CONSECUTIVO: ${nextConsecutive}`);

        // Actualizar consecutives y resolutions
        console.log('\n🔄 Actualizando tablas...');

        await connection.query(`
          UPDATE consecutives
          SET current_number = ?
          WHERE document_type = 'invoice'
        `, [nextConsecutive]);
        console.log(`   ✅ Tabla consecutives actualizada a: ${nextConsecutive}`);

        await connection.query(`
          UPDATE resolutions
          SET nro_actual_control = ?
          WHERE is_active = 1 AND deleted_at IS NULL
        `, [nextConsecutive]);
        console.log(`   ✅ Tabla resolutions actualizada a: ${nextConsecutive}`);

        console.log(`\n✅ PRÓXIMA FACTURA SERÁ: 000-002-01-${String(nextConsecutive).padStart(8, '0')}\n`);
      }
    }

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

checkLastInvoice();
