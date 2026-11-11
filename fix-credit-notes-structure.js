require('dotenv').config();
const db = require('./src/utils/database');

async function fixCreditNotesStructure() {
  try {
    console.log('=== CORRIGIENDO ESTRUCTURA DE NOTAS DE CRÉDITO ===\n');

    // 1. Agregar columna shipping_cost a credit_notes si no existe
    console.log('1. Agregando columna shipping_cost...');
    try {
      await db.query(`
        ALTER TABLE credit_notes
        ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0.00 AFTER discount
      `);
      console.log('✓ Columna shipping_cost agregada');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ Columna shipping_cost ya existe');
      } else {
        throw error;
      }
    }

    // 2. Obtener todas las notas de crédito con sus facturas originales
    console.log('\n2. Corrigiendo valores de notas de crédito...');
    const creditNotes = await db.query(`
      SELECT
        cn.id as cn_id,
        cn.subtotal as cn_subtotal,
        cn.discount as cn_discount,
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

    console.log(`Encontradas ${creditNotes.length} notas de crédito\n`);

    for (const cn of creditNotes) {
      const correctedSubtotal = parseFloat(cn.i_subtotal);
      const currentSubtotal = parseFloat(cn.cn_subtotal);

      // Solo actualizar si el subtotal está incorrecto
      if (Math.abs(correctedSubtotal - currentSubtotal) > 0.01) {
        console.log(`NC ID ${cn.cn_id}:`);
        console.log(`  Subtotal actual: ${currentSubtotal} -> Correcto: ${correctedSubtotal}`);
        console.log(`  Recargos actual: 0.00 -> Correcto: ${cn.i_shipping}`);

        await db.query(`
          UPDATE credit_notes
          SET
            subtotal = ?,
            shipping_cost = ?
          WHERE id = ?
        `, [correctedSubtotal, cn.i_shipping, cn.cn_id]);

        console.log(`  ✓ Actualizado\n`);
      }
    }

    console.log('3. Verificando correcciones...\n');
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
    console.log(allCorrect ? '\n✓ TODAS LAS NOTAS DE CRÉDITO CUADRAN CORRECTAMENTE' : '\n✗ HAY NOTAS CON DIFERENCIAS');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCreditNotesStructure();
