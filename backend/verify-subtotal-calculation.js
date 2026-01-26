const db = require('./src/utils/database');

async function verifySubtotal() {
  try {
    console.log('🔍 Verificando cálculo de subtotales en libro de ventas...\n');

    const query = `
      SELECT
        i.invoice_number,
        i.invoice_type,
        i.subtotal as subtotal_db,
        i.discount_amount,
        (i.subtotal + i.discount_amount) as subtotal_bruto,
        i.tax_amount,
        i.shipping_cost as recargos,
        i.total,
        i.payment_status
      FROM invoices i
      WHERE DATE(i.issue_date) BETWEEN '2026-01-20' AND '2026-01-23'
      AND i.deleted_at IS NULL
      ORDER BY i.issue_date DESC
      LIMIT 10
    `;

    const results = await db.execute(query);

    console.log('=' .repeat(140));
    console.log(
      'Nro Factura'.padEnd(15) +
      'Tipo'.padEnd(12) +
      'Subtotal DB'.padStart(13) +
      'Descuento'.padStart(13) +
      'Subtotal Bruto'.padStart(15) +
      'Impuesto'.padStart(13) +
      'Recargos'.padStart(13) +
      'Total'.padStart(13) +
      'Estado'.padEnd(12)
    );
    console.log('=' .repeat(140));

    results.forEach(row => {
      console.log(
        row.invoice_number.padEnd(15) +
        row.invoice_type.toUpperCase().padEnd(12) +
        parseFloat(row.subtotal_db || 0).toFixed(2).padStart(13) +
        parseFloat(row.discount_amount || 0).toFixed(2).padStart(13) +
        parseFloat(row.subtotal_bruto || 0).toFixed(2).padStart(15) +
        parseFloat(row.tax_amount || 0).toFixed(2).padStart(13) +
        parseFloat(row.recargos || 0).toFixed(2).padStart(13) +
        parseFloat(row.total || 0).toFixed(2).padStart(13) +
        row.payment_status.padEnd(12)
      );
    });

    console.log('=' .repeat(140));
    console.log('\n📊 EXPLICACIÓN:');
    console.log('- "Subtotal DB" = Valor almacenado en la BD (ya tiene descuento aplicado)');
    console.log('- "Subtotal Bruto" = Subtotal DB + Descuento (valor SIN descuentos)');
    console.log('- El libro de ventas debe mostrar "Subtotal Bruto" en la columna Subtotal\n');

    console.log('✅ Verificación completada');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifySubtotal();
