// Prueba directa del servicio de libro de ventas
const SalesBookService = require('./src/services/sales-book.service');

async function testDirecto() {
  try {
    console.log('🔍 PRUEBA DIRECTA DEL SERVICIO DE LIBRO DE VENTAS\n');
    console.log('Consultando datos del 20 al 23 de enero de 2026...\n');

    const result = await SalesBookService.getSalesBook({
      date_from: '2026-01-20',
      date_to: '2026-01-23'
    });

    const invoices = result.invoices;
    const totals = result.totals;

    console.log('='.repeat(130));
    console.log(
      'Nro Doc'.padEnd(18) +
      'Tipo'.padEnd(14) +
      'Subtotal'.padStart(14) +
      'Descuento'.padStart(14) +
      'Impuesto'.padStart(14) +
      'Recargos'.padStart(14) +
      'Total'.padStart(14) +
      'Devuelto'.padStart(14)
    );
    console.log('='.repeat(130));

    // Mostrar las primeras 10 facturas
    invoices.slice(0, 10).forEach(inv => {
      console.log(
        inv.nro_documento.padEnd(18) +
        inv.tipo_documento.padEnd(14) +
        parseFloat(inv.subtotal || 0).toFixed(2).padStart(14) +
        parseFloat(inv.descuento || 0).toFixed(2).padStart(14) +
        parseFloat(inv.impuesto || 0).toFixed(2).padStart(14) +
        parseFloat(inv.recargos || 0).toFixed(2).padStart(14) +
        parseFloat(inv.total || 0).toFixed(2).padStart(14) +
        parseFloat(inv.devuelto || 0).toFixed(2).padStart(14)
      );
    });

    console.log('='.repeat(130));
    console.log('\n📊 TOTALES GENERALES:\n');
    console.log(`Total Facturas:    ${totals.total_facturas || 0}`);
    console.log(`Total Devoluciones: ${totals.total_devoluciones || 0}`);
    console.log(`Subtotal Total:    L ${parseFloat(totals.subtotal_total || 0).toFixed(2)}`);
    console.log(`Descuento Total:   L ${parseFloat(totals.descuento_total || 0).toFixed(2)}`);
    console.log(`Impuesto Total:    L ${parseFloat(totals.impuesto_total || 0).toFixed(2)}`);
    console.log(`Recargos Total:    L ${parseFloat(totals.recargos_total || 0).toFixed(2)}`);
    console.log(`Total General:     L ${parseFloat(totals.total_total || 0).toFixed(2)}`);
    console.log(`Total Devuelto:    L ${parseFloat(totals.total_devuelto || 0).toFixed(2)}`);

    console.log('\n✅ VERIFICACIÓN:');
    if (invoices.length > 0) {
      const primerSubtotal = parseFloat(invoices[0].subtotal || 0);
      const primerDescuento = parseFloat(invoices[0].descuento || 0);
      console.log(`\nPrimera factura (${invoices[0].nro_documento}):`);
      console.log(`  - Subtotal (BRUTO): ${primerSubtotal.toFixed(2)}`);
      console.log(`  - Descuento:        ${primerDescuento.toFixed(2)}`);
      console.log(`  - Subtotal - Descuento = ${(primerSubtotal - primerDescuento).toFixed(2)} (esto debe coincidir con lo que había antes)`);

      if (primerDescuento > 0) {
        console.log('\n✅ El subtotal INCLUYE el descuento sumado (valor bruto)');
        console.log('✅ El descuento se muestra en su propia columna');
      } else {
        console.log('\n⚠️ Esta factura no tiene descuento para verificar');
      }
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDirecto();
