require('dotenv').config();
const SalesBookService = require('./src/services/sales-book.service');

async function testSalesBookService() {
  try {
    console.log('=== PROBANDO SERVICIO DE LIBRO DE VENTAS ===');
    console.log('Rango: 2026-01-20 al 2026-01-23\n');

    const result = await SalesBookService.getSalesBook({
      date_from: '2026-01-20',
      date_to: '2026-01-23'
    });

    console.log('FACTURAS Y DEVOLUCIONES:\n');
    console.log(`Total registros: ${result.invoices.length}\n`);

    // Mostrar primeras 10 facturas
    console.log('Primeras 10 facturas:');
    console.table(result.invoices.slice(0, 10).map(inv => ({
      tipo: inv.tipo_documento,
      numero: inv.nro_documento,
      subtotal: inv.subtotal,
      descuento: inv.descuento,
      recargos: inv.recargos,
      impuesto: inv.impuesto,
      total: inv.total,
      devuelto: inv.devuelto,
      tipo_fila: inv.tipo_fila
    })));

    // Mostrar devoluciones
    const devoluciones = result.invoices.filter(inv => inv.tipo_fila === 'DEVOLUCION');
    console.log(`\nDEVOLUCIONES (${devoluciones.length}):`);
    console.table(devoluciones.map(dev => ({
      tipo: dev.tipo_documento,
      numero: dev.nro_documento,
      subtotal: dev.subtotal,
      descuento: dev.descuento,
      recargos: dev.recargos,
      impuesto: dev.impuesto,
      total: dev.total,
      devuelto: dev.devuelto
    })));

    // Mostrar facturas devueltas
    const returned = result.invoices.filter(inv => inv.tipo_fila === 'FACTURA' && inv.estatus_raw === 'returned');
    console.log(`\nFACTURAS DEVUELTAS (${returned.length}):`);
    console.table(returned.map(ret => ({
      numero: ret.nro_documento,
      subtotal: ret.subtotal,
      descuento: ret.descuento,
      recargos: ret.recargos,
      impuesto: ret.impuesto,
      total: ret.total,
      devuelto: ret.devuelto
    })));

    console.log('\n=== TOTALES ===\n');
    console.log('Total Facturas:', result.totals.total_facturas);
    console.log('Total Devoluciones:', result.totals.total_devoluciones);
    console.log('Total Registros:', result.totals.total_registros);
    console.log('');
    console.log('Subtotal Total:', result.totals.subtotal_total.toFixed(2));
    console.log('Descuento Total:', result.totals.descuento_total.toFixed(2));
    console.log('Recargos Total:', result.totals.recargos_total.toFixed(2));
    console.log('Impuesto Total:', result.totals.impuesto_total.toFixed(2));
    console.log('Total Total:', result.totals.total_total.toFixed(2));
    console.log('Devuelto Total:', result.totals.total_devuelto.toFixed(2));

    console.log('\n=== VERIFICACIÓN (NUEVA FÓRMULA: SUBTOTAL_NETO + RECARGOS + IMPUESTO = TOTAL) ===');
    const calculated = result.totals.subtotal_total + result.totals.recargos_total + result.totals.impuesto_total;
    console.log('Subtotal_neto + Recargos + Impuesto =', calculated.toFixed(2));
    console.log('Debe ser igual al Total:', result.totals.total_total.toFixed(2));

    const diferencia = Math.abs(result.totals.total_total - calculated);
    console.log('Diferencia:', diferencia.toFixed(2));
    console.log(diferencia < 0.01 ? '✓ CUADRA' : '✗ NO CUADRA');

    console.log('\n=== COMPARACIÓN CON VALORES ESPERADOS ===');
    console.log('Impuesto esperado: 17,169.20');
    console.log('Impuesto actual:', result.totals.impuesto_total.toFixed(2));
    console.log('Diferencia:', Math.abs(17169.20 - result.totals.impuesto_total).toFixed(2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSalesBookService();
