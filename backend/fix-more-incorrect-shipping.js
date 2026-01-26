require('dotenv').config();
const db = require('./src/utils/database');

async function fixMoreIncorrectShipping() {
  try {
    console.log('=== CORRIGIENDO MÁS SHIPPING_COST INCORRECTO ===\n');

    // Invoices 105, 107, 108 have shipping_cost not included in totals
    const problematicInvoices = [105, 107, 108];

    for (const invoiceId of problematicInvoices) {
      const invoice = await db.query(
        'SELECT * FROM invoices WHERE id = ?',
        [invoiceId]
      );

      if (invoice.length > 0) {
        const inv = invoice[0];
        console.log(`Factura ${inv.invoice_number} (ID: ${invoiceId}):`);
        console.log(`  Antes: shipping_cost = ${inv.shipping_cost}`);
        console.log(`  Total = ${inv.total} (correcto, no incluye shipping)`);

        await db.query(
          'UPDATE invoices SET shipping_cost = 0.00 WHERE id = ?',
          [invoiceId]
        );

        console.log(`  Después: shipping_cost = 0.00`);
        console.log(`  ✓ Corregido\n`);
      }
    }

    console.log('Verificando todas las facturas del rango...\n');
    const verification = await db.query(`
      SELECT
        id,
        invoice_number,
        subtotal,
        discount_amount,
        shipping_cost,
        tax_amount,
        total,
        ((subtotal - discount_amount) + shipping_cost + tax_amount) as calculated_total,
        ABS(total - ((subtotal - discount_amount) + shipping_cost + tax_amount)) as diff
      FROM invoices
      WHERE deleted_at IS NULL
      AND DATE(issue_date) >= '2026-01-20'
      AND DATE(issue_date) <= '2026-01-23'
      AND ABS(total - ((subtotal - discount_amount) + shipping_cost + tax_amount)) > 0.01
    `);

    if (verification.length === 0) {
      console.log('✓ TODAS LAS FACTURAS CUADRAN CORRECTAMENTE\n');
    } else {
      console.log('✗ AÚN HAY FACTURAS CON DIFERENCIAS:\n');
      console.table(verification);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMoreIncorrectShipping();
