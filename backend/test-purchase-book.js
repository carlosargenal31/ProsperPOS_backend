// ===================================================================
// SCRIPT DE PRUEBA - LIBRO DE COMPRAS
// ===================================================================

const db = require('./src/utils/database');
const PurchaseBookService = require('./src/services/purchase-book.service');

async function testPurchaseBook() {
  try {
    console.log('='.repeat(70));
    console.log('PRUEBA DEL LIBRO DE COMPRAS');
    console.log('='.repeat(70));

    // Test 1: Obtener todas las compras del último mes
    console.log('\n📋 TEST 1: Obtener compras del último mes\n');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const result1 = await PurchaseBookService.getPurchaseBook({
      date_from: lastMonth.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    });

    console.log(`Total de registros: ${result1.totals.total_registros}`);
    console.log(`Total compras: ${result1.totals.total_compras}`);
    console.log(`Total devoluciones: ${result1.totals.total_devoluciones}`);
    console.log(`Subtotal: L ${result1.totals.subtotal_total.toFixed(2)}`);
    console.log(`Descuento: L ${result1.totals.descuento_total.toFixed(2)}`);
    console.log(`Flete: L ${result1.totals.flete_total.toFixed(2)}`);
    console.log(`Impuesto: L ${result1.totals.impuesto_total.toFixed(2)}`);
    console.log(`TOTAL: L ${result1.totals.total_total.toFixed(2)}`);
    console.log(`Abonado: L ${result1.totals.abonado_total.toFixed(2)}`);
    console.log(`Saldo: L ${result1.totals.saldo_total.toFixed(2)}`);

    if (result1.purchases.length > 0) {
      console.log('\n📦 Primeras 5 compras:');
      result1.purchases.slice(0, 5).forEach((purchase, index) => {
        console.log(`\n${index + 1}. ${purchase.nro_documento}`);
        console.log(`   Fecha: ${purchase.fecha_operacion}`);
        console.log(`   Proveedor: ${purchase.proveedor}`);
        console.log(`   RTN: ${purchase.rtn_proveedor || 'N/A'}`);
        console.log(`   Almacén: ${purchase.almacen}`);
        console.log(`   Estatus: ${purchase.estatus}`);
        console.log(`   Total: L ${parseFloat(purchase.total).toFixed(2)}`);
      });
    }

    // Test 2: Obtener resumen por día
    console.log('\n\n📊 TEST 2: Resumen agrupado por día\n');
    const result2 = await PurchaseBookService.getPurchaseBookSummary({
      date_from: lastMonth.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    }, 'day');

    console.log(`Total de días con compras: ${result2.summary.length}`);
    console.log(`\nResumen General:`);
    console.log(`Total compras: ${result2.grandTotal.total_compras}`);
    console.log(`Subtotal: L ${result2.grandTotal.subtotal_total.toFixed(2)}`);
    console.log(`Descuento: L ${result2.grandTotal.descuento_total.toFixed(2)}`);
    console.log(`Flete: L ${result2.grandTotal.flete_total.toFixed(2)}`);
    console.log(`Impuesto: L ${result2.grandTotal.impuesto_total.toFixed(2)}`);
    console.log(`TOTAL: L ${result2.grandTotal.total_total.toFixed(2)}`);

    if (result2.summary.length > 0) {
      console.log('\n📅 Primeros 5 días:');
      result2.summary.slice(0, 5).forEach((day, index) => {
        console.log(`\n${index + 1}. ${day.group_label}`);
        console.log(`   Compras: ${day.total_compras}`);
        console.log(`   Total: L ${parseFloat(day.total_total).toFixed(2)}`);
      });
    }

    // Test 3: Filtrar por estado de pago
    console.log('\n\n💰 TEST 3: Compras pendientes de pago\n');
    const result3 = await PurchaseBookService.getPurchaseBook({
      date_from: lastMonth.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
      payment_status: 'pending'
    });

    console.log(`Total compras pendientes: ${result3.totals.total_registros}`);
    console.log(`Saldo pendiente: L ${result3.totals.saldo_total.toFixed(2)}`);

    if (result3.purchases.length > 0) {
      console.log('\n📋 Compras pendientes:');
      result3.purchases.forEach((purchase, index) => {
        console.log(`\n${index + 1}. ${purchase.nro_documento}`);
        console.log(`   Proveedor: ${purchase.proveedor}`);
        console.log(`   Total: L ${parseFloat(purchase.total).toFixed(2)}`);
        console.log(`   Abonado: L ${parseFloat(purchase.abonado).toFixed(2)}`);
        console.log(`   Saldo: L ${parseFloat(purchase.saldo).toFixed(2)}`);
      });
    }

    // Test 4: Exportar datos
    console.log('\n\n📤 TEST 4: Exportar libro de compras\n');
    const result4 = await PurchaseBookService.exportPurchaseBook({
      date_from: lastMonth.toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0]
    });

    console.log(`Archivo sugerido: ${result4.filename}`);
    console.log(`Total de registros a exportar: ${result4.data.length}`);
    console.log(`Columnas del export:`, Object.keys(result4.data[0] || {}));

    console.log('\n' + '='.repeat(70));
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', error);
    console.error('Stack:', error.stack);
  } finally {
    // Cerrar conexión a la base de datos
    await db.close();
    process.exit(0);
  }
}

// Ejecutar las pruebas
testPurchaseBook();
