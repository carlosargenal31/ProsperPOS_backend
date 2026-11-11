// ===================================================================
// TEST - COLUMNA DEVUELTO EN LIBRO DE VENTAS
// ===================================================================

const db = require('./src/utils/database');

async function testDevueltoColumn() {
  console.log('🔍 Probando consulta de columna Devuelto...\n');

  try {
    // Test 1: Verificar que la columna devuelto existe en facturas
    console.log('📊 Test 1: Consultando facturas con columna devuelto...');
    const query = `
      SELECT
        i.id,
        i.invoice_number,
        i.total,
        i.payment_status,
        COALESCE(
          (SELECT ABS(SUM(cn.total))
           FROM credit_notes cn
           WHERE cn.invoice_id = i.id
           AND cn.deleted_at IS NULL),
          0
        ) as devuelto
      FROM invoices i
      WHERE i.deleted_at IS NULL
      ORDER BY i.id DESC
      LIMIT 10
    `;

    const invoices = await db.execute(query);

    console.log(`✅ Se encontraron ${invoices.length} facturas\n`);

    if (invoices.length > 0) {
      console.log('📋 Primeras 10 facturas:\n');
      invoices.forEach(inv => {
        console.log(`  ID: ${inv.id}`);
        console.log(`  Nro: ${inv.invoice_number}`);
        console.log(`  Total: L ${parseFloat(inv.total).toFixed(2)}`);
        console.log(`  Devuelto: L ${parseFloat(inv.devuelto).toFixed(2)}`);
        console.log(`  Estado: ${inv.payment_status}`);
        console.log(`  ${inv.devuelto > 0 ? '⚠️  TIENE DEVOLUCIÓN' : '✓ Sin devolución'}`);
        console.log('  ---');
      });
    }

    // Test 2: Buscar facturas con devoluciones
    console.log('\n📊 Test 2: Buscando facturas con devoluciones...');
    const queryWithReturns = `
      SELECT
        i.id,
        i.invoice_number,
        i.total,
        COALESCE(
          (SELECT ABS(SUM(cn.total))
           FROM credit_notes cn
           WHERE cn.invoice_id = i.id
           AND cn.deleted_at IS NULL),
          0
        ) as devuelto
      FROM invoices i
      WHERE i.deleted_at IS NULL
      HAVING devuelto > 0
      LIMIT 5
    `;

    const invoicesWithReturns = await db.execute(queryWithReturns);

    if (invoicesWithReturns.length > 0) {
      console.log(`✅ Se encontraron ${invoicesWithReturns.length} facturas con devoluciones\n`);
      invoicesWithReturns.forEach(inv => {
        console.log(`  ID: ${inv.id} | Nro: ${inv.invoice_number}`);
        console.log(`  Total: L ${parseFloat(inv.total).toFixed(2)}`);
        console.log(`  Devuelto: L ${parseFloat(inv.devuelto).toFixed(2)} ⚠️`);
        console.log(`  Porcentaje devuelto: ${((inv.devuelto / inv.total) * 100).toFixed(1)}%`);
        console.log('  ---');
      });
    } else {
      console.log('ℹ️  No se encontraron facturas con devoluciones');
    }

    // Test 3: Verificar notas de crédito
    console.log('\n📊 Test 3: Verificando notas de crédito...');
    const creditNotesQuery = `
      SELECT
        cn.id,
        cn.invoice_id,
        cn.total as cn_total,
        i.invoice_number,
        i.total as invoice_total
      FROM credit_notes cn
      LEFT JOIN invoices i ON cn.invoice_id = i.id
      WHERE cn.deleted_at IS NULL
      ORDER BY cn.id DESC
      LIMIT 5
    `;

    const creditNotes = await db.execute(creditNotesQuery);

    if (creditNotes.length > 0) {
      console.log(`✅ Se encontraron ${creditNotes.length} notas de crédito\n`);
      creditNotes.forEach(cn => {
        console.log(`  NC ID: ${cn.id} | Factura: ${cn.invoice_number || 'N/A'}`);
        console.log(`  Total Factura: L ${cn.invoice_total ? parseFloat(cn.invoice_total).toFixed(2) : 'N/A'}`);
        console.log(`  Total NC: L ${parseFloat(cn.cn_total).toFixed(2)}`);
        console.log('  ---');
      });
    } else {
      console.log('ℹ️  No se encontraron notas de crédito');
    }

    // Test 4: Estadísticas generales
    console.log('\n📊 Test 4: Estadísticas generales...');
    const statsQuery = `
      SELECT
        COUNT(*) as total_facturas,
        SUM(CASE WHEN devuelto > 0 THEN 1 ELSE 0 END) as facturas_con_devolucion,
        SUM(total) as total_facturado,
        SUM(devuelto) as total_devuelto
      FROM (
        SELECT
          i.id,
          i.total,
          COALESCE(
            (SELECT ABS(SUM(cn.total))
             FROM credit_notes cn
             WHERE cn.invoice_id = i.id
             AND cn.deleted_at IS NULL),
            0
          ) as devuelto
        FROM invoices i
        WHERE i.deleted_at IS NULL
      ) as facturas_con_devolucion
    `;

    const stats = await db.execute(statsQuery);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log('✅ Estadísticas:\n');
      console.log(`  Total de facturas: ${stat.total_facturas}`);
      console.log(`  Facturas con devolución: ${stat.facturas_con_devolucion}`);
      console.log(`  % con devolución: ${((stat.facturas_con_devolucion / stat.total_facturas) * 100).toFixed(2)}%`);
      console.log(`  Total facturado: L ${parseFloat(stat.total_facturado || 0).toFixed(2)}`);
      console.log(`  Total devuelto: L ${parseFloat(stat.total_devuelto || 0).toFixed(2)}`);
      console.log(`  % devuelto: ${((stat.total_devuelto / stat.total_facturado) * 100).toFixed(2)}%`);
    }

    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE\n');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Ejecutar tests
testDevueltoColumn();
