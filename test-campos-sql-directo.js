const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCamposAdicionales() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'prosper_pos'
    });

    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  PRUEBA DIRECTA SQL - CAMPOS ADICIONALES            ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    // ===== PRUEBA 1: COTIZACIÓN =====
    console.log('=== 1. CREAR COTIZACIÓN CON CAMPOS ADICIONALES ===');

    // Obtener el siguiente ID
    const [maxQuoteId] = await connection.query('SELECT COALESCE(MAX(id), 0) as max_id FROM quotes');
    const nextQuoteId = maxQuoteId[0].max_id + 1;
    const quoteNumber = String(nextQuoteId).padStart(10, '0');

    console.log(`Siguiente ID: ${nextQuoteId}`);
    console.log(`Número generado: ${quoteNumber}`);

    await connection.query(`
      INSERT INTO quotes (
        quote_number, customer_id, customer_name, customer_rtn,
        subtotal, discount, tax, total, surcharge, quote_date,
        orden_compra, constancia_exonerado, registro_sag, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      quoteNumber,
      1,
      'CLIENTE PRUEBA SQL',
      '00000000000000',
      100.00,
      0,
      15.00,
      115.00,
      0,
      new Date().toISOString().split('T')[0],
      'ORDEN-SQL-001',
      'CONST-SQL-002',
      'SAG-SQL-003',
      1
    ]);

    console.log('✓ Cotización creada');

    // Verificar
    const [quoteCheck] = await connection.query(`
      SELECT id, quote_number, orden_compra, constancia_exonerado, registro_sag
      FROM quotes WHERE id = ?
    `, [nextQuoteId]);

    if (quoteCheck.length > 0) {
      const q = quoteCheck[0];
      console.log('\n  VERIFICACIÓN:');
      console.log(`  ID en DB: ${q.id}`);
      console.log(`  Número en DB: ${q.quote_number}`);
      console.log(`  ¿Coincide ID con Número? ${q.id == parseInt(q.quote_number) ? '✓ SÍ' : '✗ NO'}`);
      console.log(`  Orden Compra: ${q.orden_compra || '❌ NO GUARDADO'}`);
      console.log(`  Constancia: ${q.constancia_exonerado || '❌ NO GUARDADO'}`);
      console.log(`  Registro SAG: ${q.registro_sag || '❌ NO GUARDADO'}`);

      if (q.orden_compra && q.constancia_exonerado && q.registro_sag) {
        console.log('  ✓✓✓ COTIZACIÓN: TODOS LOS CAMPOS GUARDADOS');
      } else {
        console.log('  ✗✗✗ COTIZACIÓN: FALTAN CAMPOS');
      }
    }

    // ===== PRUEBA 2: FACTURA EN ESPERA =====
    console.log('\n=== 2. CREAR FACTURA EN ESPERA CON CAMPOS ADICIONALES ===');

    const [maxPendingId] = await connection.query('SELECT COALESCE(MAX(id), 0) as max_id FROM pending_invoices');
    const nextPendingId = maxPendingId[0].max_id + 1;
    const pendingNumber = String(nextPendingId).padStart(10, '0');

    console.log(`Siguiente ID: ${nextPendingId}`);
    console.log(`Número generado: ${pendingNumber}`);

    await connection.query(`
      INSERT INTO pending_invoices (
        document_number, customer_id, customer_name, customer_rtn,
        subtotal, discount, tax, total, surcharge,
        orden_compra, constancia_exonerado, registro_sag, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pendingNumber,
      1,
      'CLIENTE PRUEBA PENDING',
      '11111111111111',
      200.00,
      0,
      30.00,
      230.00,
      0,
      'ORDEN-PENDING-001',
      'CONST-PENDING-002',
      'SAG-PENDING-003',
      1
    ]);

    console.log('✓ Factura en espera creada');

    // Verificar
    const [pendingCheck] = await connection.query(`
      SELECT id, document_number, orden_compra, constancia_exonerado, registro_sag
      FROM pending_invoices WHERE id = ?
    `, [nextPendingId]);

    if (pendingCheck.length > 0) {
      const p = pendingCheck[0];
      console.log('\n  VERIFICACIÓN:');
      console.log(`  ID en DB: ${p.id}`);
      console.log(`  Número en DB: ${p.document_number}`);
      console.log(`  ¿Coincide ID con Número? ${p.id == parseInt(p.document_number) ? '✓ SÍ' : '✗ NO'}`);
      console.log(`  Orden Compra: ${p.orden_compra || '❌ NO GUARDADO'}`);
      console.log(`  Constancia: ${p.constancia_exonerado || '❌ NO GUARDADO'}`);
      console.log(`  Registro SAG: ${p.registro_sag || '❌ NO GUARDADO'}`);

      if (p.orden_compra && p.constancia_exonerado && p.registro_sag) {
        console.log('  ✓✓✓ FACTURA EN ESPERA: TODOS LOS CAMPOS GUARDADOS');
      } else {
        console.log('  ✗✗✗ FACTURA EN ESPERA: FALTAN CAMPOS');
      }
    }

    // ===== PRUEBA 3: FACTURA =====
    console.log('\n=== 3. CREAR FACTURA CON CAMPOS ADICIONALES ===');

    // Generar número de factura
    const invoiceNumber = '000-002-01-00000999';

    await connection.query(`
      INSERT INTO invoices (
        invoice_number, customer_name, customer_rtn,
        subtotal, tax_amount, total,
        orden_compra, constancia_exonerado, registro_sag,
        created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber,
      'CLIENTE PRUEBA FACTURA',
      '22222222222222',
      300.00,
      45.00,
      345.00,
      'ORDEN-INVOICE-001',
      'CONST-INVOICE-002',
      'SAG-INVOICE-003',
      1,
      1
    ]);

    console.log('✓ Factura creada');

    // Verificar
    const [invoiceCheck] = await connection.query(`
      SELECT id, invoice_number, orden_compra, constancia_exonerado, registro_sag
      FROM invoices WHERE invoice_number = ?
    `, [invoiceNumber]);

    if (invoiceCheck.length > 0) {
      const inv = invoiceCheck[0];
      console.log('\n  VERIFICACIÓN:');
      console.log(`  ID en DB: ${inv.id}`);
      console.log(`  Número: ${inv.invoice_number}`);
      console.log(`  Orden Compra: ${inv.orden_compra || '❌ NO GUARDADO'}`);
      console.log(`  Constancia: ${inv.constancia_exonerado || '❌ NO GUARDADO'}`);
      console.log(`  Registro SAG: ${inv.registro_sag || '❌ NO GUARDADO'}`);

      if (inv.orden_compra && inv.constancia_exonerado && inv.registro_sag) {
        console.log('  ✓✓✓ FACTURA: TODOS LOS CAMPOS GUARDADOS');
      } else {
        console.log('  ✗✗✗ FACTURA: FALTAN CAMPOS');
      }
    }

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║  PRUEBAS COMPLETADAS                                ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testCamposAdicionales();
