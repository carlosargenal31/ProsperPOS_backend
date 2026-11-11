require('dotenv').config();
const db = require('./src/utils/database');

async function fixCreditNotesToNetSubtotal() {
  try {
    console.log('=== ACTUALIZANDO NOTAS DE CRÉDITO A SUBTOTAL NETO ===\n');
    console.log('Subtotal NETO = Subtotal BRUTO - Descuento\n');

    const creditNotes = await db.query(`
      SELECT
        cn.id,
        cn.subtotal,
        cn.discount,
        cn.shipping_cost,
        cn.tax,
        cn.total
      FROM credit_notes cn
      WHERE cn.deleted_at IS NULL
      ORDER BY cn.id
    `);

    console.log(`Procesando ${creditNotes.length} notas de crédito...\n`);

    for (const cn of creditNotes) {
      const subtotalBruto = parseFloat(cn.subtotal);
      const descuento = parseFloat(cn.discount);
      const recargos = parseFloat(cn.shipping_cost);
      const impuesto = parseFloat(cn.tax);
      const total = parseFloat(cn.total);

      // Calcular subtotal NETO (descuento ya aplicado)
      const subtotalNeto = subtotalBruto - descuento;

      console.log(`NC ID ${cn.id}:`);
      console.log(`  Subtotal BRUTO: ${subtotalBruto.toFixed(2)}`);
      console.log(`  Descuento: ${descuento.toFixed(2)}`);
      console.log(`  Subtotal NETO: ${subtotalNeto.toFixed(2)}`);
      console.log(`  Recargos: ${recargos.toFixed(2)}`);
      console.log(`  Impuesto: ${impuesto.toFixed(2)}`);
      console.log(`  Total: ${total.toFixed(2)}`);
      console.log(`  Verificación: ${subtotalNeto.toFixed(2)} + ${recargos.toFixed(2)} + ${impuesto.toFixed(2)} = ${(subtotalNeto + recargos + impuesto).toFixed(2)}`);

      // Actualizar: subtotal = neto, discount = 0
      await db.query(`
        UPDATE credit_notes
        SET
          subtotal = ?,
          discount = 0.00
        WHERE id = ?
      `, [subtotalNeto.toFixed(2), cn.id]);

      console.log(`  ✓ Actualizado\n`);
    }

    console.log('Verificando...\n');
    const verification = await db.query(`
      SELECT
        cn.id,
        cn.subtotal as subtotal_neto,
        cn.discount,
        cn.shipping_cost as recargos,
        cn.tax as impuesto,
        cn.total,
        (cn.subtotal + cn.shipping_cost + cn.tax) as calculated_total,
        ABS(cn.total - (cn.subtotal + cn.shipping_cost + cn.tax)) as difference
      FROM credit_notes cn
      WHERE cn.deleted_at IS NULL
      ORDER BY cn.id
    `);

    console.table(verification);

    const allCorrect = verification.every(v => parseFloat(v.difference) < 0.01);
    console.log(allCorrect ? '\n✓ TODAS LAS NOTAS DE CRÉDITO CUADRAN (SUBTOTAL_NETO + RECARGOS + IMPUESTO = TOTAL)' : '\n✗ HAY NOTAS CON DIFERENCIAS');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCreditNotesToNetSubtotal();
