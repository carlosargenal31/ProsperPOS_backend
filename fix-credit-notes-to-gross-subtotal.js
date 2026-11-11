require('dotenv').config();
const db = require('./src/utils/database');

async function fixCreditNotesToGrossSubtotal() {
  try {
    console.log('=== ACTUALIZANDO NOTAS DE CRÉDITO A SUBTOTAL BRUTO ===\n');

    const creditNotes = await db.query(`
      SELECT
        cn.id as cn_id,
        cn.subtotal as cn_subtotal,
        cn.discount as cn_discount,
        cn.shipping_cost as cn_shipping,
        cn.tax as cn_tax,
        cn.total as cn_total,
        i.subtotal as i_subtotal,
        i.discount_amount as i_discount,
        i.shipping_cost as i_shipping,
        i.tax_amount as i_tax,
        i.total as i_total
      FROM credit_notes cn
      INNER JOIN invoices i ON cn.invoice_id = i.id
      WHERE cn.deleted_at IS NULL
    `);

    console.log(`Actualizando ${creditNotes.length} notas de crédito...\n`);

    for (const cn of creditNotes) {
      const subtotalBruto = parseFloat(cn.i_subtotal);
      const descuento = parseFloat(cn.i_discount);
      const recargos = parseFloat(cn.i_shipping);

      console.log(`NC ID ${cn.cn_id}:`);
      console.log(`  Subtotal bruto: ${subtotalBruto.toFixed(2)}`);
      console.log(`  Descuento: ${descuento.toFixed(2)}`);
      console.log(`  Recargos: ${recargos.toFixed(2)}`);
      console.log(`  Impuesto: ${cn.i_tax}`);
      console.log(`  Total: ${cn.cn_total}`);
      console.log(`  Verificación: ${subtotalBruto.toFixed(2)} - ${descuento.toFixed(2)} + ${recargos.toFixed(2)} + ${cn.i_tax} = ${(subtotalBruto - descuento + recargos + parseFloat(cn.i_tax)).toFixed(2)}`);

      await db.query(`
        UPDATE credit_notes
        SET
          subtotal = ?,
          discount = ?,
          shipping_cost = ?
        WHERE id = ?
      `, [subtotalBruto.toFixed(2), descuento.toFixed(2), recargos.toFixed(2), cn.cn_id]);

      console.log(`  ✓ Actualizado\n`);
    }

    console.log('Verificando...\n');
    const verification = await db.query(`
      SELECT
        cn.id,
        cn.subtotal,
        cn.discount,
        cn.shipping_cost,
        cn.tax,
        cn.total,
        (cn.subtotal - cn.discount + cn.shipping_cost + cn.tax) as calculated_total,
        ABS(cn.total - (cn.subtotal - cn.discount + cn.shipping_cost + cn.tax)) as difference
      FROM credit_notes cn
      WHERE cn.deleted_at IS NULL
      ORDER BY cn.id DESC
      LIMIT 10
    `);

    console.table(verification);

    const allCorrect = verification.every(v => parseFloat(v.difference) < 0.01);
    console.log(allCorrect ? '\n✓ TODAS LAS NOTAS DE CRÉDITO CUADRAN (SUBTOTAL - DESCUENTO + RECARGOS + IMPUESTO = TOTAL)' : '\n✗ HAY NOTAS CON DIFERENCIAS');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCreditNotesToGrossSubtotal();
