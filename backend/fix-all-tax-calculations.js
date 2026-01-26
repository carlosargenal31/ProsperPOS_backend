require('dotenv').config();
const db = require('./src/utils/database');

async function fixAllTaxCalculations() {
  try {
    console.log('=== CORRIGIENDO CÁLCULOS DE IMPUESTO ===\n');

    // Obtener facturas con tax incorrecto
    const invoices = await db.query(`
      SELECT
        id,
        invoice_number,
        subtotal,
        discount_amount,
        shipping_cost,
        tax_amount,
        total,
        ((subtotal - discount_amount + shipping_cost) * 0.15) as correct_tax,
        ABS(tax_amount - ((subtotal - discount_amount + shipping_cost) * 0.15)) as diff
      FROM invoices
      WHERE deleted_at IS NULL
      AND DATE(issue_date) >= '2026-01-20'
      AND DATE(issue_date) <= '2026-01-23'
      AND ABS(tax_amount - ((subtotal - discount_amount + shipping_cost) * 0.15)) > 0.5
      ORDER BY diff DESC
    `);

    if (invoices.length === 0) {
      console.log('✓ No hay facturas con impuestos incorrectos\n');
      process.exit(0);
    }

    console.log(`Encontradas ${invoices.length} facturas con impuestos incorrectos:\n`);

    let totalDiff = 0;
    invoices.forEach(inv => {
      const diff = parseFloat(inv.tax_amount) - parseFloat(inv.correct_tax);
      totalDiff += diff;
      console.log(`ID ${inv.id} - ${inv.invoice_number}:`);
      console.log(`  Tax actual: ${inv.tax_amount}`);
      console.log(`  Tax correcto: ${parseFloat(inv.correct_tax).toFixed(2)}`);
      console.log(`  Diferencia: ${diff.toFixed(2)}\n`);
    });

    console.log(`Total diferencia acumulada: ${totalDiff.toFixed(2)}\n`);

    // Si la diferencia total es cercana a 18.42, estas son las facturas problemáticas
    if (Math.abs(totalDiff - 18.365) < 5) {
      console.log('✓ ESTAS FACTURAS EXPLICAN LA DIFERENCIA DE 18.42!\n');
    }

    console.log('¿Deseas corregir estos impuestos automáticamente?');
    console.log('Esto recalculará tax_amount y total para cada factura.');
    console.log('\nPara ejecutar la corrección, descomenta las líneas de UPDATE en este script.\n');

    // DESCOMENTAR ESTAS LÍNEAS PARA APLICAR LA CORRECCIÓN:
    /*
    for (const inv of invoices) {
      const correctTax = parseFloat(inv.correct_tax).toFixed(2);
      const newTotal = (parseFloat(inv.subtotal) - parseFloat(inv.discount_amount) + parseFloat(inv.shipping_cost) + parseFloat(correctTax)).toFixed(2);

      await db.query(`
        UPDATE invoices
        SET tax_amount = ?, total = ?
        WHERE id = ?
      `, [correctTax, newTotal, inv.id]);

      console.log(`✓ Factura ${inv.id} actualizada: tax = ${correctTax}, total = ${newTotal}`);
    }

    console.log('\n✓ CORRECCIÓN COMPLETADA');
    */

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAllTaxCalculations();
