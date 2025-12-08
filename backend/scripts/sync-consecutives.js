// ===================================================================
// SINCRONIZAR CONSECUTIVOS CON DOCUMENTOS EXISTENTES
// ===================================================================
// Este script actualiza la tabla consecutives basándose en los
// documentos reales existentes en la base de datos
// ===================================================================

const mysql = require('mysql2/promise');

async function syncConsecutives() {
  console.log('🔄 SINCRONIZANDO CONSECUTIVOS CON DOCUMENTOS EXISTENTES\n');

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '310104',
      database: 'prosperpos'
    });

    console.log('✅ Conexión exitosa a MySQL\n');

    // 1. Obtener el último ID de cotizaciones
    console.log('1️⃣  Verificando última cotización...');
    const [quotes] = await connection.query(`
      SELECT MAX(id) as last_id, COUNT(*) as total
      FROM quotes
      WHERE deleted_at IS NULL
    `);

    const lastQuoteId = quotes[0].last_id || 0;
    const totalQuotes = quotes[0].total || 0;
    const nextQuoteNumber = lastQuoteId + 1;

    console.log(`   - Última cotización: ID ${lastQuoteId}`);
    console.log(`   - Total de cotizaciones: ${totalQuotes}`);
    console.log(`   - Próximo consecutivo: ${nextQuoteNumber}\n`);

    // 2. Obtener el último ID de facturas en espera
    console.log('2️⃣  Verificando última factura en espera...');
    const [pendingInvoices] = await connection.query(`
      SELECT MAX(id) as last_id, COUNT(*) as total
      FROM pending_invoices
      WHERE deleted_at IS NULL
    `);

    const lastPendingId = pendingInvoices[0].last_id || 0;
    const totalPending = pendingInvoices[0].total || 0;
    const nextPendingNumber = lastPendingId + 1;

    console.log(`   - Última factura en espera: ID ${lastPendingId}`);
    console.log(`   - Total de facturas en espera: ${totalPending}`);
    console.log(`   - Próximo consecutivo: ${nextPendingNumber}\n`);

    // 3. Obtener el último consecutivo de facturas desde la resolución
    console.log('3️⃣  Verificando última factura...');
    const [resolutions] = await connection.query(`
      SELECT nro_actual_control
      FROM resolutions
      WHERE is_active = 1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const currentInvoiceNumber = resolutions[0]?.nro_actual_control || 31839;
    console.log(`   - Consecutivo actual de factura: ${currentInvoiceNumber}`);
    console.log(`   - (Basado en resolución activa)\n`);

    // 4. Actualizar tabla consecutives
    console.log('4️⃣  Actualizando tabla consecutives...\n');

    // Actualizar cotizaciones
    await connection.query(`
      UPDATE consecutives
      SET current_number = ?
      WHERE document_type = 'quote'
    `, [nextQuoteNumber]);
    console.log(`   ✅ Consecutivo de cotizaciones actualizado a: ${nextQuoteNumber}`);

    // Actualizar facturas en espera
    await connection.query(`
      UPDATE consecutives
      SET current_number = ?
      WHERE document_type = 'pending_invoice'
    `, [nextPendingNumber]);
    console.log(`   ✅ Consecutivo de facturas en espera actualizado a: ${nextPendingNumber}`);

    // Actualizar facturas (sincronizado con resolución)
    await connection.query(`
      UPDATE consecutives
      SET current_number = ?
      WHERE document_type = 'invoice'
    `, [currentInvoiceNumber]);
    console.log(`   ✅ Consecutivo de facturas actualizado a: ${currentInvoiceNumber}\n`);

    // 5. Verificar resultados
    console.log('5️⃣  Verificación final:\n');
    const [finalData] = await connection.query("SELECT * FROM consecutives ORDER BY id");

    console.table(finalData.map(row => ({
      'Tipo': row.document_type,
      'Consecutivo Actual': row.current_number,
      'Prefijo': row.prefix || 'N/A',
      'Descripción': row.description
    })));

    await connection.end();

    console.log('\n✅ SINCRONIZACIÓN COMPLETADA\n');
    console.log('📝 Resumen:');
    console.log(`   - Cotizaciones: Próximo número = ${nextQuoteNumber}`);
    console.log(`   - Facturas en espera: Próximo número = ${nextPendingNumber}`);
    console.log(`   - Facturas: Próximo número = ${currentInvoiceNumber}\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

syncConsecutives();
