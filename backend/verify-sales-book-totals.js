require('dotenv').config();
const db = require('./src/utils/database');

async function verifySalesBookTotals() {
  try {
    console.log('=== VERIFICANDO TOTALES LIBRO DE VENTAS ===');
    console.log('Rango: 2026-01-20 al 2026-01-23\n');

    // Obtener facturas
    console.log('1. FACTURAS:\n');
    const facturas = await db.query(`
      SELECT
        i.id,
        i.invoice_number,
        DATE(i.issue_date) as fecha,
        i.payment_status,
        COALESCE(i.subtotal, 0) as subtotal,
        CASE WHEN i.payment_status = 'returned' THEN 0 ELSE COALESCE(i.discount_amount, 0) END as descuento,
        CASE WHEN i.payment_status = 'returned' THEN 0 ELSE COALESCE(i.shipping_cost, 0) END as recargos,
        COALESCE(i.tax_amount, 0) as impuesto,
        COALESCE(i.total, 0) as total,
        COALESCE(
          (SELECT ABS(SUM(cn.total))
           FROM credit_notes cn
           WHERE cn.invoice_id = i.id
           AND cn.deleted_at IS NULL),
          0
        ) as devuelto,
        'FACTURA' as tipo
      FROM invoices i
      WHERE i.deleted_at IS NULL
        AND DATE(i.issue_date) >= '2026-01-20'
        AND DATE(i.issue_date) <= '2026-01-23'
      ORDER BY i.issue_date DESC
    `);

    console.table(facturas);

    // Obtener notas de crédito
    console.log('\n2. NOTAS DE CRÉDITO (DEVOLUCIONES):\n');
    const notasCredito = await db.query(`
      SELECT
        cn.id,
        CONCAT('NC-', COALESCE(cn.credit_note_number, LPAD(cn.id, 6, '0'))) as numero,
        DATE(cn.emission_date) as fecha,
        -COALESCE(cn.subtotal, 0) as subtotal,
        0 as descuento,
        -COALESCE(cn.shipping_cost, 0) as recargos,
        -COALESCE(cn.tax, 0) as impuesto,
        -COALESCE(cn.total, 0) as total,
        0 as devuelto,
        'DEVOLUCION' as tipo
      FROM credit_notes cn
      WHERE cn.deleted_at IS NULL
        AND DATE(cn.emission_date) >= '2026-01-20'
        AND DATE(cn.emission_date) <= '2026-01-23'
      ORDER BY cn.emission_date DESC
    `);

    console.table(notasCredito);

    // Calcular totales
    let totales = {
      facturas: 0,
      devoluciones: 0,
      subtotal: 0,
      descuento: 0,
      recargos: 0,
      impuesto: 0,
      total: 0,
      devuelto: 0
    };

    facturas.forEach(f => {
      if (f.payment_status !== 'returned') {
        totales.facturas++;
      }
      totales.subtotal += parseFloat(f.subtotal);
      totales.descuento += parseFloat(f.descuento);
      totales.recargos += parseFloat(f.recargos);
      totales.impuesto += parseFloat(f.impuesto);
      totales.total += parseFloat(f.total);
      totales.devuelto += parseFloat(f.devuelto);
    });

    notasCredito.forEach(nc => {
      totales.devoluciones++;
      totales.subtotal += parseFloat(nc.subtotal);
      totales.descuento += parseFloat(nc.descuento);
      totales.recargos += parseFloat(nc.recargos);
      totales.impuesto += parseFloat(nc.impuesto);
      totales.total += parseFloat(nc.total);
      totales.devuelto += parseFloat(nc.devuelto);
    });

    console.log('\n=== TOTALES CALCULADOS ===\n');
    console.log('Total Facturas:', totales.facturas);
    console.log('Total Devoluciones:', totales.devoluciones);
    console.log('Total Registros:', facturas.length + notasCredito.length);
    console.log('');
    console.log('Subtotal:', totales.subtotal.toFixed(2));
    console.log('Descuento:', totales.descuento.toFixed(2));
    console.log('Recargos:', totales.recargos.toFixed(2));
    console.log('Impuesto:', totales.impuesto.toFixed(2));
    console.log('Total:', totales.total.toFixed(2));
    console.log('Devuelto:', totales.devuelto.toFixed(2));

    console.log('\n=== VERIFICACIÓN ===');
    console.log('Subtotal - Descuento + Recargos + Impuesto =',
      (totales.subtotal - totales.descuento + totales.recargos + totales.impuesto).toFixed(2));
    console.log('Debe ser igual al Total:', totales.total.toFixed(2));

    const diferencia = Math.abs(totales.total - (totales.subtotal - totales.descuento + totales.recargos + totales.impuesto));
    console.log('Diferencia:', diferencia.toFixed(2));
    console.log(diferencia < 0.01 ? '✓ CUADRA' : '✗ NO CUADRA');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifySalesBookTotals();
