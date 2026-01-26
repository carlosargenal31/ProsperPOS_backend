require('dotenv').config();
const SalesBookService = require('./src/services/sales-book.service');

async function checkRecargos() {
  try {
    const result = await SalesBookService.getSalesBook({
      date_from: '2026-01-20',
      date_to: '2026-01-23'
    });

    console.log('=== ANÁLISIS DE RECARGOS ===\n');

    const facturasConRecargos = result.invoices.filter(inv =>
      inv.tipo_fila === 'FACTURA' && parseFloat(inv.recargos) !== 0
    );

    console.log(`Facturas con recargos (${facturasConRecargos.length}):`);
    let totalFacturasRecargos = 0;
    facturasConRecargos.forEach(inv => {
      const recargos = parseFloat(inv.recargos);
      totalFacturasRecargos += recargos;
      console.log(`  ${inv.nro_documento}: recargos = ${recargos.toFixed(2)}, estatus = ${inv.estatus}`);
    });
    console.log(`Total recargos de facturas: ${totalFacturasRecargos.toFixed(2)}\n`);

    const devolucionesConRecargos = result.invoices.filter(inv =>
      inv.tipo_fila === 'DEVOLUCION' && parseFloat(inv.recargos) !== 0
    );

    console.log(`Devoluciones con recargos (${devolucionesConRecargos.length}):`);
    let totalDevolucionesRecargos = 0;
    devolucionesConRecargos.forEach(inv => {
      const recargos = parseFloat(inv.recargos);
      totalDevolucionesRecargos += recargos;
      console.log(`  ${inv.nro_documento}: recargos = ${recargos.toFixed(2)}`);
    });
    console.log(`Total recargos de devoluciones: ${totalDevolucionesRecargos.toFixed(2)}\n`);

    const totalNeto = totalFacturasRecargos + totalDevolucionesRecargos;
    console.log('=== RESULTADO ===');
    console.log(`Recargos facturas: ${totalFacturasRecargos.toFixed(2)}`);
    console.log(`Recargos devoluciones: ${totalDevolucionesRecargos.toFixed(2)}`);
    console.log(`Total NETO: ${totalNeto.toFixed(2)}`);
    console.log(`Total del servicio: ${result.totals.recargos_total}`);
    console.log(`Esperado del Excel: 1600`);
    console.log(`Diferencia: ${(totalNeto - 1600).toFixed(2)}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecargos();
