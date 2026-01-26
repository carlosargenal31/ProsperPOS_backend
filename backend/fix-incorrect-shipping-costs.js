require('dotenv').config();
const db = require('./src/utils/database');

async function fixIncorrectShippingCosts() {
  try {
    console.log('=== CORRIGIENDO SHIPPING_COST INCORRECTO ===\n');

    // Invoices 43 and 106 have shipping_cost that was never included in totals
    const problematicInvoices = [43, 106];

    console.log('Corrigiendo facturas 43 y 106...\n');

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

    console.log('Corrigiendo notas de crédito asociadas...\n');

    // Fix credit notes 12 (invoice 43) and 15 (invoice 106)
    const problematicCNs = [
      { id: 12, invoice_id: 43 },
      { id: 15, invoice_id: 106 }
    ];

    for (const cn of problematicCNs) {
      const creditNote = await db.query(
        'SELECT * FROM credit_notes WHERE id = ?',
        [cn.id]
      );

      if (creditNote.length > 0) {
        const cnData = creditNote[0];
        console.log(`Nota de Crédito ${cn.id} (Factura ${cn.invoice_id}):`);
        console.log(`  Antes: shipping_cost = ${cnData.shipping_cost}`);
        console.log(`  Total = ${cnData.total} (correcto, no incluye shipping)`);

        await db.query(
          'UPDATE credit_notes SET shipping_cost = 0.00 WHERE id = ?',
          [cn.id]
        );

        console.log(`  Después: shipping_cost = 0.00`);
        console.log(`  ✓ Corregido\n`);
      }
    }

    console.log('Verificando...\n');
    const verification = await db.query(`
      SELECT
        'INVOICE' as type,
        id,
        invoice_number as number,
        subtotal,
        discount_amount,
        shipping_cost,
        tax_amount,
        total,
        (subtotal - discount_amount + shipping_cost + tax_amount) as calculated
      FROM invoices
      WHERE id IN (43, 106)

      UNION ALL

      SELECT
        'CREDIT_NOTE' as type,
        id,
        CONCAT('CN-', id) as number,
        subtotal,
        discount,
        shipping_cost,
        tax,
        total,
        (subtotal + shipping_cost + tax) as calculated
      FROM credit_notes
      WHERE id IN (12, 15)
    `);

    console.table(verification);

    console.log('\n✓ CORRECCIÓN COMPLETADA');
    console.log('Las facturas 43 y 106 y sus notas de crédito ahora tienen shipping_cost = 0');
    console.log('Los totales ya eran correctos sin incluir shipping.\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIncorrectShippingCosts();
