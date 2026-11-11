require('dotenv').config();
const db = require('./src/utils/database');

async function analyzeTaxDifference() {
  try {
    console.log('=== ANÁLISIS DETALLADO DE IMPUESTOS ===');
    console.log('Rango: 2026-01-20 al 2026-01-23\n');

    // Obtener facturas agrupadas por fecha
    const byDate = await db.query(`
      SELECT
        DATE(issue_date) as fecha,
        COUNT(*) as cantidad,
        SUM(tax_amount) as total_tax
      FROM invoices
      WHERE deleted_at IS NULL
      AND DATE(issue_date) >= '2026-01-20'
      AND DATE(issue_date) <= '2026-01-23'
      GROUP BY DATE(issue_date)
      ORDER BY fecha
    `);

    console.log('FACTURAS POR FECHA:');
    console.table(byDate);

    const cnByDate = await db.query(`
      SELECT
        DATE(emission_date) as fecha,
        COUNT(*) as cantidad,
        SUM(tax) as total_tax
      FROM credit_notes
      WHERE deleted_at IS NULL
      AND DATE(emission_date) >= '2026-01-20'
      AND DATE(emission_date) <= '2026-01-23'
      GROUP BY DATE(emission_date)
      ORDER BY fecha
    `);

    console.log('\nNOTAS DE CRÉDITO POR FECHA:');
    console.table(cnByDate);

    // Calcular total
    let totalInvoices = 0;
    byDate.forEach(d => totalInvoices += parseFloat(d.total_tax));

    let totalCN = 0;
    cnByDate.forEach(d => totalCN += parseFloat(d.total_tax));

    console.log('\n=== RESUMEN ===');
    console.log('Total impuesto FACTURAS:', totalInvoices.toFixed(2));
    console.log('Total impuesto NC:', totalCN.toFixed(2));
    console.log('NETO:', (totalInvoices - totalCN).toFixed(2));
    console.log('');
    console.log('Valor esperado por usuario: 17169.255');
    console.log('Valor actual:', (totalInvoices - totalCN).toFixed(3));
    console.log('Diferencia:', (totalInvoices - totalCN - 17169.255).toFixed(3));

    // Mostrar todas las facturas con su tax individual
    console.log('\n=== ¿CUÁL FACTURA TIENE 18.42 DE MÁS? ===\n');

    const allInvoices = await db.query(`
      SELECT
        id,
        invoice_number,
        DATE(issue_date) as fecha,
        tax_amount,
        subtotal,
        discount_amount,
        shipping_cost
      FROM invoices
      WHERE deleted_at IS NULL
      AND DATE(issue_date) >= '2026-01-20'
      AND DATE(issue_date) <= '2026-01-23'
      ORDER BY tax_amount DESC
      LIMIT 15
    `);

    console.log('15 facturas con mayor impuesto:');
    console.table(allInvoices);

    console.log('\nSUGERENCIAS:');
    console.log('1. ¿Alguna de estas facturas no debería estar en el rango?');
    console.log('2. ¿Alguna factura tiene tax_amount incorrecto?');
    console.log('3. ¿El impuesto de alguna factura se calculó mal?');
    console.log('\nIndícame el ID de la(s) factura(s) que necesitan corrección.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeTaxDifference();
