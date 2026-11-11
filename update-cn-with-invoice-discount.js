require('dotenv').config();
const db = require('./src/utils/database');

async function updateCNWithInvoiceDiscount() {
  try {
    console.log('=== ACTUALIZANDO NOTAS DE CRÉDITO CON DESCUENTO DE FACTURA ===\n');

    const creditNotes = await db.query(`
      SELECT
        cn.id,
        cn.discount,
        i.discount_amount as invoice_discount
      FROM credit_notes cn
      INNER JOIN invoices i ON cn.invoice_id = i.id
      WHERE cn.deleted_at IS NULL
    `);

    console.log(`Procesando ${creditNotes.length} notas de crédito...\n`);

    for (const cn of creditNotes) {
      const invoiceDiscount = parseFloat(cn.invoice_discount);
      const currentDiscount = parseFloat(cn.discount);

      if (invoiceDiscount > 0 && Math.abs(currentDiscount - invoiceDiscount) > 0.01) {
        console.log(`CN ID ${cn.id}:`);
        console.log(`  Descuento actual: ${currentDiscount}`);
        console.log(`  Descuento de factura: ${invoiceDiscount}`);

        await db.query(`
          UPDATE credit_notes
          SET discount = ?
          WHERE id = ?
        `, [invoiceDiscount, cn.id]);

        console.log(`  ✓ Actualizado a ${invoiceDiscount}\n`);
      } else {
        console.log(`CN ID ${cn.id}: Sin cambios (descuento = ${currentDiscount})`);
      }
    }

    console.log('\n=== VERIFICACIÓN ===\n');
    const verification = await db.query(`
      SELECT
        cn.id,
        cn.subtotal,
        cn.discount,
        cn.shipping_cost,
        cn.tax,
        cn.total,
        (cn.subtotal + cn.shipping_cost + cn.tax) as calculated_total,
        ABS(cn.total - (cn.subtotal + cn.shipping_cost + cn.tax)) as diff
      FROM credit_notes cn
      WHERE cn.deleted_at IS NULL
      ORDER BY cn.id
    `);

    console.table(verification);

    const allCorrect = verification.every(v => parseFloat(v.diff) < 0.01);
    console.log(allCorrect ? '\n✓ TODAS LAS NC CUADRAN' : '\n✗ HAY NC CON DIFERENCIAS');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateCNWithInvoiceDiscount();
