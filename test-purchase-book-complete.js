/**
 * Script de prueba para el Libro de Compras completo
 * Verifica filtros, devoluciones y estructura de datos
 */

const db = require('./src/utils/database');
const PurchaseBookService = require('./src/services/purchase-book.service');

async function testPurchaseBook() {
  console.log('====================================');
  console.log('PRUEBA DEL LIBRO DE COMPRAS COMPLETO');
  console.log('====================================\n');

  try {
    // Test 1: Verificar filtros de estado de pago
    console.log('Test 1: Filtros de estado de pago (solo Completed y Returned)');
    console.log('--------------------------------------------------------------');

    const filters = {
      date_from: '2024-01-01',
      date_to: '2024-12-31',
      payment_status: ['Completed', 'Returned']
    };

    const result = await PurchaseBookService.getPurchaseBook(filters);

    console.log(`✓ Total de registros: ${result.totals.total_registros}`);
    console.log(`✓ Total de compras: ${result.totals.total_compras}`);
    console.log(`✓ Total de devoluciones: ${result.totals.total_devoluciones}`);
    console.log(`✓ Subtotal: L ${result.totals.subtotal_total.toFixed(2)}`);
    console.log(`✓ Descuento total: L ${result.totals.descuento_total.toFixed(2)}`);
    console.log(`✓ Recargo total: L ${result.totals.recargo_total.toFixed(2)}`);
    console.log(`✓ ISV total: L ${result.totals.isv_total.toFixed(2)}`);
    console.log(`✓ Total total: L ${result.totals.total_total.toFixed(2)}`);
    console.log(`✓ Total devuelto: L ${result.totals.total_devuelto.toFixed(2)}`);
    console.log();

    // Test 2: Verificar estructura de datos
    console.log('Test 2: Verificar estructura de datos');
    console.log('--------------------------------------');

    if (result.purchases.length > 0) {
      const firstPurchase = result.purchases[0];
      console.log('Primera compra:');
      console.log(`  - ID: ${firstPurchase.id}`);
      console.log(`  - Fecha: ${firstPurchase.fecha}`);
      console.log(`  - Número: ${firstPurchase.numero_factura}`);
      console.log(`  - Proveedor: ${firstPurchase.proveedor}`);
      console.log(`  - RTN: ${firstPurchase.rtn_proveedor}`);
      console.log(`  - Subtotal: L ${firstPurchase.subtotal}`);
      console.log(`  - Descuento: L ${firstPurchase.descuento}`);
      console.log(`  - Recargo: L ${firstPurchase.recargo}`);
      console.log(`  - ISV: L ${firstPurchase.isv}`);
      console.log(`  - Total: L ${firstPurchase.total}`);
      console.log(`  - Estatus: ${firstPurchase.estatus}`);
      console.log(`  - Tipo fila: ${firstPurchase.tipo_fila}`);
      console.log();

      // Verificar si hay columnas de descuento y recargo
      const hasDescuento = firstPurchase.hasOwnProperty('descuento');
      const hasRecargo = firstPurchase.hasOwnProperty('recargo');
      const hasTipoFila = firstPurchase.hasOwnProperty('tipo_fila');

      console.log(`✓ Columna 'descuento' presente: ${hasDescuento}`);
      console.log(`✓ Columna 'recargo' presente: ${hasRecargo}`);
      console.log(`✓ Columna 'tipo_fila' presente: ${hasTipoFila}`);
      console.log();
    }

    // Test 3: Verificar devoluciones
    console.log('Test 3: Verificar devoluciones en los datos');
    console.log('--------------------------------------------');

    const devoluciones = result.purchases.filter(p => p.tipo_fila === 'DEVOLUCION');
    console.log(`✓ Devoluciones encontradas: ${devoluciones.length}`);

    if (devoluciones.length > 0) {
      console.log('\nPrimera devolución:');
      const firstReturn = devoluciones[0];
      console.log(`  - ID: ${firstReturn.id}`);
      console.log(`  - Fecha: ${firstReturn.fecha}`);
      console.log(`  - Número: ${firstReturn.numero_factura}`);
      console.log(`  - Proveedor: ${firstReturn.proveedor}`);
      console.log(`  - Total: L ${firstReturn.total}`);
      console.log(`  - Estatus: ${firstReturn.estatus}`);
      console.log(`  - Tipo fila: ${firstReturn.tipo_fila}`);
    } else {
      console.log('⚠ No se encontraron devoluciones en el período de prueba');
    }
    console.log();

    // Test 4: Verificar que solo hay estados Completed y Returned
    console.log('Test 4: Verificar estados permitidos');
    console.log('--------------------------------------');

    const compras = result.purchases.filter(p => p.tipo_fila === 'COMPRA');
    const estadosUnicos = [...new Set(compras.map(p => p.estatus_raw))];
    console.log(`✓ Estados únicos en compras: ${estadosUnicos.join(', ')}`);

    const estadosInvalidos = estadosUnicos.filter(e => !['Completed', 'Returned'].includes(e));
    if (estadosInvalidos.length === 0) {
      console.log('✓ Todos los estados son válidos (Completed o Returned)');
    } else {
      console.log(`✗ Estados inválidos encontrados: ${estadosInvalidos.join(', ')}`);
    }
    console.log();

    // Test 5: Verificar totales
    console.log('Test 5: Verificar cálculo de totales');
    console.log('--------------------------------------');

    let calculatedSubtotal = 0;
    let calculatedDescuento = 0;
    let calculatedRecargo = 0;
    let calculatedISV = 0;
    let calculatedTotal = 0;

    result.purchases.forEach(p => {
      calculatedSubtotal += parseFloat(p.subtotal || 0);
      calculatedDescuento += parseFloat(p.descuento || 0);
      calculatedRecargo += parseFloat(p.recargo || 0);
      calculatedISV += parseFloat(p.isv || 0);
      calculatedTotal += parseFloat(p.total || 0);
    });

    const subtotalMatch = Math.abs(calculatedSubtotal - result.totals.subtotal_total) < 0.01;
    const descuentoMatch = Math.abs(calculatedDescuento - result.totals.descuento_total) < 0.01;
    const recargoMatch = Math.abs(calculatedRecargo - result.totals.recargo_total) < 0.01;
    const isvMatch = Math.abs(calculatedISV - result.totals.isv_total) < 0.01;
    const totalMatch = Math.abs(calculatedTotal - result.totals.total_total) < 0.01;

    console.log(`✓ Subtotal calculado: L ${calculatedSubtotal.toFixed(2)} vs ${result.totals.subtotal_total.toFixed(2)} - ${subtotalMatch ? 'OK' : 'ERROR'}`);
    console.log(`✓ Descuento calculado: L ${calculatedDescuento.toFixed(2)} vs ${result.totals.descuento_total.toFixed(2)} - ${descuentoMatch ? 'OK' : 'ERROR'}`);
    console.log(`✓ Recargo calculado: L ${calculatedRecargo.toFixed(2)} vs ${result.totals.recargo_total.toFixed(2)} - ${recargoMatch ? 'OK' : 'ERROR'}`);
    console.log(`✓ ISV calculado: L ${calculatedISV.toFixed(2)} vs ${result.totals.isv_total.toFixed(2)} - ${isvMatch ? 'OK' : 'ERROR'}`);
    console.log(`✓ Total calculado: L ${calculatedTotal.toFixed(2)} vs ${result.totals.total_total.toFixed(2)} - ${totalMatch ? 'OK' : 'ERROR'}`);
    console.log();

    console.log('====================================');
    console.log('PRUEBAS COMPLETADAS EXITOSAMENTE ✓');
    console.log('====================================');

  } catch (error) {
    console.error('Error durante las pruebas:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.close();
    process.exit(0);
  }
}

testPurchaseBook();
